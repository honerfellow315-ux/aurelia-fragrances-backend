const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ======================
// EMAIL VIA BREVO API
// ======================
const sendEmail = async (to, subject, text) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'Aurelia Parfums', email: 'redscorpio056@gmail.com' },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Email send failed');
  }
};

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// ======================
// REGISTER + SEND OTP
// ======================
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone, email and password required' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone already registered' });
    }

    const otp = generateOTP();

    await User.create({ name, phone, email, password, otp, otpExpires: Date.now() + 10 * 60 * 1000 });

    await sendEmail(email, 'Aurelia Verification OTP', `Your verification OTP is ${otp}`);

    res.status(201).json({ success: true, message: 'OTP sent to email. Verify your account.' });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// ======================
// VERIFY OTP
// ======================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otp');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user._id);

    res.json({ success: true, message: 'Account verified', token, user: { id: user._id, name: user.name, role: user.role } });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ======================
// LOGIN
// ======================
exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      return res.status(400).json({ success: false, message: 'Email/phone and password required' });
    }

    // phone ya email dono se login ho sakta hai
    const query = phone ? { phone } : { email };
    const user = await User.findOne(query).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect credentials' });
    }

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account disabled' });
    if (!user.isVerified) return res.status(403).json({ success: false, message: 'Verify OTP first' });

    const token = signToken(user._id);

    res.json({ success: true, token, user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ======================
// FORGOT PASSWORD OTP
// ======================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Email not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(email, 'Password Reset OTP', `Your reset OTP is ${otp}`);

    res.json({ success: true, message: 'OTP sent' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ======================
// RESET PASSWORD
// ======================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+otp');

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password changed' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ======================
// PROFILE
// ======================
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email, address }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// ======================
// DELETE ACCOUNT (re-auth required)
// ======================
exports.deleteAccount = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email.toLowerCase() !== String(email).toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Email does not match your account' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
