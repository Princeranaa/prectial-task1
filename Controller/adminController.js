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
