const express = require('express');
const router = express.Router();
const { cloudinary, uploadProduct } = require('../config/cloudinary');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 🖼️ Upload Product Image (Admin only)
router.post(
  '/',
  protect,
  adminOnly,
  uploadProduct.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const file = req.files?.image?.[0] || req.files?.file?.[0];
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      res.json({
        success: true,
        url: file.path,
        public_id: file.filename
      });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Upload failed'
      });
    }
  }
);

// 🗑️ Delete Cloudinary asset (Admin only)
router.delete('/asset/:publicId', protect, adminOnly, async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID required'
      });
    }
    await cloudinary.uploader.destroy(publicId);
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset'
    });
  }
});

module.exports = router;
