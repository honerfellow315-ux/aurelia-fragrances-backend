// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.post('/validate', async (req, res) => {
  try {
    const { items } = req.body;

    // 🔒 Safety check (IMPORTANT)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required'
      });
    }

    const results = [];

    for (const item of items) {
      try {
        const product = await Product.findById(item.productId)
          .select('name price stock isAvailable sizes');

        // ❌ Product not found or unavailable
        if (!product || !product.isAvailable) {
          results.push({
            productId: item.productId,
            available: false,
            message: 'Product not available'
          });
          continue;
        }

        // 📦 Stock check
        const quantity = item.quantity || 1;
        const inStock = product.stock >= quantity;

        // 💰 Price calculation (size based or default)
        let price = product.price;

        if (item.size && Array.isArray(product.sizes)) {
          const matchedSize = product.sizes.find(
            s => String(s.ml) === String(item.size)
          );
          if (matchedSize) {
            price = matchedSize.price;
          }
        }

        results.push({
          productId: item.productId,
          available: inStock,
          currentStock: product.stock,
          currentPrice: price,
          message: inStock
            ? 'OK'
            : `Only ${product.stock} left in stock`
        });

      } catch (err) {
        // 🔒 Single product error won't break whole cart
        results.push({
          productId: item.productId,
          available: false,
          message: 'Error checking product'
        });
      }
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Cart validation error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;