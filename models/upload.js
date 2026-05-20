// ============================================================
// middleware/upload.js — Multer + Cloudinary Configuration
// Handles image uploads and stores them on Cloudinary
// Returns a URL that gets saved in the Product model
// ============================================================

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// ── Configure Cloudinary ──────────────────────────────────────
// Reads credentials from .env — never hardcode these
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Configure Storage ─────────────────────────────────────────
// CloudinaryStorage tells multer to upload directly to Cloudinary
// instead of saving to local disk
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "luxstore/products", // folder name in your Cloudinary dashboard
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width:   800,
        height:  800,
        crop:    "limit",  // never upscale, only downscale if larger than 800x800
        quality: "auto",   // cloudinary auto-optimizes quality
      },
    ],
  },
});

// ── File Filter ───────────────────────────────────────────────
// Reject anything that is not an image before it hits Cloudinary
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // accept the file
  } else {
    cb(new Error("Only JPG, PNG, and WEBP images are allowed."), false);
  }
};

// ── Multer Instance ───────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

module.exports = upload;
