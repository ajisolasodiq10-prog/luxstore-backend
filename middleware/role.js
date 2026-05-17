


// authorizeRoles takes a list of allowed roles
// and returns a middleware function that checks the logged-in user's role

const authorizeRoles = (...roles) => {
  // "...roles" means you can pass one or many:
  // authorizeRoles("admin")
  // authorizeRoles("admin", "superadmin")

  return (req, res, next) => {
    // req.user was attached by protect middleware before this runs
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    // Check if the user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message:` Access denied. Required role: [${roles.join(", ")}]. Your role: ${req.user.role}`
      });
    }

    // Role matches — continue
    next();
  };
};

module.exports = { authorizeRoles };