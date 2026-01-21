const express = require('express');
const mongoose = require('mongoose');
const {
  createMenuItem,
  getMenuItemsByRestaurant,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * CREATE menu item (admin)
 */
router.post('/', protect, admin, createMenuItem);

/**
 * GET menu items for a restaurant
 */
router.get('/restaurant/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({ success: false, error: 'Invalid restaurant ID' });
  }

  return getMenuItemsByRestaurant(req, res);
});

/**
 * DELETE menu item (admin)
 */
router.delete('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid menu ID' });
  }

  return deleteMenuItem(req, res);
});

module.exports = router;


