const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();

// Session middleware setup (must come before flash)
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Flash middleware setup
app.use(flash());

// Middleware to make flash messages available to all views
app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    next();
});

// ... rest of your app configuration 