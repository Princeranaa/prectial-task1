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
// exports.updateWalletBalance = async (req, res) => {
//   try {
//       const { userId } = req.params;
//       const { walletTotalBalance, walletAmount, winningsAmount } = req.body;

//       // Find the user by userId
//       const user = await User.findById(userId);
//       if (!user) {
//           return res.status(404).send('User not found');
//       }

//       // Find the wallet for the user, or create one if it doesn't exist
//       let wallet = await Wallet.findOne({ userId });
//       if (!wallet) {
//           wallet = new Wallet({ userId });
//       }

//       // Update wallet values
//       if (walletTotalBalance !== undefined) wallet.walletTotalBalance = walletTotalBalance;
//       if (walletAmount !== undefined) wallet.walletAmount = walletAmount;
//       if (winningsAmount !== undefined) wallet.winningsAmount = winningsAmount;

//       await wallet.save(); // Save the updated wallet

//       res.redirect(`/admin/user/${userId}`); // Redirect back to the user's profile or any other page
//   } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal server error');
//   }
// };


// exports.updateWalletBalance = async (req, res) => {
//   try {
//       const { userId } = req.params;
//       const { amount } = req.body; // Amount entered by the admin
//       const numericAmount = parseFloat(amount); // Ensure it's a number

//       if (isNaN(numericAmount)) {
//           return res.status(400).send('Invalid amount');
//       }

//       // Find the wallet for the user
//       let wallet = await Wallet.findOne({ userId });

//       if (!wallet) {
//           wallet = new Wallet({ userId, walletTotalBalance: 0, walletAmount: 0, winningsAmount: 0 });
//       }

//       // Update wallet balance (add or subtract)
//       wallet.walletTotalBalance += numericAmount;
//       wallet.walletAmount += numericAmount;

//       await wallet.save(); // Save the updated wallet

//       res.redirect(`/admin/user/${userId}`); // Redirect back to the user's profile page
//   } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal server error');
//   }
// };


// Controller to get user details along with wallet balance
exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Fetch wallet details for the user
        const wallet = await Wallet.findOne({ userId }).exec();

        // Prepare data for the view, making sure wallet data is passed correctly
        res.render('userDetails', {
            user,
            walletTotalBalance: wallet ? wallet.walletTotalBalance : 0, // Ensure we have wallet data
            walletAmount: wallet ? wallet.walletAmount : 0,
            winningsAmount: wallet ? wallet.winningsAmount : 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};
// Controller to update wallet balance
exports.updateWalletBalance = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, type } = req.body; // `type` can be "add" or "subtract"

        console.log(req.body);  // Debugging line to check if data is coming correctly

        // Validate amount
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).send('Invalid amount');
        }

        // Find wallet or create one if not exists
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId });
        }

        // Update wallet based on type (add/subtract)
        if (type === 'add') {
            wallet.walletTotalBalance += numericAmount;
            wallet.walletAmount += numericAmount;
        } else if (type === 'subtract') {
            if (wallet.walletAmount < numericAmount) {
                return res.status(400).send('Insufficient wallet balance');
            }
            wallet.walletTotalBalance -= numericAmount;
            wallet.walletAmount -= numericAmount;
        } else {
            return res.status(400).send('Invalid operation type');
        }

        await wallet.save(); // Save updated wallet

        res.redirect(`/admin/user/${userId}`); // Redirect back to user details
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};





