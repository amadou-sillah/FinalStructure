const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// ================= CORS (RENDER SAFE) =================
// Allow Vercel frontend + local dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://YOUR-VERCEL-APP.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow Postman / server-to-server / same-origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// IMPORTANT: handle preflight
app.options('*', cors());

// ================= BODY PARSERS =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= STATIC FILES =================
const publicPath = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// ================= TEST ROUTE =================
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

// ================= API ROUTES =================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// ================= API 404 =================
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error(err.message || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server error'
  });
});

// ================= DATABASE =================
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('MongoDB connected');
};

const createAdminUser = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@foodapp.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const exists = await User.findOne({ email });
  if (!exists) {
    await User.create({
      name: 'Admin',
      email,
      password,
      role: 'admin'
    });
    console.log('Admin user created');
  }
};

// ================= START =================
const startServer = async () => {
  try {
    await connectDB();
    await createAdminUser();

    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
};

startServer();
module.exports = app;
