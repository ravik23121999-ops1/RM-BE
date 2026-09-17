const express = require('express');
const router = express.Router();
const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantStatus,
  deleteRestaurant,
  assignManager,
} = require('../controllers/restaurantController');
const authenticateUser = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);

// Protected admin routes
router.post('/', authenticateUser, requireRole('admin'), createRestaurant);
router.put('/:id', authenticateUser, requireRole('admin'), updateRestaurant);
router.patch('/:id/status', authenticateUser, requireRole('admin'), toggleRestaurantStatus);
router.delete('/:id', authenticateUser, requireRole('admin'), deleteRestaurant);
router.patch('/:id/assign-manager', authenticateUser, requireRole('admin'), assignManager);

module.exports = router;