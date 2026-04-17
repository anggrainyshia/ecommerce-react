const { Product, Category, ProductVariant } = require('../models');
const { generateSlug } = require('../utils/helpers');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

exports.getAll = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12, sort = 'createdAt', order = 'DESC' } = req.query;

    const where = { isActive: true };
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (category) {
      where.categoryId = category;
    }

    const allowedSorts = ['name', 'price', 'createdAt'];
    const sortField = allowedSorts.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductVariant, as: 'variants' },
      ],
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, isActive: true },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductVariant, as: 'variants' },
      ],
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, price, stock, categoryId } = req.body;

    let slug = generateSlug(name);
    const existing = await Product.count({ where: { slug } });
    if (existing > 0) slug = `${slug}-${Date.now()}`;

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      categoryId: categoryId || null,
      image,
      slug,
    });

    const result = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductVariant, as: 'variants' },
      ],
    });

    res.status(201).json({ product: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { name, description, price, stock, categoryId, isActive } = req.body;

    let slug = product.slug;
    if (name && name !== product.name) {
      slug = generateSlug(name);
      const conflict = await Product.count({ where: { slug, id: { [Op.ne]: product.id } } });
      if (conflict > 0) slug = `${slug}-${Date.now()}`;
    }

    let image = product.image;
    if (req.file) {
      // Remove old image
      if (product.image) {
        const oldPath = path.join(__dirname, '../../', product.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image = `/uploads/${req.file.filename}`;
    }

    await product.update({
      name: name ?? product.name,
      description: description ?? product.description,
      price: price ?? product.price,
      stock: stock ?? product.stock,
      categoryId: categoryId !== undefined ? categoryId : product.categoryId,
      isActive: isActive !== undefined ? isActive : product.isActive,
      image,
      slug,
    });

    const result = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductVariant, as: 'variants' },
      ],
    });

    res.json({ product: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Soft delete
    await product.update({ isActive: false });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Admin: get all including inactive
exports.adminGetAll = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    const where = {};
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (category) where.categoryId = category;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: ProductVariant, as: 'variants' },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};
