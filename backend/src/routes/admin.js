const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const upload = require('../middleware/upload');
const { productRules, categoryRules, validate } = require('../middleware/validation');
const productCtrl = require('../controllers/productController');
const categoryCtrl = require('../controllers/categoryController');
const orderCtrl = require('../controllers/orderController');
const variantCtrl = require('../controllers/variantController');
const couponCtrl = require('../controllers/couponController');
const { Product, ProductVariant } = require('../models');
const { Op } = require('sequelize');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── Products ─────────────────────────────────────────────────
router.get('/products', productCtrl.adminGetAll);
router.post('/products', upload.single('image'), productRules, validate, productCtrl.create);
router.put('/products/:id', upload.single('image'), productCtrl.update);
router.delete('/products/:id', productCtrl.remove);

// ─── Product Variants ─────────────────────────────────────────
router.get('/products/:productId/variants', variantCtrl.list);
router.post('/products/:productId/variants', variantCtrl.create);
router.put('/products/:productId/variants/:variantId', variantCtrl.update);
router.delete('/products/:productId/variants/:variantId', variantCtrl.remove);

// ─── Categories ───────────────────────────────────────────────
router.post('/categories', categoryRules, validate, categoryCtrl.create);
router.put('/categories/:id', categoryCtrl.update);
router.delete('/categories/:id', categoryCtrl.remove);

// ─── Orders ───────────────────────────────────────────────────
router.get('/orders', orderCtrl.adminGetAll);
router.put('/orders/:id/status', orderCtrl.adminUpdateStatus);

// ─── Coupons ──────────────────────────────────────────────────
router.get('/coupons', couponCtrl.adminGetAll);
router.post('/coupons', couponCtrl.adminCreate);
router.put('/coupons/:id', couponCtrl.adminUpdate);
router.delete('/coupons/:id', couponCtrl.adminDelete);

// ─── Low Stock ────────────────────────────────────────────────
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold || '5');
    const products = await Product.findAll({
      where: { stock: { [Op.lte]: threshold }, isActive: true },
      include: [{ model: ProductVariant, as: 'variants' }],
      order: [['stock', 'ASC']],
    });
    res.json({ products, threshold });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

module.exports = router;
