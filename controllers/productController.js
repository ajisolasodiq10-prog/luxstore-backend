const Product = require("../models/product");
const User = require("../models/user");

  //create a new product  
 const createProduct = async (req, res) => {

  const { name, description, price, category, image, stock } = req.body;

  // Validate required fields
  if (!name || !description || !price || !category || !image) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      stock,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: "Product added successfully.",
      product,
    });

  } catch (error) {
    // Mongoose throws a ValidationError if a value isn't in the enum list
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Add product error:", error.message);
    res.status(500).json({ error: "Could not add product." });
  }
};

// // GET /api/products — returns all products in the database
// const getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find(filter)
//     .populate("createdBy", "name");

//     return res.status(200).json({
//       message: "Products retrieved successfully.",
//       count: products.length,
//       products,
//     });

//   } catch (error) {
//     console.error("getAllProducts error:", error.message);
//     return res.status(500).json({ error: "Could not get products." });
//   }
// };


// // GET /api/products/search?q=orange — returns all products matching the search term
// const getProduct = async (req, res) => {
//   try {
//     const term = req.query.q || "";

//     if (!term.trim()) {
//       return res.status(400).json({ error: "Please provide a search term." });
//     }

//     const regex = new RegExp(term.trim(), "i");

//     const products = await Product.find({
//       $or: [
//         { name: regex },
//         { description: regex },
//       ],
//     }).populate("createdBy", "name email");

//     if (products.length === 0) {
//       return res.status(404).json({ error: `No products found matching "${term}".` });
//     }

//     return res.status(200).json({
//       message: `${products.length} product(s) found for "${term}".`,
//       count: products.length,
//       products,
//     });

//   } catch (error) {
//     console.error("getProduct error:", error.message);
//     return res.status(500).json({ error: "Could not search products." });
//   }
// };


// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("createdBy", "name email");
    return res.status(200).json({ count: products.length, products });
  } catch (error) {
    console.error("getAllProducts error:", error.message);
    return res.status(500).json({ error: "Could not get products." });
  }
};

// GET /api/products/search?q=term
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
      return res.status(404).json({ error: `No products found matching "${term}".` });
    }

    return res.status(200).json({ count: products.length, products });
  } catch (error) {
    console.error("getProduct error:", error.message);
    return res.status(500).json({ error: "Could not search products." });
  }
};





// edit product details
// PUT /api/products/:id  —  Update a product (admin that own the product only)
// :id is a URL parameter — e.g. /api/products/64abc123
// It's available as req.params.id

    const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    if (!product.createdBy.equals(req.user._id)) {
      return res.status(403).json({ error: "You are not authorized to edit this product." });
    }

    Object.assign(product, req.body);
    await product.save();

    res.status(200).json({ message: `"${product.name}" updated.`, 
       product:
        // products.map((product) => (
          {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          image: product.image,
          stock: product.stock,
          // createdBy: product.createdBy,
        }
      // )),
    });

  } catch (error) {
    // CastError happens when the :id isn't a valid MongoDB ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid product ID." });
    }
    console.error("Update product error:", error.message);
    res.status(500).json({ error: "Could not update product." });
  }
};


// DELETE /api/products/:id  —  Remove a product (admin that own the product only)
// :id is a URL parameter — e.g. /api/products/64abc123
// It's available as req.params.id
// router.delete("/:id", protect, admin,

    const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    if (!product.createdBy.equals(req.user._id)) {
      return res.status(403).json({ error: "You are not authorized to delete this product." });
    }

    await product.deleteOne();

    res.status(200).json({ message: `"${product.name}" deleted.` });

  } catch (error) {
    // CastError happens when the :id isn't a valid MongoDB ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid product ID." });
    }
    console.error("Delete product error:", error.message);
    res.status(500).json({ error: "Could not delete product." });
  }
};

module.exports = { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct };
