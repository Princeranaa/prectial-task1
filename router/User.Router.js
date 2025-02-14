const express = require("express");
const userRouter = express.Router();
const { userCreated, userLogin, getUserDetails, getDashboard, logout } = require("../Controller/User-Controller");

// Registration Routes
userRouter.get("/", (req, res) => {
    res.render("User", { 
        error: req.flash("error"),
        success: req.flash("success"),
        user: req.session.user || null 
    });
});

userRouter.post("/register", userCreated);

// Login Routes
userRouter.get("/login", (req, res) => {
    res.render("userLogin", { 
        user: req.session.user || null, 
        success: req.flash("success"), 
        error: req.flash("error") 
    });
});

userRouter.post("/login", userLogin);

// Dashboard Route
userRouter.get('/dashboard', getDashboard);

// Logout Route
userRouter.get('/logout', logout);

// User Details Route
userRouter.get('/user/:id', getUserDetails);

module.exports = userRouter;
