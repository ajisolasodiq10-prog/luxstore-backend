const mongoose = require("mongoose");

// Step 1 — Define the shape (called a "schema")
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },

  priceAtAdd: {
    type: Number,
    required: true,
  },
});
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  items: {
    type: [cartItemSchema],
    required: true,
    default: [],
  },
});

const CartItem = mongoose.model("CartItem", cartItemSchema);
const Cart = mongoose.model("Cart", cartSchema);

module.exports = { CartItem, Cart };