const express = require('express');
const router = express.Router();
const {
  getAllProducts, getProduct, createProduct,
  updateProduct, deleteProduct, deleteProductImage,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadProduct } = require('../config/cloudinary');

router.get('/',    getAllProducts);
router.get('/:id', getProduct);

// Admin only
router.post('/',                          protect, adminOnly, uploadProduct.array('images', 5), createProduct);
router.put('/:id',                        protect, adminOnly, uploadProduct.array('images', 5), updateProduct);
router.delete('/:id',                     protect, adminOnly, deleteProduct);
router.delete('/:id/image/:publicId',     protect, adminOnly, deleteProductImage);

module.exports = router;
