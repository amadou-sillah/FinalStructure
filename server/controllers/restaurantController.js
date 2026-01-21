const Restaurant = require("../models/Restaurant");

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private/Admin
exports.createRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      restaurant
    });
  } catch (error) {
    console.error('Create restaurant error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: restaurants.length,
      restaurants
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: "Restaurant not found"
      });
    }

    res.json({
      success: true,
      restaurant
    });
  } catch (error) {
    console.error('Get restaurant error:', error);

    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: "Restaurant not found"
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private/Admin
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: "Restaurant not found"
      });
    }

    await restaurant.deleteOne();

    res.json({
      success: true,
      message: "Restaurant deleted successfully"
    });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};
