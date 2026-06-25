const Order = require('../models/Order');
const Product = require('../models/Product');

// POST /api/v1/orders  — create order (guest or logged-in)
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, payment, guestInfo } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Local product (koi DB id nahi) — directly add karo
      if (!item.product) {
        orderItems.push({
          productName: item.productName,
          productImage: item.productImage || '',
          size: item.size || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
        subtotal += item.totalPrice;
        continue;
      }

      const product = await Product.findById(item.product);
      if (!product || !product.isAvailable) {
        return res.status(400).json({ success: false, message: `Product ${item.product} not available.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `${product.name} has only ${product.stock} units left.` });
      }

      const unitPrice = item.size
        ? (product.sizes.find(s => s.ml == item.size)?.price || product.price)
        : product.price;

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.images[0]?.url || '',
        size: item.size ? `${item.size}ml` : '',
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });

      // Deduct stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const deliveryFee = 299;
    const totalAmount = subtotal + deliveryFee;

    const order = await Order.create({
      user: req.user?._id,
      guestInfo: req.user ? undefined : guestInfo,
      items: orderItems,
      shippingAddress,
      payment: { method: payment.method, status: 'Pending' },
      subtotal,
      deliveryFee,
      totalAmount,
      statusHistory: [{ status: 'Pending', note: 'Order placed successfully' }],
    });

    res.status(201).json({
      success: true,
      message: `Order placed! Your order ID is ${order.orderId}`,
      order: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.payment.method,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/my  — logged-in user's orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name images');

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/track/:orderId  — public tracking
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .select('orderId status statusHistory shippingAddress payment rider createdAt updatedAt items subtotal totalAmount deliveryFee');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found. Check the order ID.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/orders/:id/payment-screenshot  — upload payment proof
exports.uploadPaymentScreenshot = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a screenshot.' });

    order.payment.screenshotUrl = req.file.path;
    order.payment.screenshotPublicId = req.file.filename;
    order.payment.status = 'Uploaded';
    await order.save();

    res.json({ success: true, message: 'Screenshot uploaded! Admin will verify shortly.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
