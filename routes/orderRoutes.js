const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  trackOrder,
  uploadPaymentScreenshot
} = require('../controllers/orderController');

const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { uploadPayment } = require('../config/cloudinary');

router.post('/', optionalAuth, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/track/:orderId', trackOrder);
router.post('/:id/payment-screenshot', uploadPayment.single('screenshot'), uploadPaymentScreenshot);

module.exports = router;