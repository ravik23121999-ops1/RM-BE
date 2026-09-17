const { body, validationResult } = require('express-validator');

const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.menuItem')
    .notEmpty()
    .withMessage('Menu item ID is required')
    .isMongoId()
    .withMessage('Invalid menu item ID'),
  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('orderType')
    .notEmpty()
    .withMessage('Order type is required')
    .isIn(['online', 'reception'])
    .withMessage('Invalid order type'),
  body('customerDetails.name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customerDetails.phone')
    .trim()
    .notEmpty()
    .withMessage('Customer phone is required')
    .isMobilePhone()
    .withMessage('Invalid phone number'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'online', 'card'])
    .withMessage('Invalid payment method'),
  body('tableNumber')
    .optional()
    .trim(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

const validateOrderStatus = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'in-preparation', 'prepared', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => err.msg),
    });
  }
  next();
};

module.exports = {
  validateOrder,
  validateOrderStatus,
  handleValidationErrors,
};
