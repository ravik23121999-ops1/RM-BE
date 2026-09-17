const mongoose = require('mongoose');
const Order = require('../models/Order');
const generateOrderNumber = require('../utils/generateOrderNumber');
require('dotenv').config();

const fixOrderNumbers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Find all orders with invalid order numbers
    const invalidOrders = await Order.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: '' },
        { orderNumber: { $regex: /NaN/ } },
        { orderNumber: { $not: /^ORD\d+$/ } }
      ]
    });

    console.log(`Found ${invalidOrders.length} orders with invalid order numbers`);

    // Fix each invalid order
    for (const order of invalidOrders) {
      const newOrderNumber = await generateOrderNumber();
      order.orderNumber = newOrderNumber;
      await order.save();
      console.log(`Fixed order ${order._id} -> ${newOrderNumber}`);
    }

    console.log('All invalid order numbers have been fixed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing order numbers:', error);
    process.exit(1);
  }
};

fixOrderNumbers();
