const { ProductVariant, Product } = require('../models');

// Admin: list variants for a product
exports.list = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const variants = await ProductVariant.findAll({
      where: { productId: req.params.productId },
      order: [['type', 'ASC'], ['value', 'ASC']],
    });
    res.json({ variants });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
};

// Admin: create variant
exports.create = async (req, res) => {
  try {
    const { type, value, stock = 0 } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'type and value are required' });
    }

    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const variant = await ProductVariant.create({
      productId: req.params.productId,
      type,
      value,
      stock: parseInt(stock) || 0,
    });
    res.status(201).json({ variant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create variant' });
  }
};

// Admin: update variant
exports.update = async (req, res) => {
  try {
    const variant = await ProductVariant.findOne({
      where: { id: req.params.variantId, productId: req.params.productId },
    });
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    const { type, value, stock } = req.body;
    await variant.update({
      type: type ?? variant.type,
      value: value ?? variant.value,
      stock: stock !== undefined ? parseInt(stock) : variant.stock,
    });
    res.json({ variant });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update variant' });
  }
};

// Admin: delete variant
exports.remove = async (req, res) => {
  try {
    const variant = await ProductVariant.findOne({
      where: { id: req.params.variantId, productId: req.params.productId },
    });
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    await variant.destroy();
    res.json({ message: 'Variant deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete variant' });
  }
};
