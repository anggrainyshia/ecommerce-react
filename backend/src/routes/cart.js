const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getCart);
router.post('/items', ctrl.addToCart);
router.put('/items/:productId', ctrl.updateItem);
router.delete('/items/:productId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);

module.exports = router;
