const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const inPreparationOrders = await Order.countDocuments({
      status: 'in-preparation',
    });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalReceptionists = await User.countDocuments({ role: 'receptionist' });
    const totalMenuItems = await MenuItem.countDocuments();

    // Revenue calculations
    const allOrders = await Order.find({ status: 'delivered' });
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const todayDeliveredOrders = await Order.find({
      status: 'delivered',
      createdAt: { $gte: today },
    });
    const todayRevenue = todayDeliveredOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Orders by day (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await Order.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        orders: count,
      });
    }

    // Revenue by day (last 7 days)
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const orders = await Order.find({
        status: 'delivered',
        createdAt: { $gte: date, $lt: nextDate },
      });

      const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

      revenueByDay.push({
        date: date.toISOString().split('T')[0],
        revenue,
      });
    }

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Popular menu items
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    // Orders by type
    const ordersByType = await Order.aggregate([
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          todayOrders,
          pendingOrders,
          inPreparationOrders,
          deliveredOrders,
          totalCustomers,
          totalReceptionists,
          totalMenuItems,
          todayRevenue,
          totalRevenue,
        },
        charts: {
          ordersByDay: last7Days,
          revenueByDay,
          statusDistribution,
          popularItems,
          ordersByType,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get receptionist dashboard stats
// @route   GET /api/dashboard/receptionist
// @access  Private/Receptionist
const getReceptionistDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the receptionist's assigned restaurant
    const restaurantId = req.user.restaurant;
    
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'No restaurant assigned to this receptionist',
      });
    }

    // Filter orders by restaurant
    const restaurantQuery = { restaurant: restaurantId };

    const todayOrders = await Order.countDocuments({
      ...restaurantQuery,
      createdAt: { $gte: today },
    });
    const pendingOrders = await Order.countDocuments({
      ...restaurantQuery,
      status: 'pending',
    });
    const inPreparationOrders = await Order.countDocuments({
      ...restaurantQuery,
      status: 'in-preparation',
    });
    const preparedOrders = await Order.countDocuments({
      ...restaurantQuery,
      status: 'prepared',
    });

    // Count unique customers who placed orders at this restaurant
    const uniqueCustomers = await Order.aggregate([
      { $match: restaurantQuery },
      { $group: { _id: '$customer' } },
      { $count: 'total' }
    ]);
    const totalCustomers = uniqueCustomers.length > 0 ? uniqueCustomers[0].total : 0;

    // Recent orders for this restaurant
    const recentOrders = await Order.find(restaurantQuery)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          todayOrders,
          pendingOrders,
          inPreparationOrders,
          preparedOrders,
          totalCustomers,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer dashboard stats
// @route   GET /api/dashboard/customer
// @access  Private/Customer
const getCustomerDashboard = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments({ customer: req.user._id });
    const pendingOrders = await Order.countDocuments({
      customer: req.user._id,
      status: 'pending',
    });
    const inPreparationOrders = await Order.countDocuments({
      customer: req.user._id,
      status: 'in-preparation',
    });
    const deliveredOrders = await Order.countDocuments({
      customer: req.user._id,
      status: 'delivered',
    });

    // Calculate total spent
    const orders = await Order.find({
      customer: req.user._id,
      status: 'delivered',
    });
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Recent orders
    const recentOrders = await Order.find({ customer: req.user._id })
      .populate('items.menuItem', 'name image')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          inPreparationOrders,
          deliveredOrders,
          totalSpent,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getReceptionistDashboard,
  getCustomerDashboard,
};
