require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Restaurant Admin',
      email: 'admin@example.com',
      phone: '1234567890',
      password: 'Admin@12345',
      role: 'admin',
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: Admin@12345');

    // Create sample menu items
    const menuItems = [
      {
        name: 'Paneer Pizza',
        description: 'Delicious pizza topped with fresh paneer, onions, and bell peppers',
        price: 250,
        category: 'Pizza',
        preparationTime: 15,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'Chicken Burger',
        description: 'Juicy chicken patty with fresh vegetables and special sauce',
        price: 180,
        category: 'Burger',
        preparationTime: 12,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'Pasta Alfredo',
        description: 'Creamy pasta with white sauce and parmesan cheese',
        price: 220,
        category: 'Pasta',
        preparationTime: 18,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'Paneer Tikka',
        description: 'Grilled paneer marinated in aromatic spices',
        price: 200,
        category: 'Starters',
        preparationTime: 15,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'French Fries',
        description: 'Crispy golden fries with seasoning',
        price: 120,
        category: 'Starters',
        preparationTime: 8,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'Cold Coffee',
        description: 'Refreshing cold coffee with ice cream',
        price: 100,
        category: 'Drinks',
        preparationTime: 5,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'Coke',
        description: 'Chilled Coca-Cola',
        price: 50,
        category: 'Drinks',
        preparationTime: 2,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'Vanilla Ice Cream',
        description: 'Creamy vanilla ice cream',
        price: 80,
        category: 'Desserts',
        preparationTime: 3,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'Butter Chicken',
        description: 'Classic butter chicken with rich tomato gravy',
        price: 280,
        category: 'Main Course',
        preparationTime: 25,
        image: '',
        createdBy: admin._id,
      },
      {
        name: 'Veg Biryani',
        description: 'Aromatic vegetable biryani with raita',
        price: 200,
        category: 'Main Course',
        preparationTime: 20,
        image: '',
        createdBy: admin._id,
      },
    ];

    await MenuItem.insertMany(menuItems);
    console.log('Sample menu items created successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

seedAdmin();
