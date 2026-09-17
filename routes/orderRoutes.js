const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const authenticateUser = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { validateOrder, validateOrderStatus, handleValidationErrors } = require('../validators/orderValidator');

// All order routes require authentication
router.use(authenticateUser);

// Create order (all authenticated users)
router.post('/', validateOrder, handleValidationErrors, createOrder);

// Get all orders (admin and receptionist)
router.get('/', requireRole('admin', 'receptionist'), getAllOrders);

// Get current user's orders (customer)
router.get('/my-orders', requireRole('customer'), getMyOrders);

// Get single order
router.get('/:id', getOrderById);

// Update order status (admin and receptionist)
router.patch('/:id/status', requireRole('admin', 'receptionist'), validateOrderStatus, handleValidationErrors, updateOrderStatus);

// Cancel order (customer can cancel their own, admin/receptionist can cancel any)
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
