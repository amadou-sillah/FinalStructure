const express = require('express');
const {
  createRestaurant,
  getRestaurants,
  getRestaurant,
  deleteRestaurant
} = require('../controllers/restaurantController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getRestaurants);
router.get('/:id', getRestaurant);

// Admin routes
router.post('/', protect, admin, createRestaurant);
router.delete('/:id', protect, admin, deleteRestaurant);

module.exports = router;

