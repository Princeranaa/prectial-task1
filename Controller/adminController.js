const User = require("../model/UserModel");
const Wallet = require("../model/WalletModel");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const { Parser } = require("json2csv");

const path = require("path");
const fs = require("fs");

// Assuming you have a session store or similar for session management
const adminEmail = "admin@example.com";
const adminPassword = "admin123";

// Handle Admin Login Logic
exports.handleLogin = async (req, res) => {
  const { email, password } = req.body;
  if (email === adminEmail && password === adminPassword) {
    req.session.isAdmin = true; // Set the session for the admin user
    return res.redirect("/api/admin/dashboard"); // Redirect to dashboard after login
  }

  res.send("Invalid login credentials"); // Send error if login fails
};

// Admin Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/api/admin/login"); // Redirect to login after logout
  });
};

exports.getDashboard = async (req, res) => {
  try {
    // Get count of active users
    const activeUsersCount = await UserModel.countDocuments({
      status: "Active",
    });
    const totalUsers = await UserModel.countDocuments();
    const inactiveUsersCount = totalUsers - activeUsersCount;

    res.render("adminDashboard", {
      stats: {
        activeUsers: activeUsersCount,
        inactiveUsers: inactiveUsersCount,
        totalUsers: totalUsers,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading dashboard");
  }
};

//   ----------------------------getWalletHistory --------------------  //

exports.getUserDetailsAdminControler = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch or create wallet
    let wallet = await Wallet.findOne({ userId: user._id }).lean();
    if (!wallet) {
      console.log("Wallet not found, creating a new one...");
      wallet = new Wallet({
        userId: user._id,
        walletTotalBalance: 0,
        walletAmount: 0,
        winningsAmount: 0,
      });
      await wallet.save(); // Ensure the wallet is saved
    }

    console.log("Wallet details fetched:", wallet);

    // Render userDetails page with user and wallet data
    res.render("userDetails", { user, wallet });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getWalletHistory = async (req, res) => {
  try {
    const userId = req.params.userId; // Get user ID from request params
    const page = parseInt(req.query.page) || 1; // Get current page, default to 1
    const limit = 10; // Number of transactions per page
    const skip = (page - 1) * limit; // Calculate skip value

    // Find wallet transactions for the user
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).render("walletHistory", {
        transactions: [],
        message: "No wallet found for this user.",
        messageType: "error",
      });
    }

    // Ensure transactions exist in the wallet model
    if (!wallet.transactions) {
      wallet.transactions = [];
    }

    // Get paginated transactions
    const transactions = wallet.transactions
      .reverse()
      .sort((a, b) => b.date - a.date) // Sort by date (latest first)
      .slice(skip, skip + limit);

    // Calculate total pages
    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    // Render the EJS page with data
    res.render("wallet-history", {
      transactions,
      message: null,
      page,
      totalPages,
      userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.adminUpdateWalletBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { balance, withdrawAmount } = req.body;

    console.log("Received Data:", req.body);

    // Convert inputs to numbers
    const balanceAmount = Number(balance) || 0;
    const withdrawAmountValue = Number(withdrawAmount) || 0;

    // Find user's wallet
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    console.log("Before Update Wallet:", wallet);

    // Calculate new balance
    let newWalletBalance =
      wallet.walletTotalBalance + balanceAmount - withdrawAmountValue;

    // Ensure values are not negative
    if (newWalletBalance < 0) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Update wallet balance
    wallet.walletTotalBalance = newWalletBalance;
    wallet.walletAmount = newWalletBalance;

    // Add transaction record
    if (balanceAmount > 0) {
      wallet.transactions.push({
        amount: balanceAmount, // Store added amount
        withdrawAmount: null, // Ensure withdrawAmount is null when adding money
        message: `Added by Admin`,
        date: new Date(),
      });
    }

    if (withdrawAmountValue > 0) {
      wallet.transactions.push({
        amount: 0, // Store 0 instead of null
        withdrawAmount: withdrawAmountValue, // Store withdrawn amount
        message: `Withdrawn by Admin`,
        date: new Date(),
      });
    }

    // Save updated wallet
    await wallet.save();

    console.log("After Update Wallet:", wallet);

    return res.redirect(`/api/user/${userId}`);
  } catch (error) {
    console.error("Error updating wallet:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------- CSv file for the download ---------------- //





exports.exportUsersToCSV = async (req, res) => {
  try {
    let { status, startDate, endDate } = req.query;
    let filter = {};

    console.log("Received Query Parameters:", req.query); // Debugging step

    // Ensure status is correctly applied
    if (status && (status.toLowerCase() === "active" || status.toLowerCase() === "inactive")) {
      filter.status = status.toLowerCase() === "active" ? "Active" : "Inactive";
 // Ensure consistent capitalization
    }

    // Ensure date range filter is correctly applied
    if (startDate && endDate) {
      filter.createdAt = { 
        $gte: new Date(startDate + "T00:00:00.000Z"), 
        $lte: new Date(endDate + "T23:59:59.999Z") 
      };
    }

    console.log("Final Filter Applied:", filter); // Debugging step

    // Fetch users with applied filters
    const users = await User.find(filter).select("fullName email status createdAt");

    if (!users.length) {
      return res.status(404).send("No users found for the applied filters.");
    }

    // Define CSV fields
    const fields = ["fullName", "email", "status", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(users);

    // Set response headers and send CSV file
    res.header("Content-Type", "text/csv");
    res.attachment("users.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).send("Internal Server Error");
  }
};
