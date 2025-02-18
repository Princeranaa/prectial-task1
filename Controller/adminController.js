const User = require('../model/UserModel');
const Wallet = require('../model/WalletModel');



// Assuming you have a session store or similar for session management
const adminEmail = "admin@example.com";
const adminPassword = "admin123";

// Handle Admin Login Logic
exports.handleLogin = async (req, res) => {
  
  const { email, password } = req.body;
  if (email === adminEmail && password === adminPassword) {
    req.session.isAdmin = true;  // Set the session for the admin user
    return res.redirect("/api/admin/dashboard");  // Redirect to dashboard after login
  }

  res.send("Invalid login credentials");  // Send error if login fails
};

// Admin Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/api/admin/login");  // Redirect to login after logout
  });
};

exports.getDashboard = async (req, res) => {
    try {
        // Get count of active users
        const activeUsersCount = await UserModel.countDocuments({ status: 'Active' });
        const totalUsers = await UserModel.countDocuments();
        const inactiveUsersCount = totalUsers - activeUsersCount;

        res.render("adminDashboard", {
            stats: {
                activeUsers: activeUsersCount,
                inactiveUsers: inactiveUsersCount,
                totalUsers: totalUsers
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading dashboard");
    }
};

// Controller to update wallet balance
exports.updateWalletBalance = async (req, res) => {
  try {
      const { userId } = req.params;
      const { walletTotalBalance, walletAmount, winningsAmount } = req.body;

      // Find the user by userId
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).send('User not found');
      }

      // Find the wallet for the user, or create one if it doesn't exist
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
          wallet = new Wallet({ userId });
      }

      // Update wallet values
      if (walletTotalBalance !== undefined) wallet.walletTotalBalance = walletTotalBalance;
      if (walletAmount !== undefined) wallet.walletAmount = walletAmount;
      if (winningsAmount !== undefined) wallet.winningsAmount = winningsAmount;

      await wallet.save(); // Save the updated wallet

      res.redirect(`/admin/user/${userId}`); // Redirect back to the user's profile or any other page
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
  }
};