const express = require("express");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");
const {
  checkout,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");

const router = express.Router();

// specific routes first — always above /:id
router.post("/checkout", protect, checkout);
router.get("/my-orders", protect, getMyOrders);
router.get("/", protect, authorizeRoles("admin", "superadmin"), getAllOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, authorizeRoles("admin", "superadmin"), updateOrderStatus);

module.exports = router;
