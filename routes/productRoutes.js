const express = require("express");
const { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

const router = express.Router();

router.post("/",  protect, authorizeRoles("admin", "superadmin"), upload.single("image"),  createProduct);
router.get("/",  getAllProducts);
router.get("/search", protect, getProduct);
router.put("/:id", protect, authorizeRoles("admin", "superadmin"), upload.single("image"),  updateProduct);
router.delete("/:id",  protect,  authorizeRoles("admin", "superadmin"), deleteProduct);

// ── Multer error handler ──────────────────────────────────────
// Catches multer-specific errors like file too large or wrong type
// Must be defined after the routes that use multer
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Image must be smaller than 5MB." });
  }
  if (err.message && err.message.includes("Only JPG")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;