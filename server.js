const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

/* ─── RATE LIMIT ───────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

/* ─── CORS FIX (PRODUCTION SAFE) ───────────── */
// DEMO MODE: open CORS so the demo frontend on any Vercel preview URL works.
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ─── MIDDLEWARE ───────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', limiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ─── TEST ROUTE ───────────────────────────── */
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is working 🚀'
  });
});

/* ─── ROUTES ───────────────────────────────── */
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/products', require('./routes/productRoutes'));
app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.use('/api/v1/cart', require('./routes/cartRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/upload', require('./routes/uploadRoutes'));

/* ─── HEALTH CHECK ─────────────────────────── */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌹 Aurelia Parfums API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

/* ─── 404 HANDLER ──────────────────────────── */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/* ─── ERROR HANDLER ────────────────────────── */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

/* ─── DATABASE + SERVER START ──────────────── */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API: /api/v1`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
