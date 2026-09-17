const { body, validationResult } = require('express-validator');

const validateMenuItem = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Starters', 'Main Course', 'Pizza', 'Burger', 'Pasta', 'Drinks', 'Desserts', 'Other'])
    .withMessage('Invalid category'),
  body('preparationTime')
    .notEmpty()
    .withMessage('Preparation time is required')
    .isInt({ min: 1 })
    .withMessage('Preparation time must be at least 1 minute'),
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
  validateMenuItem,
  handleValidationErrors,
};
