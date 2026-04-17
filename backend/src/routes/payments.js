const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Midtrans webhook — no auth (Midtrans calls this)
router.post('/webhook', ctrl.webhook);

// Protected
router.post('/:orderId/snap-token', authenticate, ctrl.createSnapToken);
router.post('/:orderId/mock', authenticate, ctrl.mockPayment);

module.exports = router;
