const mongoose = require('mongoose');

// Variant Schema
const VariantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true,
  },
  images: {
    type: [String], // Array of strings to store multiple image paths
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  size: {
    type: Map,
    of: Number, // A map where key is size and value is stock count
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Reference to Product model
    required: true,
  },
  isListed: {
    type: Boolean,
    default: true
  }
});

// Export the model
const Variant = mongoose.model('Variant', VariantSchema);

module.exports = Variant;