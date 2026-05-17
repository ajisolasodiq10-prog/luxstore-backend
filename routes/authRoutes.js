const express = require ("express")
const rateLimit = require ("express-rate-limit")
const { registerUser, loginUser, getMe, getAllUsers, changeUserRole } = require ("../controllers/authControllers")
const router = express.Router();
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

// Any logged-in user
// router.get("/profile", protect, getProfile);

// // Only admin OR superadmin
// router.post("/products", protect, authorizeRoles("admin", "superadmin"), createProduct);

// // Only superadmin
// router.put("/users/:id/role", protect, authorizeRoles("superadmin"), changeUserRole);



// Rate limiter — slow down brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  message: { error: "Too many attempts. Wait 15 minutes and try again." } // error message
});



router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.get("/users", protect, authorizeRoles("admin", "superadmin"), getAllUsers);
router.put("/users/:id/role", protect, authorizeRoles("superadmin"), changeUserRole);

// router.get("/me", protect, getMe);

// router.get("/test", protect, authorizeRoles("admin", "superadmin"), adminTest);



module.exports = router;