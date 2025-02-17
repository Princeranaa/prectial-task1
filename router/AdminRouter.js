const express = require('express');
const router = express.Router();
const { handleLogin, logout, updateWalletBalance } = require('../Controller/adminController');
const { getAllUsers, updateUserStatus, getUserDetails } = require('../Controller/User-Controller');

// Login page
router.get('/login', (req, res) => {
  res.render("adminLogin");
});

// Handle login POST request
router.post('/login', handleLogin);

// Dashboard page (after login)
router.get('/dashboard', getAllUsers, (req, res) => {
  res.render("adminDashboard", { 
    totalUser: req.totalUser,
    users: res.locals.users,
    stats: {
      activeUsers: res.locals.users.filter(user => user.status === 'Active').length,
      inactiveUsers: res.locals.users.filter(user => user.status !== 'Active').length,
      totalUsers: res.locals.users.length
    }
  });
});

// User list page (after login)
router.get('/user/list', getAllUsers, (req, res) => {
  res.render("userList", { users: res.locals.users });
});

// Admin Logout
router.get('/logout', logout);

// Add new route for updating user status
router.post('/user/update-status', updateUserStatus);


// Route to get user details including wallet balance
router.get('/user/:userId', getUserDetails);


// update wallte amount 
router.post('/update-wallet/:userId', updateWalletBalance);

module.exports = router;
