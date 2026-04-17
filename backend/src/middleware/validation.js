const { validationResult, body, param, query } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 chars'),
  body('email').normalizeEmail().isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').normalizeEmail().isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const productRules = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Product name required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

const categoryRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Category name required'),
];

const checkoutRules = [
  body('shippingName').trim().isLength({ min: 2 }).withMessage('Shipping name required'),
  body('shippingAddress').trim().isLength({ min: 5 }).withMessage('Shipping address required'),
  body('shippingPhone').trim().isMobilePhone().withMessage('Valid phone number required'),
  body('customerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Valid email required'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  productRules,
  categoryRules,
  checkoutRules,
};
