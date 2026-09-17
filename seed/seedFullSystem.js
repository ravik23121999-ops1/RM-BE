require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedFullSystem = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Restaurant.deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const admin = await User.create({
      name: 'Restaurant Admin',
      email: 'admin@example.com',
      phone: '1234567890',
      password: 'Admin@12345',
      role: 'admin',
    });
    console.log('Admin user created: admin@example.com / Admin@12345');

    // Create restaurants
    console.log('Creating restaurants...');
    const restaurant1 = await Restaurant.create({
      name: 'Tasty Bites',
      description: 'Delicious food with amazing flavors',
      address: '123 Main Street, City',
      phone: '555-1234',
      email: 'tasty@example.com',
      cuisine: ['Italian', 'Chinese', 'Indian'],
      openingHours: '10:00 AM - 11:00 PM',
      rating: 4.5,
      createdBy: admin._id,
    });

    const restaurant2 = await Restaurant.create({
      name: 'Spice Garden',
      description: 'Authentic Indian cuisine with traditional recipes',
      address: '456 Park Avenue, City',
      phone: '555-5678',
      email: 'spice@example.com',
      cuisine: ['Indian', 'Thai', 'Mexican'],
      openingHours: '11:00 AM - 10:00 PM',
      rating: 4.2,
      createdBy: admin._id,
    });

    console.log('Restaurants created:', restaurant1.name, restaurant2.name);

    // Create receptionist (manager) for restaurant 1
    console.log('Creating receptionist...');
    const receptionist1 = await User.create({
      name: 'John Manager',
      email: 'manager1@example.com',
      phone: '555-1111',
      password: 'Manager@12345',
      role: 'receptionist',
      restaurant: restaurant1._id,
    });
    console.log('Receptionist created: manager1@example.com / Manager@12345 (assigned to Tasty Bites)');

    // Create receptionist (manager) for restaurant 2
    const receptionist2 = await User.create({
      name: 'Jane Manager',
      email: 'manager2@example.com',
      phone: '555-2222',
      password: 'Manager@12345',
      role: 'receptionist',
      restaurant: restaurant2._id,
    });
    console.log('Receptionist created: manager2@example.com / Manager@12345 (assigned to Spice Garden)');

    // Create menu items for restaurant 1
    console.log('Creating menu items for Tasty Bites...');
    const menuItems1 = [
      {
        name: 'Paneer Pizza',
        description: 'Delicious pizza topped with fresh paneer, onions, and bell peppers',
        price: 250,
        category: 'Pizza',
        preparationTime: 15,
        image: '',
        restaurant: restaurant1._id,
        createdBy: admin._id,
      },
      {
        name: 'Chicken Burger',
        description: 'Juicy chicken patty with fresh vegetables and special sauce',
        price: 180,
        category: 'Burger',
        preparationTime: 12,
        image: '',
        restaurant: restaurant1._id,
        createdBy: admin._id,
      },
      {
        name: 'Pasta Alfredo',
        description: 'Creamy pasta with white sauce and parmesan cheese',
        price: 220,
        category: 'Pasta',
        preparationTime: 18,
        image: '',
        restaurant: restaurant1._id,
        createdBy: admin._id,
      },
      {
        name: 'Cold Coffee',
        description: 'Refreshing cold coffee with ice cream',
        price: 100,
        category: 'Drinks',
        preparationTime: 5,
        image: '',
        restaurant: restaurant1._id,
        createdBy: admin._id,
      },
    ];

    await MenuItem.insertMany(menuItems1);
    console.log('Menu items created for Tasty Bites');

    // Create menu items for restaurant 2
    console.log('Creating menu items for Spice Garden...');
    const menuItems2 = [
      {
        name: 'Butter Chicken',
        description: 'Classic butter chicken with rich tomato gravy',
        price: 280,
        category: 'Main Course',
        preparationTime: 25,
        image: '',
        restaurant: restaurant2._id,
        createdBy: admin._id,
      },
      {
        name: 'Veg Biryani',
        description: 'Aromatic vegetable biryani with raita',
        price: 200,
        category: 'Main Course',
        preparationTime: 20,
        image: '',
        restaurant: restaurant2._id,
        createdBy: admin._id,
      },
      {
        name: 'Paneer Tikka',
        description: 'Grilled paneer marinated in aromatic spices',
        price: 200,
        category: 'Starters',
        preparationTime: 15,
        image: '',
        restaurant: restaurant2._id,
        createdBy: admin._id,
      },
      {
        name: 'Mango Lassi',
        description: 'Refreshing mango lassi',
        price: 80,
        category: 'Drinks',
        preparationTime: 3,
        image: '',
        restaurant: restaurant2._id,
        createdBy: admin._id,
      },
    ];

    await MenuItem.insertMany(menuItems2);
    console.log('Menu items created for Spice Garden');

    // Create a customer user
    console.log('Creating customer user...');
    const customer = await User.create({
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '555-9999',
      password: 'Customer@12345',
      role: 'customer',
    });
    console.log('Customer user created: customer@example.com / Customer@12345');

    console.log('\n=== SEEDING COMPLETE ===');
    console.log('\nTest Accounts:');
    console.log('================');
    console.log('Admin: admin@example.com / Admin@12345');
    console.log('Manager 1 (Tasty Bites): manager1@example.com / Manager@12345');
    console.log('Manager 2 (Spice Garden): manager2@example.com / Manager@12345');
    console.log('Customer: customer@example.com / Customer@12345');
    console.log('\nRestaurants:');
    console.log('1. Tasty Bites (Italian, Chinese, Indian)');
    console.log('2. Spice Garden (Indian, Thai, Mexican)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

seedFullSystem();