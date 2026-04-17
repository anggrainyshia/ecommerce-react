const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderTracking = sequelize.define(
  'OrderTracking',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'orders', key: 'id' },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'order_tracking',
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = OrderTracking;
