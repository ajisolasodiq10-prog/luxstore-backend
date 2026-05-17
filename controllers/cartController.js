const CartItem = require("../models/product");
const Cart = require("../models/product");

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price image stock"
    );

    if (!cart) {
      return res.status(200).json({ items: [], total: 0 });
    }

    const total = cart.items.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );

    return res.status(200).json({ cart, total });
  } catch (error) {
    console.error("getCart error:", error.message);
    return res.status(500).json({ error: "Could not get cart." });
  }
};


// POST /api/cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required." });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    if (product.stock === 0) {
      return res.status(400).json({ error: "Product is out of stock." });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        error: `Only ${product.stock} unit(s) available.`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          error: `Cannot add ${qty} more. Only ${product.stock - existingItem.quantity} unit(s) left.`,
        });
      }
      existingItem.quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        quantity: qty,
        priceAtAdd: product.price,
      });
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price image stock"
    );

    const total = updatedCart.items.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );

    return res.status(200).json({
      message: "Item added to cart.",
      cart: updatedCart,
      total,
    });
  } catch (error) {
    console.error("addToCart error:", error.message);
    return res.status(500).json({ error: "Could not add item to cart." });
  }
};

// PUT /api/cart/:itemId
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found." });
    }

    const item = cart.items.find(
      (i) => i._id.toString() === req.params.itemId
    );
    if (!item) {
      return res.status(404).json({ error: "Item not found in cart." });
    }

    const product = await Product.findById(item.product);
    if (qty > product.stock) {
      return res.status(400).json({
        error: `Only ${product.stock} unit(s) available.`,
      });
    }

    item.quantity = qty;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price image stock"
    );

    const total = updatedCart.items.reduce(
      (sum, i) => sum + i.priceAtAdd * i.quantity,
      0
    );

    return res.status(200).json({
      message: "Cart updated.",
      cart: updatedCart,
      total,
    });
  } catch (error) {
    console.error("updateCartItem error:", error.message);
    return res.status(500).json({ error: "Could not update cart item." });
  }
};

// DELETE /api/cart/:itemId
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found." });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price image stock"
    );

    const total = updatedCart.items.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );

    return res.status(200).json({
      message: "Item removed from cart.",
      cart: updatedCart,
      total,
    });
  } catch (error) {
    console.error("removeFromCart error:", error.message);
    return res.status(500).json({ error: "Could not remove item." });
  }
};

// DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found." });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({ message: "Cart cleared successfully." });
  } catch (error) {
    console.error("clearCart error:", error.message);
    return res.status(500).json({ error: "Could not clear cart." });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
