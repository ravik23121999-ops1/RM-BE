const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createReceptionist,
  updateUser,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/userController');
const authenticateUser = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All user routes require admin access
router.use(authenticateUser);
router.use(requireRole('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/receptionist', createReceptionist);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);

module.exports = router;
