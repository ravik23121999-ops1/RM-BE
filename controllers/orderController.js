const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const generateOrderNumber = require('../utils/generateOrderNumber');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { items, orderType, customerDetails, tableNumber, notes, paymentMethod, restaurant } = req.body;

    // Validate restaurant
    if (!restaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is required',
      });
    }

    const restaurantDoc = await Restaurant.findById(restaurant);
    if (!restaurantDoc) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (!restaurantDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is not active',
      });
    }

    // Validate that all menu items exist and are available
    const menuItemIds = items.map((item) => item.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more menu items not found',
      });
    }

    // Check availability
    const unavailableItems = menuItems.filter((item) => !item.isAvailable);
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some items are not available',
      });
    }

    // Calculate totals using current prices from database
    const orderItems = items.map((item) => {
      const menuItem = menuItems.find((mi) => mi._id.toString() === item.menuItem);
      return {
        menuItem: item.menuItem,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal: menuItem.price * item.quantity,
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Determine customer
    let customer;
    if (req.user.role === 'customer') {
      customer = req.user._id;
    } else {
      // For receptionist, find or create customer based on phone
      customer = await User.findOne({ phone: customerDetails.phone, role: 'customer' });
      if (!customer) {
        // Create new customer for walk-in
        customer = await User.create({
          name: customerDetails.name,
          email: `${customerDetails.phone}@walkin.temp`,
          phone: customerDetails.phone,
          password: 'TempPass123',
          role: 'customer',
        });
      }
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      restaurant,
      customer,
      items: orderItems,
      totalAmount,
      orderType,
      customerDetails,
      tableNumber: tableNumber || '',
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash',
      createdBy: req.user._id,
    });

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('items.menuItem', 'name price image');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (with filters)
// @route   GET /api/orders
// @access  Private/Admin/Receptionist
const getAllOrders = async (req, res, next) => {
  try {
    const { status, orderType, startDate, endDate, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    // If user is receptionist, only show orders from their assigned restaurant
    if (req.user.role === 'receptionist' && req.user.restaurant) {
      query.restaurant = req.user.restaurant;
    }

    if (status) {
      query.status = status;
    }

    if (orderType) {
      query.orderType = orderType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name')
      .populate('createdBy', 'name email')
      .populate('items.menuItem', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Check restaurant authorization for receptionist
    if (req.user.role === 'receptionist' && req.user.restaurant) {
      if (order.restaurant._id.toString() !== req.user.restaurant.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only view orders from your restaurant',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's orders
// @route   GET /api/orders/my-orders
// @access  Private/Customer
const getMyOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { customer: req.user._id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.menuItem', 'name price image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin/Receptionist
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check restaurant authorization for receptionist
    if (req.user.role === 'receptionist' && req.user.restaurant) {
      if (order.restaurant.toString() !== req.user.restaurant.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only update orders from your restaurant',
        });
      }
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['in-preparation', 'cancelled'],
      'in-preparation': ['prepared', 'cancelled'],
      prepared: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const allowedTransitions = validTransitions[order.status];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    order.status = status;

    // Update payment status when delivered
    if (status === 'delivered' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name')
      .populate('createdBy', 'name email')
      .populate('items.menuItem', 'name price image');

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check authorization - only customer can cancel their own order
    if (req.user.role === 'customer' && order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Only allow cancellation if order is pending or in-preparation
    if (order.status === 'prepared' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that is already prepared or delivered',
      });
    }

    order.status = 'cancelled';
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('items.menuItem', 'name price image');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
};
