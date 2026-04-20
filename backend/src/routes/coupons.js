const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/couponController');

router.post('/validate', authenticate, ctrl.validate);

module.exports = router;
