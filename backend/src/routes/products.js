const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.use('/:productId/reviews', require('./reviews'));

module.exports = router;
