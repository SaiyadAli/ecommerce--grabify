const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        required: true
    },
    categoryName: {
        type: String,
        required: true
    },
    categoryOfferPercentage: {
        type: Number,
        required: true,
        min: 5,
        max: 90
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    currentStatus: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('CategoryOffer', categoryOfferSchema);
