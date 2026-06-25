const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ADMIN
    const existingAdmin = await User.findOne({
      phone: '0300XXXXXXX'
    });

    if (!existingAdmin) {
      await User.create({
        name: 'Aurelia Admin',
        phone: '0300XXXXXXX',
        email: 'demo@aurelia.example',
        password: 'Demo@123456',
        role: 'admin',
        isVerified: true
      });

      console.log('✅ Admin created successfully');
    } else {
      console.log('ℹ️ Admin already exists');
    }


    // PRODUCTS
    const count = await Product.countDocuments();

    if (count === 0) {

      await Product.insertMany([

        {
          name: 'Noir Eclipse',
          slug: 'noir-eclipse',
          description: 'Premium fragrance by Aurelia.',
          price: 2800,
          category: 'EDP',
          stock: 50,
          isFeatured: true,
          badge: 'Bestseller',
          fragrantNotes: {
            top: 'Fresh',
            heart: 'Floral',
            base: 'Oud'
          },
          sizes: [
            { ml: 30, price: 2800, stock: 20 },
            { ml: 50, price: 3800, stock: 20 },
            { ml: 100, price: 5500, stock: 10 }
          ],
          tags: [
            'wanted',
            'abdul-rauf',
            'bestseller'
          ]
        },


        {
          name: 'Velvet Bloom',
          slug: 'velvet-bloom',
          description: 'Elegant floral fragrance by Aurelia.',
          price: 4500,
          category: 'Attar',
          stock: 30,
          isFeatured: true,
          badge: 'New Arrival',
          fragrantNotes: {
            top: 'Rose',
            heart: 'Floral',
            base: 'Musk'
          },
          sizes: [
            { ml: 10, price: 2500, stock: 10 },
            { ml: 30, price: 4500, stock: 15 },
            { ml: 50, price: 6500, stock: 5 }
          ],
          tags: [
            'flora',
            'malka',
            'new'
          ]
        }

      ]);

      console.log('✅ Products seeded successfully');

    } else {
      console.log('ℹ️ Products already exist');
    }


    await mongoose.disconnect();

    console.log('🎉 Seed completed successfully');

  } catch (error) {

    console.error('❌ Seed error:', error.message);

    process.exit(1);
  }
}

seed();