const { body } = require('express-validator');

const userValidationRules = [
  body('name').optional().isString().withMessage('Name should be a string'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password should be at least 6 characters long'),
];

module.exports = userValidationRules;
