const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    orderNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'failed']],
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    shippingName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    shippingPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    couponCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
  },
  {
    tableName: 'orders',
    timestamps: true,
  }
);

module.exports = Order;
