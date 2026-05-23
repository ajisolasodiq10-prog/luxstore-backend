const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const dotenv   = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const multerUpload = multer({ storage });
const upload = multerUpload.single('image');

const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // If Cloudinary isn't configured, fall back to saving locally for testing.
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const ext = req.file.originalname.split('.').pop();
      const filename = `upload_${timestamp}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);

      // Expose a local URL path (static serving must be configured by the app if needed)
      req.imageData = { url: `/uploads/${filename}` };
      // also set file.path to mimic a path-based upload
      req.file.path = filePath;
      return next();
    }

    const bufferStream = streamifier.createReadStream(req.file.buffer);

    const uploadFromStream = () =>
      new Promise((resolve, reject) => {
        const writeStream = cloudinary.uploader.upload_stream((error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        bufferStream.pipe(writeStream);
      });

    const result = await uploadFromStream();
    req.imageData = {
      url: result.secure_url,
    };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
};

module.exports = { upload, uploadToCloudinary };
