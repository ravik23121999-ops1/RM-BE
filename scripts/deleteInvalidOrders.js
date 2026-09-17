const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

const deleteInvalidOrders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Find and delete all orders with invalid order numbers
    const result = await Order.deleteMany({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: '' },
        { orderNumber: { $regex: /NaN/ } },
        { orderNumber: { $not: /^ORD\d+$/ } }
      ]
    });

    console.log(`Deleted ${result.deletedCount} orders with invalid order numbers`);
    console.log('Invalid orders have been removed');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting invalid orders:', error);
    process.exit(1);
  }
};

deleteInvalidOrders();
