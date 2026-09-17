const Order = require('../models/Order');

const generateOrderNumber = async () => {
  // Find the last valid order to get the highest order number
  const orders = await Order.find({ orderNumber: { $regex: /^ORD\d+$/ } })
    .sort({ createdAt: -1 })
    .limit(1);

  let nextNumber = 1001; // Start from ORD1001

  if (orders.length > 0 && orders[0].orderNumber) {
    // Extract numeric part from order number (e.g., ORD1001 -> 1001)
    const lastNumber = parseInt(orders[0].orderNumber.replace('ORD', ''));
    
    // Only increment if we got a valid number
    if (!isNaN(lastNumber) && lastNumber >= 1000) {
      nextNumber = lastNumber + 1;
    }
  }

  return `ORD${nextNumber}`;
};

module.exports = generateOrderNumber;
