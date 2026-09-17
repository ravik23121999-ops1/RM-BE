const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
const getAllRestaurants = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } },
      ];
    }

    const restaurants = await Restaurant.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Restaurant.countDocuments(query);

    res.status(200).json({
      success: true,
      data: restaurants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new restaurant
// @route   POST /api/restaurants
// @access  Private/Admin
const createRestaurant = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      phone,
      email,
      image,
      cuisine,
      openingHours,
    } = req.body;

    const restaurant = await Restaurant.create({
      name,
      description,
      address,
      phone,
      email,
      image: image || '',
      cuisine: cuisine || [],
      openingHours: openingHours || '9:00 AM - 10:00 PM',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private/Admin
const updateRestaurant = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      phone,
      email,
      image,
      cuisine,
      openingHours,
      rating,
      isActive,
    } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (name) restaurant.name = name;
    if (description) restaurant.description = description;
    if (address) restaurant.address = address;
    if (phone) restaurant.phone = phone;
    if (email) restaurant.email = email;
    if (image !== undefined) restaurant.image = image;
    if (cuisine !== undefined) restaurant.cuisine = cuisine;
    if (openingHours !== undefined) restaurant.openingHours = openingHours;
    if (rating !== undefined) restaurant.rating = rating;
    if (isActive !== undefined) restaurant.isActive = isActive;

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle restaurant status
// @route   PATCH /api/restaurants/:id/status
// @access  Private/Admin
const toggleRestaurantStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: `Restaurant ${restaurant.isActive ? 'activated' : 'deactivated'} successfully`,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private/Admin
const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    await Restaurant.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign manager to restaurant
// @route   PATCH /api/restaurants/:id/assign-manager
// @access  Private/Admin
const assignManager = async (req, res, next) => {
  try {
    const { managerId } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found',
      });
    }

    if (manager.role !== 'receptionist') {
      return res.status(400).json({
        success: false,
        message: 'User must be a receptionist to be assigned as manager',
      });
    }

    manager.restaurant = restaurant._id;
    await manager.save();

    res.status(200).json({
      success: true,
      message: 'Manager assigned to restaurant successfully',
      data: manager.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantStatus,
  deleteRestaurant,
  assignManager,
};