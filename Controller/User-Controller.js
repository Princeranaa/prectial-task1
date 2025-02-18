const UserModel = require("../model/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const userValidationRules = require("../validation/UserValidation");
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
      const {name,email, password, phone, fullName, userName } = req.body;

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
        name,
        userName,
        email,
        fullName,
        password: hashedPassword,
        phone,
        
      });

      await user.save();
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
    res.render("userDetails", {
      user,
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
      req.flash(
        "error",
        "You don't have an account. Please create an account."
      );
      return res.redirect("/api/user");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid credentials.");
      return res.redirect("/api/user/login");
    }

    // Collect device information
    const userdevicename = os.hostname(); // Device name
    const userOS = os.platform(); // OS information
    const userBrowser = req.headers["user-agent"]; // Browser information (simplified)

    // Set user session and update login details
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      userdevice: userdevicename,
    };

    // Update last login device details
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        lastLoginDevice: {
          device: userdevicename,
          os: userOS,
          browser: userBrowser,
        },
        lastLoginDate: new Date(),
      },
      { new: true } // Return the updated document
    );

    // Log the updated user data for debugging
    console.log("Updated User:", updatedUser);

    req.flash("success", `Welcome back, ${user.name}!`);
    return res.redirect("/api/user/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong. Please try again later.");
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

    res.render("userDetails", {
      user,
      activeUsersCount,
      inactiveUsersCount,
      totalUsers,
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

//=>>>>>>>>>>>>>>>>>>>  userpassword is updated by the admin ==>>>>>>>>>>>>>>>>
exports.updateUserPassword = async (req, res) => {
  const { newPassword } = req.body;
  const { userId } = req.params; // Access user ID from the URL parameter

  if (!userId || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "User ID and new password are required.",
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
    res.redirect(`/api/user/user/${userId}`);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error updating password." });
  }
};
