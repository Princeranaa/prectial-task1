const UserModel = require("../model/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const userValidationRules = require("../validation/UserValidation");
const Wallet = require("../model/WalletModel");

const os = require("os");

exports.userCreated = [
  ...userValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors
          .array()
          .map((err) => err.msg)
          .join(", ")
      );
      return res.redirect("/api/user");
    }

    try {
      const {email, password, phone, fullName, userName } = req.body;

      // Check if user already exists
      let existingUser = await UserModel.findOne({email});

      if (existingUser) {
        if (existingUser.email === email) {
          req.flash("error", "Email already registered. Please login instead.");
        } else {
          req.flash("error", "Username already taken. Please choose another.");
        }
        return res.redirect("/api/user");
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new UserModel({
        userName,
        email,
        fullName,
        password: hashedPassword,
        phone,
        
      });

      await user.save();
      console.log(user)
      req.flash(
        "success",
        "Account created successfully! Please login to continue."
      );
      res.redirect("/api/user/login");
    } catch (error) {
      console.error(error);
      console.error("Error during registration:", error);
      req.flash("error", "Registration failed. Please try again.");
      res.redirect("/api/user");
    }
  },
];

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find();
    req.totalUser = users.length;
    res.locals.users = users;
    next();
  } catch (error) {
    next(error);
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }

    // Fetch wallet data
    const wallet = await Wallet.findOne({ userId: user._id }) || {}; // Ensure wallet is fetched

    res.render("userDetails", {
      user,
      wallet, // Pass wallet data to the template
      messages: {
        success: req.flash("success"),
        error: req.flash("error"),
         
      },
    });
  } catch (error) {
    req.flash("error", "Error fetching user details");
    res.redirect("/");
  }
};


exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash("error", "Email and password are required.");
    return res.redirect("/api/user/login");
  }

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      req.flash("error", "Account not found. Please register first.");
      return res.redirect("/api/user");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/api/user/login");
    }

    // Collect device information
    const userDeviceName = os.hostname();
    const userOS = os.platform();
    const userBrowser = req.headers["user-agent"];

    // Store user session
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      device: userDeviceName,
    };

    // Update last login details
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        lastLoginDevice: {
          device: userDeviceName,
          os: userOS,
          browser: userBrowser,
        },
        lastLoginDate: new Date(),
      },
      { new: true }
    );

    req.flash("success", `Welcome back, ${user.fullName}!`);
    return res.redirect("/api/user/login"); // Redirect to user dashboard (change as needed)
      
  } catch (error) {
    console.error("Login Error:", error);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/api/user/login");
  }
};


exports.getDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "Please login to access the dashboard");
      return res.redirect("/api/user/login");
    }

    const user = await UserModel.findById(req.session.user.id);
    const activeUsersCount = await UserModel.countDocuments({
      status: "Active",
    });
    const totalUsers = await UserModel.countDocuments();
    const inactiveUsersCount = totalUsers - activeUsersCount;

    res.render("userDetails",  {
      user,
      wallet: {},
      activeUsersCount,
      inactiveUsersCount,
      totalUsers,
      message
      
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/api/user/login");
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      req.flash("error", "Error logging out");
      return res.redirect("/api/user/dashboard");
    }
    res.redirect("/api/user/login");
  });
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { status: status },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error updating user status" });
  }
};

// Update password route handler
exports.updateUserPassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const { userId } = req.params; // Access user ID from the URL parameter

  if (!userId || !newPassword || newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "User ID, new password, and confirmed password are required, and passwords must match.",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
    // Find user and update the password
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    // Set a flash message for successful password update
    req.flash("success", "Password updated successfully!");

    // Redirect to the user details page
    res.redirect(`/api/user/${userId}`);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error updating password." });
  }
};

