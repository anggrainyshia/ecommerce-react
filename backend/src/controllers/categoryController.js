const { Category, Product } = require('../models');
const { generateSlug } = require('../utils/helpers');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{ model: Product, as: 'products', where: { isActive: true }, required: false }],
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = generateSlug(name);

    const existing = await Category.findOne({ where: { slug } });
    if (existing) return res.status(409).json({ error: 'Category with this name already exists' });

    const category = await Category.create({ name, description, slug });
    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

exports.update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const { name, description } = req.body;
    const slug = name ? generateSlug(name) : category.slug;

    if (name && slug !== category.slug) {
      const conflict = await Category.findOne({ where: { slug, id: { [Op.ne]: category.id } } });
      if (conflict) return res.status(409).json({ error: 'Category name already taken' });
    }

    await category.update({ name: name || category.name, description, slug });
    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
