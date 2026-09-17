const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getReceptionistDashboard,
  getCustomerDashboard,
} = require('../controllers/dashboardController');
const authenticateUser = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All dashboard routes require authentication
router.use(authenticateUser);

// Admin dashboard
router.get('/admin', requireRole('admin'), getAdminDashboard);

// Receptionist dashboard
router.get('/receptionist', requireRole('receptionist'), getReceptionistDashboard);

// Customer dashboard
router.get('/customer', requireRole('customer'), getCustomerDashboard);

module.exports = router;
