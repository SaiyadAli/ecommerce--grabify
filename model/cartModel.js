const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'Variant',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    size: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);
