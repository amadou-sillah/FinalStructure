const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { items, restaurant, deliveryAddress, paymentMethod } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Order must contain at least one item"
      });
    }
    
    // Process items
    const processedItems = [];
    let totalPrice = 0;
    
    for (const item of items) {
      let menuItemDetails = null;
      
      // Fetch menu item details if ID provided
      if (item.menuItem) {
        menuItemDetails = await MenuItem.findById(item.menuItem);
        if (!menuItemDetails) {
          return res.status(404).json({
            success: false,
            error: `Menu item not found: ${item.menuItem}`
          });
        }
      }
      
      const name = menuItemDetails ? menuItemDetails.name : (item.name || 'Unknown Item');
      const price = menuItemDetails ? menuItemDetails.price : (item.price || 0);
      const quantity = item.quantity || 1;
      
      if (price < 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid price for item: ${name}`
        });
      }
      
      processedItems.push({
        menuItem: menuItemDetails ? menuItemDetails._id : null,
        name,
        price,
        quantity
      });
      
      totalPrice += price * quantity;
    }
    
    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: processedItems,
      totalPrice,
      restaurant: restaurant || null,
      deliveryAddress: deliveryAddress || '',
      paymentMethod: paymentMethod || 'cash',
      status: 'pending'
    });
    
    // Populate references
    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name location')
      .populate('items.menuItem', 'name price image');
    
    res.status(201).json({
      success: true,
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    
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

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name location')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};