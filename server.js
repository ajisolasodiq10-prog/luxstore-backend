const express = require ("express")
const path = require("path");
const cors = require("cors");
const dotenv = require ("dotenv")
const connectDB = require ("./config/db")
const authRoutes = require ("./routes/authRoutes");
const productRoutes = require ("./routes/productRoutes")
const cartRoutes = require ("./routes/cartRoutes")
const orderRoutes = require ("./routes/orderRoutes")

dotenv.config();
connectDB();

const app = express();


app.use(
  cors({
    origin:[
       "http://localhost:5000/api",
             "https://luxstore-three.vercel.app/",
             
            ],
      credentials: true,
  }),
);

app.use(express.json());

// app.use(express.json()); // parse application/json bodies
// app.use(express.urlencoded({ extended: true })); 

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders",   orderRoutes);

app.get("*", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong." });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
console.log(`server running on port ${PORT}`)
)
