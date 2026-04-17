const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariant = sequelize.define(
  'ProductVariant',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'products', key: 'id' },
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false, // e.g. 'size', 'color'
    },
    value: {
      type: DataTypes.STRING(100),
      allowNull: false, // e.g. 'S', 'M', 'L', 'Red', 'Blue'
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    tableName: 'product_variants',
    timestamps: true,
  }
);

module.exports = ProductVariant;
