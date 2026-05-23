// ============================================================
// controllers/productController.js — Product CRUD
// Image is now uploaded via multer + cloudinary
// req.imageData contains the Cloudinary URL and public_id after upload
// ============================================================

const Product = require("../models/product");
const User    = require("../models/user");
const { upload, uploadToCloudinary } = require('../middleware/upload');
const cloudinary = require("cloudinary").v2;

// ── @route  POST /api/products ────────────────────────────────
// @desc    Create a new product with optional image upload
// @access  Admin, Superadmin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!name || !description || !price || !category) {
      // If validation fails but a file was uploaded, delete it from Cloudinary
      // so we don't leave orphaned images
      if (req.imageData && req.imageData.public_id) {
        await cloudinary.uploader.destroy(req.imageData);
      }
      return res.status(400).json({
        error: "Name, description, price, and category are required.",
      });
    }

    if (parseFloat(price) < 0) {
      if (req.file && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({ error: "Price cannot be negative." });
    }

    // ── Image URL ─────────────────────────────────────────────
    // If admin uploaded a file → use the Cloudinary URL (req.imageData.url)
    // If no file uploaded → use placeholder
    const imageUrl = req.imageData
      ? req.imageData.url
      : "https://placehold.co/400x400?text=No+Image";

    // ── Create product ────────────────────────────────────────
    const product = await Product.create({
      name:        name.trim(),
      description: description.trim(),
      price:       parseFloat(price),
      category:    category.trim(),
      image:       imageUrl,
      stock:       parseInt(stock) || 0,
      createdBy:   req.user._id,
    });

    return res.status(201).json({
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("createProduct error:", error.message);
    return res.status(500).json({ error: "Could not create product." });
  }
};

// ── @route  GET /api/products ─────────────────────────────────
// @desc    Get all products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: products.length, products });
  } catch (error) {
    console.error("getAllProducts error:", error.message);
    return res.status(500).json({ error: "Could not get products." });
  }
};

// ── @route  GET /api/products/search?q=term ──────────────────
// @desc    Search products by name or description
// @access  Public
const getProduct = async (req, res) => {
  try {
    const term = req.query.q || "";

    if (!term.trim()) {
      return res.status(400).json({ error: "Please provide a search term." });
    }

    const regex = new RegExp(term.trim(), "i");

    const products = await Product.find({
      $or: [{ name: regex }, { description: regex }],
    }).populate("createdBy", "name email");

    if (products.length === 0) {
      return res.status(404).json({
        error: `No products found matching "${term}".`,
      });
    }

    return res.status(200).json({ count: products.length, products });
  } catch (error) {
    console.error("getProduct error:", error.message);
    return res.status(500).json({ error: "Could not search products." });
  }
};

// ── @route  PUT /api/products/:id ────────────────────────────
// @desc    Update a product — admin can only update their own
// @access  Admin, Superadmin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      // Clean up uploaded image if product not found
      if (req.file && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(404).json({ error: "Product not found." });
    }

    // ── Ownership check ───────────────────────────────────────
    // Admin can only edit products they created
    // Superadmin can edit any product
    if (
      req.user.role === "admin" &&
      product.createdBy.toString() !== req.user._id.toString()
    ) {
      if (req.file && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(403).json({
        error: "You can only edit your own products.",
      });
    }

    // ── Handle image update ───────────────────────────────────
    if (req.file) {
      // New image uploaded — delete the old one from Cloudinary first
      // to avoid leaving unused images on the account
      if (product.image && product.image.includes("cloudinary")) {
        // Extract the public_id from the old Cloudinary URL
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/luxstore/products/public_id.jpg
        const parts   = product.image.split("/");
        const fileWithExt = parts[parts.length - 1];
        const folder      = parts[parts.length - 2];
        const parentFolder = parts[parts.length - 3];
        const publicId = `${parentFolder}/${folder}/${fileWithExt.split(".")[0]}`;

        try {
          await cloudinary.uploader.destroy(publicId);
        } catch {
          // Silently fail if old image delete fails — not critical
        }
      }
      product.image = req.file.path;
    }

    // ── Update only provided fields ───────────────────────────
    const { name, description, price, category, stock } = req.body;

    if (name)                product.name        = name.trim();
    if (description)         product.description = description.trim();
    if (price !== undefined) product.price       = parseFloat(price);
    if (category)            product.category    = category.trim();
    if (stock !== undefined) product.stock       = parseInt(stock);

    await product.save();

    return res.status(200).json({
      message: `"${product.name}" updated successfully.`,
      product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid product ID." });
    }
    console.error("updateProduct error:", error.message);
    return res.status(500).json({ error: "Could not update product." });
  }
};

// ── @route  DELETE /api/products/:id ─────────────────────────
// @desc    Delete a product and its image from Cloudinary
// @access  Admin (own products only), Superadmin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    // ── Ownership check ───────────────────────────────────────
    if (
      req.user.role === "admin" &&
      product.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        error: "You can only delete your own products.",
      });
    }

    // ── Delete image from Cloudinary ──────────────────────────
    if (product.image && product.image.includes("cloudinary")) {
      const parts        = product.image.split("/");
      const fileWithExt  = parts[parts.length - 1];
      const folder       = parts[parts.length - 2];
      const parentFolder = parts[parts.length - 3];
      const publicId     = `${parentFolder}/${folder}/${fileWithExt.split(".")[0]}`;

      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Silently fail — still delete the product from DB
      }
    }

    await product.deleteOne();

    return res.status(200).json({
      message: `"${product.name}" deleted successfully.`,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid product ID." });
    }
    console.error("deleteProduct error:", error.message);
    return res.status(500).json({ error: "Could not delete product." });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
