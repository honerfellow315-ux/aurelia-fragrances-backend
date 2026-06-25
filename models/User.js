// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name too long'],
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^(03\d{9}|92\d{10})$/, 'Enter a valid Pakistani phone number'],
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },


  // USER ROLE
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },


  // ADDRESS
  address: {
    street: String,
    city: String,
    province: String,
  },


  // ACCOUNT STATUS
  isActive: {
    type: Boolean,
    default: true,
  },


  // ======================
  // OTP SYSTEM
  // ======================

  isVerified: {
    type: Boolean,
    default: false,
  },


  otp: {
    type: String,
    select: false,
  },


  otpExpires: {
    type: Date,
    select: false,
  },


}, { timestamps: true });



// Password Hash
userSchema.pre('save', async function(next) {

  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);

  next();
});



// Password Compare
userSchema.methods.comparePassword = async function(password) {

  return await bcrypt.compare(
    password,
    this.password
  );

};


module.exports = mongoose.model('User', userSchema);