const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    orderNumber: { type: Number, required: true, unique: true },
    orderDate: { type: Date, required: true, default: Date.now },
    paymentType: { type: String, required: true },
    orderStatus: { type: String, default: 'Processing' },
    paymentStatus: { type: String, default: 'Pending' },
    razorpayOrderId: { type: String },
    addressChosen: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    cartData: [{
        productName: { type: String, required: true },
        variantColor: { type: String, required: true },
        quantity: { type: Number, required: true },
        size: { type: String, required: true },
        price: { type: Number, required: true },
        variantId: { type: mongoose.Types.ObjectId, required: true, ref: 'Variant' },
        variantImage: { type: String, required: true } // Add the variantImage field
    }],
    grandTotalCost: { type: Number, required: true },
    paymentId: { type: String },
    deliveryDate: { type: Date, default: null },
    couponDeduction: { type: Number, default: 0 },
    walletDeduction: { type: Number, default: 0 },
    nonOfferPrice: { type: Number, required: true }
});

orderSchema.virtual('address', {
    ref: 'User',
    localField: 'addressChosen',
    foreignField: 'addresses._id',
    justOne: true
});

const orderCollection = mongoose.model('Order', orderSchema);

module.exports = orderCollection;