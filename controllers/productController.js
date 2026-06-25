const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// GET /api/v1/products  — public
exports.getAllProducts = async (req, res) => {
  try {
    const { category, featured, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    const query = { isAvailable: true };
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const products = await Product.find(query).sort(sort).skip(skip).limit(Number(limit));
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/products/:id  — public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
      isAvailable: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/products  — admin only
exports.createProduct = async (req, res) => {
  try {
    const { name, sub, description, price, oldPrice, category, stock, fragrantNotes, sizes, tags, isFeatured, badge, image } = req.body;

    // Handle uploaded images from Cloudinary via req.files
    let images = req.files?.map(file => ({
      url: file.path,
      public_id: file.filename,
    })) || [];

    // Agar frontend ne image URL bheja hai to use bhi add karo
    if (image && images.length === 0) {
      images = [{ url: image, public_id: '' }];
    }

    const product = await Product.create({
      name,
      sub,
      description,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      category,
      stock: Number(stock) || 0,
      fragrantNotes: fragrantNotes ? JSON.parse(fragrantNotes) : {},
      sizes: sizes ? JSON.parse(sizes) : [],
      tags: tags ? JSON.parse(tags) : [],
      isFeatured,
      badge,
      images,
    });

    res.status(201).json({ success: true, message: 'Product created!', product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/products/:id  — admin only
exports.updateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.fragrantNotes) updates.fragrantNotes = JSON.parse(updates.fragrantNotes);
    if (updates.sizes) updates.sizes = JSON.parse(updates.sizes);
    if (updates.tags) updates.tags = JSON.parse(updates.tags);

    if (req.files?.length > 0) {
      const newImages = req.files.map(f => ({ url: f.path, public_id: f.filename }));
      updates.$push = { images: { $each: newImages } };
      delete updates.images;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    res.json({ success: true, message: 'Product updated!', product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/products/:id  — admin only
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    for (const img of product.images) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/products/:id/image/:publicId  — admin only
exports.deleteProductImage = async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    await Product.findByIdAndUpdate(req.params.id, {
      $pull: { images: { public_id: req.params.publicId } },
    });
    res.json({ success: true, message: 'Image deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
