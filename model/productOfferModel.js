const mongoose = require('mongoose');
const Product = require('./productModel'); // Ensure the product model is registered

const productOfferSchema = new mongoose.Schema({
    productId: { type: mongoose.Types.ObjectId, required: true, ref: 'Product' },
    productName: { type: String, required: true },
    productOfferPercentage: { type: Number, min: 5, max: 90, required: true },
    startDate: { type: Date, required: true, default: new Date().toLocaleString() },
    endDate: { type: Date, required: true },
    currentStatus: { type: Boolean, required: false, default: true }
}, { timestamps: true });

const productOfferCollection = mongoose.model('productOffers', productOfferSchema, 'productOffers');

module.exports = productOfferCollection;
