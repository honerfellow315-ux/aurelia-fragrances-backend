const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Name too long'],
  },
  sub: { type: String, maxlength: [200, 'Subtitle too long'] },
  slug: { type: String, lowercase: true, unique: true },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description too long'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  oldPrice: { 
    type: Number 
  },
  category: {
    type: String,
    enum: ['Attar', 'EDP', 'EDT', 'Musk', 'Oud', 'Gift Set'],
    required: true,
  },
  images: [{ url: String, public_id: String }],
  sizes: [{
    ml: Number,
    price: Number,
    stock: { type: Number, default: 0 },
  }],
  stock: { type: Number, default: 0 },
  fragrantNotes: {
    top:   String,
    heart: String,
    base:  String,
  },
  tags: [String],
  isFeatured:  { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  badge: { type: String, enum: ['Bestseller', 'New Arrival', 'Sale', 'Limited', 'Limited Offer', ''], default: '' },
  ratings: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
}, { timestamps: true });

// Auto-generate slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
