const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
} = require('../controllers/menuController');
const authenticateUser = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { validateMenuItem, handleValidationErrors } = require('../validators/menuValidator');

// Public routes
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);

// Protected admin routes
router.post('/', authenticateUser, requireRole('admin'), validateMenuItem, handleValidationErrors, createMenuItem);
router.put('/:id', authenticateUser, requireRole('admin'), validateMenuItem, handleValidationErrors, updateMenuItem);
router.patch('/:id/availability', authenticateUser, requireRole('admin'), toggleMenuItemAvailability);
router.delete('/:id', authenticateUser, requireRole('admin'), deleteMenuItem);

module.exports = router;
