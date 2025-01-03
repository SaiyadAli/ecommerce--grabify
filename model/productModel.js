const mongoose = require('mongoose');

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  categoryid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories', // Reference to Category model
    required: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isListed: {
    type: Boolean,
    default: true,
  },

});

// Export the model
const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;