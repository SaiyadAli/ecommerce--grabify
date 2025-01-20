const mongoose= require('mongoose')

const categorySchema= new mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    categoryDescription:{
        type: String,
        required: true
    },
    isListed: {
        type: Boolean,
        default: true
    },
    categoryOfferId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryOffer'
    }
})

const categoryCollection= mongoose.model('categories',categorySchema)

module.exports= categoryCollection