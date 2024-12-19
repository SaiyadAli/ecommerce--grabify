const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true },
  email: { type: String, required: true },
  number: { type: Number, required: true }, // Phone number
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String },
  isBlock: { type: Boolean, default: false },
  addresses: [addressSchema], // Embedding the Address schema as an array
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
