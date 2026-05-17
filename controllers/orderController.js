const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");

// POST /api/orders/checkout
const checkout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    // Validate stock for every item before doing anything
    const errors = [];
    for (const item of cart.items) {
      if (!item.product) {
        errors.push("One or more products in your cart no longer exist.");
        continue;
      }
      if (item.quantity > item.product.stock) {
        errors.push(
          `"${item.product.name}" only has ${item.product.stock} unit(s) in stock but you requested ${item.quantity}.`
        );
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Build order items — snapshot everything
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.priceAtAdd,
      quantity: item.quantity,
      image: item.product.image,
    }));

    // Calculate total
    const totalPrice = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create the order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice,
      status: "pending",
    });

    // Decrement stock for every product at the same time
    await Promise.all(
      cart.items.map((item) =>
        Product.findByIdAndUpdate(item.product._id, {
          $inc: { stock: -item.quantity },
        })
      )
    );

    // Clear the cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    console.error("checkout error:", error.message);
    return res.status(500).json({ error: "Checkout failed." });
  }
};

// GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("getMyOrders error:", error.message);
    return res.status(500).json({ error: "Could not get orders." });
  }
};

// GET /api/orders — admin only
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("getAllOrders error:", error.message);
    return res.status(500).json({ error: "Could not get orders." });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Customers can only view their own orders
    if (
      req.user.role === "user" &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Access denied." });
    }

    return res.status(200).json({ order });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid order id." });
    }
    console.error("getOrderById error:", error.message);
    return res.status(500).json({ error: "Could not get order." });
  }
};

// PUT /api/orders/:id/status — admin only
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ["pending", "shipped", "delivered", "cancelled"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed values: ${allowed.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.status === "delivered") {
      return res.status(400).json({ error: "Cannot change a delivered order." });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Cannot change a cancelled order." });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      message: `Order status updated to "${status}".`,
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid order id." });
    }
    console.error("updateOrderStatus error:", error.message);
    return res.status(500).json({ error: "Could not update order status." });
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
