const { body } = require('express-validator');

const userValidationRules = [
  
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('userName').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('phone').isMobilePhone().withMessage('Please enter a valid phone number'),
    body('name').notEmpty().withMessage('Name is required'),
    body('fullName').notEmpty().withMessage('Full name is required'),

  
];

module.exports = userValidationRules;
