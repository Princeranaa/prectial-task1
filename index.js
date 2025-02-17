require("dotenv").config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
const flash = require("connect-flash");
const session = require("express-session");

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Session & Flash Messages
app.use(
  session({
    secret: process.env.MY_SECRET_KEY || 'your-fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge: 24 * 60 * 60 * 1000 // 24 hours
    // }
  })
);
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    next();
});

// Connect to Database
const Db = require("./config/databse");
Db.connectToDb();

const userRouter = require("./router/User.Router");
const AdminRouter = require("./router/AdminRouter");

app.use("/api/user", userRouter);
app.use('/api/admin', AdminRouter );

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
