const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

/**
 * CREATE MENU ITEM
 */
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, image, restaurant } = req.body;

    if (!name || price === undefined || !restaurant) {
      return res.status(400).json({
        success: false,
        error: 'Name, price, and restaurant are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(restaurant)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid restaurant ID'
      });
    }

    const restaurantExists = await Restaurant.findById(restaurant);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      image,
      restaurant
    });

    res.status(201).json({
      success: true,
      menuItem
    });

  } catch (err) {
    console.error('Create menu error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * GET MENU ITEMS BY RESTAURANT
 */
exports.getMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const items = await MenuItem.find({ restaurant: restaurantId });

    res.json({
      success: true,
      count: items.length,
      items
    });

  } catch (err) {
    console.error('Get menu error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * DELETE MENU ITEM
 */
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid menu item ID'
      });
    }

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    await menuItem.deleteOne();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (err) {
    console.error('Delete menu error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
