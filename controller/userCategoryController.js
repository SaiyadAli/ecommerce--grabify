const Category = require('../model/categoryModel');
const Variant = require('../model/variantModel');
const Product = require('../model/productModel');

const getCategoryProducts = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        const category = await Category.findById(categoryId);
        const products = await Product.find({ categoryid: categoryId, isListed: true });
        const productIds = products.map(product => product._id);

        const variants = await Variant.find({ productId: { $in: productIds }, isListed: true })
            .populate('productId'); // Populate productId to access product details

        const categories = await Category.find({ isListed: true });
        const colors = await Variant.distinct('color', { productId: { $in: productIds }, isListed: true });

        res.render('user/userCategory', {
            category,
            variants,
            categories,
            colors,
            username: req.session.user ? req.session.user.username : null // Pass username to the view
        });
    } catch (error) {
        console.error('Error fetching category products:', error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getCategoryProducts
};