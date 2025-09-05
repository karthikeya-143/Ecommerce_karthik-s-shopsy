require('dotenv').config();

const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

// API test route
app.get('/', (req, res) => {
  res.send("🚀 Express app is running");
});

// Image Storage Engine (local uploads)
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'upload/images'),
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Serve static images folder
app.use('/images', express.static(path.join(__dirname, 'upload/images')));

// Upload endpoint
app.post("/upload", upload.single('product'), (req, res) => {
  const backendUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    success: 1,
    image_url: `${backendUrl}/images/${req.file.filename}`
  });
});

// Product Schema
const Product = mongoose.model("product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true }
});

// Add Product
app.post('/addproduct', async (req, res) => {
  let products = await Product.find({});
  let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

  const product = new Product({
    id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price
  });

  await product.save();
  console.log("✅ Product Saved");
  res.json({ success: true, name: req.body.name });
});

// Remove Product
app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("🗑️ Product Removed");
  res.json({ success: true });
});

// Get All Products
app.get('/allproducts', async (req, res) => {
  let products = await Product.find({});
  console.log("📦 All Products Fetched");
  res.send(products);
});

// User Schema
const Users = mongoose.model('Users', {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  date: { type: Date, default: Date.now }
});

// Signup
app.post('/signup', async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, errors: "User already exists" });
  }

  let cart = {};
  for (let i = 0; i < 300; i++) cart[i] = 0;

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    cartData: cart,
  });
  await user.save();

  const data = { user: { id: user.id } };
  const token = jwt.sign(data, process.env.JWT_SECRET);

  res.json({ success: true, token });
});

// Login
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (!user) return res.json({ success: false, errors: "Wrong Email Id" });

  const passCompare = await bcrypt.compare(req.body.password, user.password);
  if (!passCompare) return res.json({ success: false, errors: "Wrong Password" });

  const data = { user: { id: user.id } };
  const token = jwt.sign(data, process.env.JWT_SECRET);

  res.json({ success: true, token });
});

// New Collections
app.get('/newcollections', async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(-8);
  console.log("✨ New Collection Fetched");
  res.send(newcollection);
});

// Popular in Women
app.get('/popularinwomen', async (req, res) => {
  let products = await Product.find({ category: "women" });
  let popular_in_women = products.slice(0, 4);
  console.log("🔥 Popular in Women Fetched");
  res.send(popular_in_women);
});

// Middleware to fetch user from token
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).send({ errors: 'Please authenticate with a valid token' });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.user;
    next();
  } catch {
    res.status(401).send({ errors: 'Invalid Token' });
  }
};

// Cart APIs
app.post('/addtocart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
  res.json({ message: "Added" });
});

app.post('/removefromcart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0) {
    userData.cartData[req.body.itemId] -= 1;
    await Users.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
  }
  res.json({ message: "Removed" });
});

app.post('/getcart', fetchUser, async (req, res) => {
  try {
    const userData = await Users.findOne({ _id: req.user.id });
    if (!userData) return res.status(404).json({ error: 'User not found' });
    res.json(userData.cartData);
  } catch (error) {
    console.error('Error in /getcart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server Running on Port: ${port}`);
});
