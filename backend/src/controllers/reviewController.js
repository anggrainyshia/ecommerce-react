const { Review, User, Product, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

const REVIEWED_STATUSES = ['paid', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

async function syncProductRating(productId) {
  const reviews = await Review.findAll({ where: { productId }, attributes: ['rating'] });
  const count = reviews.length;
  const avg = count ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(2)) : null;
  await Product.update({ averageRating: avg, reviewCount: count }, { where: { id: productId } });
}

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.productId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ reviews, averageRating: avg, count: reviews.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify the user has a paid (or later) order containing this product
    const purchased = await OrderItem.findOne({
      where: { productId },
      include: [{
        model: Order,
        as: 'order',
        where: { userId: req.user.id, status: { [Op.in]: REVIEWED_STATUSES } },
        attributes: [],
      }],
    });

    if (!purchased) {
      return res.status(403).json({ error: 'You can only review products from completed orders' });
    }

    const existing = await Review.findOne({ where: { userId: req.user.id, productId } });
    if (existing) {
      await existing.update({ rating, comment: comment || null });
      await syncProductRating(productId);
      const updated = await Review.findByPk(existing.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      });
      return res.json({ review: updated });
    }

    const review = await Review.create({ userId: req.user.id, productId, rating, comment: comment || null });
    await syncProductRating(productId);
    const full = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    });
    res.status(201).json({ review: full });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.reviewId, userId: req.user.id },
    });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    const { productId } = review;
    await review.destroy();
    await syncProductRating(productId);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
