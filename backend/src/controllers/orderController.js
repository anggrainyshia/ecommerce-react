const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { Order, OrderItem, OrderTracking, Product, ProductVariant, Payment } = require('../models');
const { getCartItems } = require('./cartController');
const redis = require('../config/redis');
const { generateOrderNumber } = require('../utils/helpers');
const emailService = require('../services/emailService');
const { Coupon } = require('../models');

const cartKey = (userId) => `cart:${userId}`;
const STATUS_FLOW = {
  pending:          ['paid', 'failed'],
  paid:             ['packed', 'failed'],
  packed:           ['shipped'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  failed:           [],
};

const ORDER_INCLUDES = [
  { model: OrderItem, as: 'items' },
  { model: Payment, as: 'payment', attributes: ['status', 'paymentMethod', 'paidAt'] },
  { model: OrderTracking, as: 'tracking', order: [['createdAt', 'ASC']] },
];

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { shippingName, shippingAddress, shippingPhone, notes, customerEmail, couponCode } = req.body;

    const cartItems = await getCartItems(req.user.id);
    if (!cartItems || cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate stock for all items
    for (const item of cartItems) {
      if (item.variantId) {
        const variant = await ProductVariant.findByPk(item.variantId, { transaction: t });
        if (!variant) {
          await t.rollback();
          return res.status(400).json({ error: `Variant for "${item.name}" is no longer available` });
        }
        if (variant.stock < item.quantity) {
          await t.rollback();
          return res.status(400).json({
            error: `Insufficient stock for "${item.name} (${item.variantLabel})". Available: ${variant.stock}`,
          });
        }
      } else {
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (!product || !product.isActive) {
          await t.rollback();
          return res.status(400).json({ error: `Product "${item.name}" is no longer available` });
        }
        if (product.stock < item.quantity) {
          await t.rollback();
          return res.status(400).json({
            error: `Insufficient stock for "${item.name}". Available: ${product.stock}`,
          });
        }
      }
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Apply coupon if provided
    let discountAmount = 0;
    let appliedCouponCode = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ where: { code: couponCode.toUpperCase(), isActive: true } });
      if (coupon && (!coupon.expiresAt || new Date() <= coupon.expiresAt) &&
          (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
          subtotal >= parseFloat(coupon.minOrderAmount)) {
        discountAmount = coupon.discountType === 'percentage'
          ? Math.round(subtotal * (parseFloat(coupon.value) / 100))
          : Math.min(parseFloat(coupon.value), subtotal);
        appliedCouponCode = coupon.code;
        await coupon.increment('usedCount', { transaction: t });
      }
    }
    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Create order
    const order = await Order.create(
      {
        userId: req.user.id,
        orderNumber: generateOrderNumber(),
        shippingName,
        shippingAddress,
        shippingPhone,
        notes,
        totalAmount,
        discountAmount,
        couponCode: appliedCouponCode,
        status: 'pending',
        customerEmail: customerEmail || req.user.email || null,
      },
      { transaction: t }
    );

    // Create order items and decrement stock
    for (const item of cartItems) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
          productName: item.name,
          variantLabel: item.variantLabel || null,
        },
        { transaction: t }
      );

      if (item.variantId) {
        await ProductVariant.decrement('stock', {
          by: item.quantity,
          where: { id: item.variantId },
          transaction: t,
        });
      } else {
        await Product.decrement('stock', {
          by: item.quantity,
          where: { id: item.productId },
          transaction: t,
        });
      }
    }

    // Create pending payment record
    await Payment.create(
      { orderId: order.id, amount: totalAmount, status: 'pending' },
      { transaction: t }
    );

    // Create initial tracking entry
    await OrderTracking.create(
      { orderId: order.id, status: 'pending', note: 'Order placed' },
      { transaction: t }
    );

    await t.commit();

    // Clear cart
    await redis.del(cartKey(req.user.id));

    const fullOrder = await Order.findByPk(order.id, {
      include: ORDER_INCLUDES,
    });

    // Send confirmation email (non-blocking)
    emailService.sendOrderConfirmation(fullOrder).catch((err) =>
      console.error('📧 Email failed:', err.message)
    );

    res.status(201).json({ order: fullOrder });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: ORDER_INCLUDES,
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: ORDER_INCLUDES,
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    await order.update({ status: 'failed' });

    // Restore stock
    const items = await OrderItem.findAll({ where: { orderId: order.id } });
    for (const item of items) {
      if (item.variantId) {
        await ProductVariant.increment('stock', { by: item.quantity, where: { id: item.variantId } });
      } else {
        await Product.increment('stock', { by: item.quantity, where: { id: item.productId } });
      }
    }

    await OrderTracking.create({ orderId: order.id, status: 'failed', note: 'Cancelled by customer' });
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Admin: get all orders
exports.adminGetAll = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.iLike]: `%${search}%` } },
        { shippingName: { [Op.iLike]: `%${search}%` } },
        { customerEmail: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: ORDER_INCLUDES,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ orders: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Admin: update order status
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ['pending', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'failed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status === status) {
      return res.status(400).json({ error: `Order is already ${status}` });
    }

    const nextStatuses = STATUS_FLOW[order.status] || [];
    if (!nextStatuses.includes(status)) {
      return res.status(400).json({ error: `Cannot change status from ${order.status} to ${status}` });
    }

    await order.update({ status });

    const payment = await Payment.findOne({ where: { orderId: order.id } });
    if (payment && (status === 'paid' || status === 'failed')) {
      await payment.update({
        status: status === 'paid' ? 'success' : 'failed',
        paidAt: status === 'paid' ? payment.paidAt || new Date() : null,
      });
    }

    // Create tracking entry
    await OrderTracking.create({ orderId: order.id, status, note: note || null });

    const updatedOrder = await Order.findByPk(order.id, { include: ORDER_INCLUDES });

    // Send status update email (non-blocking)
    emailService.sendStatusUpdate(updatedOrder, status, note).catch(() => {});

    res.json({ order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
