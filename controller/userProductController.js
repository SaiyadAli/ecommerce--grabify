const Product = require('../model/productModel');
const Variant = require('../model/variantModel');
const Category = require('../model/categoryModel');

const displayProduct = async (req, res) => {
    try {
        const variantId = req.params.id;
        console.log('variantId:', variantId); // Log the variantId for debugging
        if (!variantId) {
            return res.status(400).send('Variant ID is required');
        }

        const variant = await Variant.findById(variantId).populate('productId');
        if (!variant) {
            return res.status(404).send('Variant not found');
        }

        const product = await Product.findById(variant.productId._id).populate('categoryid');
        if (!product) {
            return res.status(404).send('Product not found');
        }

        const category = await Category.findById(product.categoryid);
        const variants = await Variant.find({ productId: variant.productId._id });

        const username = req.user ? req.user.username : null; // Assuming you have user information in req.user

        res.render('user/userproduct', { product, variants, category, variant, username, user: req.user });
    } catch (error) {
        console.error('Error displaying product:', error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    displayProduct,
};
