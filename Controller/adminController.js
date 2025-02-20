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


// Controller to get user details along with wallet balance
// exports.getUserDetailsOfTheWallet = async (req, res) => {
//     try {
//         const { userId } = req.params;

//        const user = await User.findOne({_id : userId});

//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         const wallet = await Wallet.find({ userId });

//         if (!wallet) {
//             wallet = new Wallet({ userId });
//         }


//         // Debugging logs
//         console.log("User Data:", user);
//         console.log("--------Wallet Data:", wallet);
//         // res.status(200).json({"User Data:": user, "Wallet Data:": wallet[0]})
//         res.render('userDetails', {user, wallet: user});
//     } catch (error) {
//         console.error("Error fetching user details:", error);
//         res.status(500).send('Internal server error');
//     }
// };




// exports.updateWalletBalance = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { balance, type } = req.body;
//         //  balance, withdrawAmount 
//         const numericAmount = parseFloat(balance);

//         let wallet = await Wallet.findOne({ userId });

//         const user= await User.findOne({ user_id: userId});

//         if (!wallet) wallet = new Wallet({ userId });

//         if (wallet.walletAmount === undefined) wallet.walletAmount = 0;

//         if (type === "balance") {
//             wallet.walletTotalBalance += numericAmount;
//             wallet.walletAmount += numericAmount;
//         } else if (type === "withdrawAmount") {
//             if (wallet.walletAmount < numericAmount) {
//                 return res.status(400).json({ error: "Insufficient wallet balance" });
//             }
//             wallet.walletTotalBalance -= numericAmount;
//             wallet.walletAmount -= numericAmount;
//         } else {
//             return res.status(400).json({ error: "Invalid operation type" });
//         }

//         await wallet.save();
        
//         console.log("Updated Wallet:", wallet);
        
//         res.render('userdetails', {user, wallet});

//     } catch (error) {
//         console.error("Error updating wallet balance:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };





exports.getUserDetailsAdminControler  = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const wallet = await Wallet.findOne({ userId: user._id }).lean(); // Use .lean() for plain JSON
        console.log("Updated Wallet Data:", wallet);
    

        // If wallet is not found, send default values
        if (!wallet) {
            wallet = {
                walletAmount: 0,
                walletTotalBalance: 0,
                winningsAmount: 0
            };
        }

        // Ensure wallet is passed in res.render
        res.render("userDetails", { user, wallet });
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Server error" });
    }
};




exports.adminUpdateWalletBalance = async (req, res) => {
    try {
        const { userId } = req.params;
        const { balance, withdrawAmount } = req.body;

        console.log("Received data:", req.body);

        // Convert balance and withdrawAmount to numbers
        const balanceAmount = Number(balance) || 0;
        const withdrawAmountValue = Number(withdrawAmount) || 0;

        // Find user's wallet
        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        console.log("Before update:", wallet);

        // Set new wallet balance directly
        let newWalletBalance = balanceAmount - withdrawAmountValue;

        // Ensure values are not negative
        if (newWalletBalance < 0) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Update wallet
        wallet = await Wallet.findOneAndUpdate(
            { userId },
            {
                walletTotalBalance: newWalletBalance,
                walletAmount: newWalletBalance, // Assuming walletAmount should reflect the total balance
            },
            { new: true }
        );

        // Fetch updated user details including wallet
        const user = await User.findById(userId);
        const updatedWallet = await Wallet.findOne({ userId });

        console.log("After update:", wallet);

        // Render user details with updated wallet information
        return res.render('userDetails', { user, wallet: updatedWallet });
    } catch (error) {
        console.error("Error updating wallet:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};





