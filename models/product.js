const mongoose = require("mongoose");

// Step 1 — Define the shape (called a "schema")
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // can't be left blank
    trim: true, // removes extra spaces around the value
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  price: {
    type: Number,
    required: true,
  },

   category: {
    type: String,
    required: true,
    trim:true,
  },
   image: {
    type: String,
    required: true,
  },
   stock: {
    type: Number,
    required: true,
    default: 0, 
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // automatically set to right now when created
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;