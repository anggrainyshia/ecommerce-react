const express = require('express');
const router = express.Router({ mergeParams: true }); // inherits :productId from parent
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

router.get('/', ctrl.getProductReviews);
router.post('/', authenticate, ctrl.createReview);
router.delete('/:reviewId', authenticate, ctrl.deleteReview);

module.exports = router;
