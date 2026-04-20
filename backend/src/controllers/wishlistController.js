const { Wishlist, Product, Category, ProductVariant } = require('../models');

const PRODUCT_INCLUDE = {
  model: Product,
  as: 'product',
  include: [
    { model: Category, as: 'category', attributes: ['id', 'name'] },
    { model: ProductVariant, as: 'variants' },
  ],
};

exports.getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [PRODUCT_INCLUDE],
      order: [['createdAt', 'DESC']],
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

exports.toggle = async (req, res) => {
  try {
    const { productId } = req.params;
    const existing = await Wishlist.findOne({ where: { userId: req.user.id, productId } });

    if (existing) {
      await existing.destroy();
      return res.json({ wishlisted: false });
    }

    await Wishlist.create({ userId: req.user.id, productId });
    res.json({ wishlisted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
};

exports.getIds = async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      attributes: ['productId'],
    });
    res.json({ ids: items.map((w) => w.productId) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};
