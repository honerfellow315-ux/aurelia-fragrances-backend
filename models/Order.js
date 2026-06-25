const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // For guest orders (no account)
  guestInfo: {
    name:  String,
    phone: String,
    email: String,
  },
  items: [{
    product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,   // snapshot at order time
    productImage: String,
    size:        String,
    quantity:    { type: Number, required: true, min: 1 },
    unitPrice:   { type: Number, required: true },
    totalPrice:  { type: Number, required: true },
  }],
  shippingAddress: {
    street:   { type: String, required: true },
    city:     { type: String, required: true },
    province: { type: String, required: true },
    notes:    String,
  },
  payment: {
    method: {
      type: String,
      enum: ['COD', 'Easypaisa', 'JazzCash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Uploaded', 'Verified', 'Failed'],
      default: 'Pending',
    },
    screenshotUrl: String,
    screenshotPublicId: String,
    verifiedAt: Date,
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  statusHistory: [{
    status:    String,
    note:      String,
    updatedAt: { type: Date, default: Date.now },
  }],
  rider: {
    name:  String,
    phone: String,
  },
  subtotal:     { type: Number, required: true },
  deliveryFee:  { type: Number, default: 299 },
  discount:     { type: Number, default: 0 },
  totalAmount:  { type: Number, required: true },
}, { timestamps: true });

// Auto-generate order ID like AR-00042
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `AR-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
