const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    orderNumber: { type: Number, required: true },
    orderDate: { type: Date, required: true, default: Date.now },
    paymentType: { type: String, default: 'toBeChosen' },
    orderStatus: { type: String, default: 'Pending' },
    addressChosen: { type: mongoose.Types.ObjectId, required: true },
    cartData: [{
        productName: { type: String, required: true },
        variantColor: { type: String, required: true },
        quantity: { type: Number, required: true },
        size: { type: String, required: true },
        price: { type: Number, required: true },
        variantId: { type: mongoose.Types.ObjectId, required: true, ref: 'Variant' }
    }],
    grandTotalCost: { type: Number },
    paymentId: { type: String },
    deliveryDate: { type: Date, default: null }
});

orderSchema.virtual('address', {
    ref: 'User',
    localField: 'addressChosen',
    foreignField: 'addresses._id',
    justOne: true
});

const orderCollection = mongoose.model('Order', orderSchema);

module.exports = orderCollection;