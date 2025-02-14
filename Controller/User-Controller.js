const UserModel = require("../model/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const userValidationRules = require("../validation/UserValidation");

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
      const { name, email, password, phone, userName } = req.body;

      // Check if user already exists
      let existingUser = await UserModel.findOne({
        $or: [{ email }, { userName }],
      });

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
        password: hashedPassword,
        phone,
        fullName: name,
      });

      await user.save();
      req.flash(
        "success",
        "Account created successfully! Please login to continue."
      );
      res.redirect("/api/user/login");
    } catch (error) {
      console.error(error);
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

    // Set user session
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
    };

    req.flash("success", `Welcome back, ${user.name}!`);
    return res.redirect("/api/user/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong. Please try again later.");
    return res.redirect("/api/user/login");
  }
};

// Add a dashboard route handler
exports.getDashboard = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      req.flash("error", "Please login to access the dashboard");
      return res.redirect("/api/user/login");
    }

    // Get full user details from database
    const user = await UserModel.findById(req.session.user.id);

    // Get count of active users
    const activeUsersCount = await UserModel.countDocuments({
      status: "Active",
    });
    const totalUsers = await UserModel.countDocuments();
    const inactiveUsersCount = totalUsers - activeUsersCount;

    res.render("dashboard", {
      user,
      // stats: {
      //   activeUsers: activeUsersCount,
      //   inactiveUsers: inactiveUsersCount,
      //   totalUsers: totalUsers,
      // },
      // messages: { success: req.flash("success"), error: req.flash("error") },
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
