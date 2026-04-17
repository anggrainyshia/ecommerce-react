const midtransClient = require('midtrans-client');
const { Order, Payment } = require('../models');
const crypto = require('crypto');

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * Create a Midtrans Snap transaction token.
 * The frontend will use this token to open the Midtrans payment popup.
 */
exports.createSnapToken = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
      include: [{ model: Payment, as: 'payment' }],
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is no longer pending' });
    }

    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: Math.round(parseFloat(order.totalAmount)),
      },
      customer_details: {
        first_name: order.shippingName,
        phone: order.shippingPhone,
        shipping_address: {
          first_name: order.shippingName,
          phone: order.shippingPhone,
          address: order.shippingAddress,
        },
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/order-success?orderId=${order.id}`,
        error: `${process.env.FRONTEND_URL}/checkout?error=1`,
        pending: `${process.env.FRONTEND_URL}/profile`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    // Save snap token
    if (order.payment) {
      await order.payment.update({ snapToken: transaction.token, transactionId: order.orderNumber });
    } else {
      await Payment.create({
        orderId: order.id,
        amount: order.totalAmount,
        snapToken: transaction.token,
        transactionId: order.orderNumber,
        status: 'pending',
      });
    }

    res.json({ snapToken: transaction.token, redirectUrl: transaction.redirect_url });
  } catch (err) {
    console.error('Midtrans error:', err);
    res.status(500).json({ error: 'Failed to create payment token' });
  }
};

/**
 * Midtrans webhook handler.
 * Midtrans calls this endpoint to notify payment status changes.
 */
exports.webhook = async (req, res) => {
  try {
    const notification = req.body;

    // Verify signature
    const hash = crypto
      .createHash('sha512')
      .update(
        `${notification.order_id}${notification.status_code}${notification.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`
      )
      .digest('hex');

    if (hash !== notification.signature_key) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const { order_id, transaction_status, fraud_status, payment_type } = notification;

    const order = await Order.findOne({
      where: { orderNumber: order_id },
      include: [{ model: Payment, as: 'payment' }],
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        paymentStatus = 'success';
        orderStatus = 'paid';
      }
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      paymentStatus = 'failed';
      orderStatus = 'failed';
    }

    if (order.payment) {
      await order.payment.update({
        status: paymentStatus,
        paymentMethod: payment_type,
        paidAt: paymentStatus === 'success' ? new Date() : null,
        rawResponse: notification,
      });
    }

    await order.update({ status: orderStatus });

    res.json({ message: 'Notification processed' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Mock payment for development / demo without Midtrans keys.
 */
exports.mockPayment = async (req, res) => {
  try {
    const { action } = req.body; // 'pay' | 'fail'
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
      include: [{ model: Payment, as: 'payment' }],
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is no longer pending' });
    }

    const isSuccess = action !== 'fail';
    const paymentStatus = isSuccess ? 'success' : 'failed';
    const orderStatus = isSuccess ? 'paid' : 'failed';

    if (order.payment) {
      await order.payment.update({
        status: paymentStatus,
        paymentMethod: 'mock',
        paidAt: isSuccess ? new Date() : null,
      });
    }

    await order.update({ status: orderStatus });

    res.json({ message: `Payment ${paymentStatus}`, order: { ...order.toJSON(), status: orderStatus } });
  } catch (err) {
    res.status(500).json({ error: 'Mock payment failed' });
  }
};
