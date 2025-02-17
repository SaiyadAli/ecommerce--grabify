const Wishlist = require('../model/wishlistModel');
const StatusCodes = require('../statusCodes');

const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ userId: req.user._id }).populate('productId variantId');
        res.render('user/wishlist', { wishlist, username: req.user.username });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
};

const addToWishlist = async (req, res) => {
    try {
        const { productId, variantId } = req.body;
        const userId = req.user._id;

        // Check for duplicates
        const existingItem = await Wishlist.findOne({ userId, productId, variantId });
        if (existingItem) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Product already in wishlist' });
        }

        const newWishlistItem = new Wishlist({ userId, productId, variantId });
        await newWishlistItem.save();

        res.status(StatusCodes.SUCCESS).json({ message: 'Product added to wishlist successfully' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
};

const deleteFromWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Received DELETE request for wishlist item:', id); // Debugging line
        await Wishlist.findByIdAndDelete(id);
        console.log('Wishlist item deleted successfully'); // Debugging line
        res.status(StatusCodes.SUCCESS).json({ message: 'Product removed from wishlist successfully' });
    } catch (error) {
        console.log('Error deleting wishlist item:', error); // Debugging line
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
};

module.exports = { getWishlist, addToWishlist, deleteFromWishlist };