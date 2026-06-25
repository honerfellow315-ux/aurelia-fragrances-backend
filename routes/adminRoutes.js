const express = require('express');
const router = express.Router();

const {
  getDashboard,
  getAllOrders,
  updateOrderStatus,
  verifyPayment,
  getAllUsers,
  toggleUser
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// ⚠️ DEMO MODE: Admin protection disabled so the panel is publicly browsable.
// To re-enable, uncomment the two lines below.
// router.use(protect);
// router.use(adminOnly);

// 📊 Dashboard
router.get('/dashboard', getDashboard);

// 📦 Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/verify-payment', verifyPayment);

// 👤 Users
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUser);

module.exports = router;