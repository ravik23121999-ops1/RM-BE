const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
} = require('../controllers/authController');
const authenticateUser = require('../middleware/authMiddleware');
const {
  validateSignup,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  handleValidationErrors,
} = require('../validators/authValidator');

router.post('/register', validateSignup, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getMe);
router.put('/profile', authenticateUser, validateUpdateProfile, handleValidationErrors, updateProfile);
router.put('/change-password', authenticateUser, validateChangePassword, handleValidationErrors, changePassword);

module.exports = router;
