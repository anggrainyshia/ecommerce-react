const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/wishlistController');

router.use(authenticate);

router.get('/', ctrl.getWishlist);
router.get('/ids', ctrl.getIds);
router.post('/:productId', ctrl.toggle);

module.exports = router;
