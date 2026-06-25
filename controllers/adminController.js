const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/v1/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [totalOrders, totalUsers, totalProducts, pendingOrders, revenueData] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isAvailable: true }),
      Order.countDocuments({ status: 'Pending' }),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name phone');

    res.json({
      success: true,
      stats: { totalOrders, totalUsers, totalProducts, pendingOrders, totalRevenue },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const { status, payment, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (payment) query['payment.status'] = payment;

    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'name phone');

    const total = await Order.countDocuments(query);

    res.json({ success: true, count: orders.length, total, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/admin/orders/:id/status  — update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, riderName, riderPhone } = req.body;

    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.status = status;
    order.statusHistory.push({ status, note: note || `Status updated to ${status}` });

    if (riderName) order.rider = { name: riderName, phone: riderPhone };

    await order.save();

    res.json({ success: true, message: `Order ${status}`, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/admin/orders/:id/verify-payment
exports.verifyPayment = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.payment.status = 'Verified';
    order.payment.verifiedAt = new Date();
    if (order.status === 'Pending') {
      order.status = 'Confirmed';
      order.statusHistory.push({ status: 'Confirmed', note: 'Payment verified by admin' });
    }

    await order.save();
    res.json({ success: true, message: 'Payment verified. Order confirmed!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/admin/users/:id/toggle  — enable/disable user
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? 'enabled' : 'disabled'}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
