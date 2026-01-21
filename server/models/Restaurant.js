const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  description: { 
    type: String,
    default: ''
  },
  location: { 
    type: String,
    default: ''
  },
  image: { 
    type: String,
    default: 'default-restaurant.jpg'
  },
  rating: { 
    type: Number, 
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  deliveryTime: { 
    type: Number, 
    default: 30,
    min: [0, 'Delivery time cannot be negative']
  }
}, { 
  timestamps: true 
});

// Index for faster searches
restaurantSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);