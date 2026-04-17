/**
 * Cart is stored in Redis as a JSON array per user:
 *   key: cart:{userId}
 *   value: [{ productId, variantId, name, variantLabel, price, image, quantity }]
 *   variantId is null for products without a selected variant.
 *   Uniqueness key: productId + variantId (null variantId treated as distinct from any variantId).
 * TTL: 7 days
 */
const redis = require('../config/redis');
const { Product, ProductVariant } = require('../models');

const CART_TTL = 60 * 60 * 24 * 7; // 7 days

const cartKey = (userId) => `cart:${userId}`;

const getCart = async (userId) => {
  const raw = await redis.get(cartKey(userId));
  return raw ? JSON.parse(raw) : [];
};

const saveCart = async (userId, items) => {
  await redis.setex(cartKey(userId), CART_TTL, JSON.stringify(items));
};

const cartTotal = (items) => items.reduce((sum, i) => sum + i.price * i.quantity, 0);
const cartCount = (items) => items.reduce((s, i) => s + i.quantity, 0);

// Items match if productId AND variantId both match (null === null is a match)
const sameItem = (a, b) => a.productId === b.productId && (a.variantId || null) === (b.variantId || null);

exports.getCart = async (req, res) => {
  try {
    const items = await getCart(req.user.id);
    res.json({ items, total: cartTotal(items), count: cartCount(items) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, variantId = null, quantity = 1 } = req.body;
    if (!productId || quantity < 1) {
      return res.status(400).json({ error: 'Valid productId and quantity required' });
    }

    const product = await Product.findOne({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let availableStock = product.stock;
    let variantLabel = null;

    if (variantId) {
      const variant = await ProductVariant.findOne({ where: { id: variantId, productId } });
      if (!variant) return res.status(404).json({ error: 'Variant not found' });
      availableStock = variant.stock;
      variantLabel = `${variant.type}: ${variant.value}`;
    }

    if (availableStock < quantity) {
      return res.status(400).json({ error: `Only ${availableStock} items in stock` });
    }

    const items = await getCart(req.user.id);
    const idx = items.findIndex((i) => sameItem(i, { productId, variantId }));

    if (idx > -1) {
      const newQty = items[idx].quantity + quantity;
      if (newQty > availableStock) {
        return res.status(400).json({ error: `Only ${availableStock} items in stock` });
      }
      items[idx].quantity = newQty;
    } else {
      items.push({
        productId,
        variantId: variantId || null,
        name: product.name,
        variantLabel,
        price: parseFloat(product.price),
        image: product.image,
        quantity,
      });
    }

    await saveCart(req.user.id, items);
    res.json({ items, total: cartTotal(items), count: cartCount(items) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId = null, quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });

    let availableStock;
    if (variantId) {
      const variant = await ProductVariant.findByPk(variantId);
      if (!variant) return res.status(404).json({ error: 'Variant not found' });
      availableStock = variant.stock;
    } else {
      const product = await Product.findByPk(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      availableStock = product.stock;
    }

    if (quantity > availableStock) {
      return res.status(400).json({ error: `Only ${availableStock} items in stock` });
    }

    const items = await getCart(req.user.id);
    const idx = items.findIndex((i) => sameItem(i, { productId, variantId }));
    if (idx === -1) return res.status(404).json({ error: 'Item not in cart' });

    items[idx].quantity = quantity;
    await saveCart(req.user.id, items);

    res.json({ items, total: cartTotal(items), count: cartCount(items) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId = null } = req.query;
    let items = await getCart(req.user.id);
    items = items.filter((i) => !sameItem(i, { productId, variantId }));
    await saveCart(req.user.id, items);

    res.json({ items, total: cartTotal(items), count: cartCount(items) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await redis.del(cartKey(req.user.id));
    res.json({ items: [], total: 0, count: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

module.exports.getCartItems = getCart;
