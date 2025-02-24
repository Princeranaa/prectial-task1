const express = require('express');
const adminRouter = express.Router();
const { handleLogin, logout,  getAdminUserDetails, adminUpdateWalletBalance, getUserDetailsAdminControler, getWalletHistory } = require('../Controller/adminController');
const { getAllUsers, updateUserStatus, getUserDetails, getAdminDashboard } = require('../Controller/User-Controller');

// Login page
adminRouter.get('/login', (req, res) => {
  res.render("adminLogin");
});

// Handle login POST request
adminRouter.post('/login', handleLogin);

// Dashboard page (after login)
adminRouter.get('/dashboard', getAdminDashboard, (req, res) => {
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
adminRouter.get('/user/list', getAllUsers, (req, res) => {
  res.render("userList", { users: res.locals.users });
});

// Admin Logout
adminRouter.get('/logout', logout);

// Add new route for updating user status
adminRouter.post('/user/update-status', updateUserStatus);

// // Route to get user details including wallet balance
adminRouter.get('/user/:userId', getUserDetails);
// adminRouter.get('/user/:userId', getUserDetailsOfTheWallet);


adminRouter.get('/admin/user/:userId', getUserDetailsAdminControler);
adminRouter.post('/update-wallet/:userId', adminUpdateWalletBalance);
adminRouter.get('/user/wallet-history/:userId', getWalletHistory);

// /api/admin/user/wallet-history/:userId
// update wallte amount 
// adminRouter.post('/update-wallet/:userId', updateWalletBalance);





module.exports = adminRouter;
