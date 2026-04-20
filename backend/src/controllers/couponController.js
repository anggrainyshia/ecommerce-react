const { Coupon } = require('../models');
const { Op } = require('sequelize');

exports.validate = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ where: { code: code.toUpperCase(), isActive: true } });

    if (!coupon) return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }
    if (orderTotal < parseFloat(coupon.minOrderAmount)) {
      return res.status(400).json({
        error: `Minimum order amount is Rp ${Number(coupon.minOrderAmount).toLocaleString('id-ID')}`,
      });
    }

    const discountAmount = coupon.discountType === 'percentage'
      ? Math.round(orderTotal * (parseFloat(coupon.value) / 100))
      : Math.min(parseFloat(coupon.value), orderTotal);

    res.json({ valid: true, discountAmount, coupon: { code: coupon.code, discountType: coupon.discountType, value: parseFloat(coupon.value) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};

// ─── Admin CRUD ───────────────────────────────────────────────

exports.adminGetAll = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ coupons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

exports.adminCreate = async (req, res) => {
  try {
    const { code, discountType, value, minOrderAmount, maxUses, expiresAt, isActive } = req.body;
    if (!code || !discountType || !value) {
      return res.status(400).json({ error: 'code, discountType and value are required' });
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType, value, minOrderAmount, maxUses, expiresAt: expiresAt || null, isActive: isActive !== false,
    });
    res.status(201).json({ coupon });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};

exports.adminUpdate = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    await coupon.update(req.body);
    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    await coupon.destroy();
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
};
