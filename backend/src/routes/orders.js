const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { checkoutRules, validate } = require('../middleware/validation');

router.use(authenticate);

router.post('/', checkoutRules, validate, ctrl.createOrder);
router.get('/', ctrl.getMyOrders);
router.get('/:id', ctrl.getOrderById);

module.exports = router;
