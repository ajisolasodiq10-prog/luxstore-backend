const express = require("express");
const { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

const router = express.Router();

router.post("/",  protect, authorizeRoles("admin", "superadmin"), createProduct);
router.get("/", protect, getAllProducts);
router.get("/search", protect, getProduct);
router.put("/:id", protect, authorizeRoles("admin", "superadmin"), updateProduct);
router.delete("/:id",  protect,  authorizeRoles("admin", "superadmin"), deleteProduct);

module.exports = router;