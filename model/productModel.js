const mongoose = require('mongoose');

// Variant Schema
const VariantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true,
  },
  image: {
    type: String,
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
});

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
  },isListed: {
    type: Boolean,
    default: true
},
  variantid: [VariantSchema], // Array of VariantSchema
});

// Export the model

const productCollection= mongoose.model('Product', ProductSchema);

module.exports= productCollection
