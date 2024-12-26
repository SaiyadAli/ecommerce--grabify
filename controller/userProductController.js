const Product = require('../model/productModel');
const Variant = require('../model/variantModel');
const Category = require('../model/categoryModel'); 

const displayProduct = async (req, res) => {
    try {
        const variantId = req.params.id;
        const variant = await Variant.findById(variantId).populate('productId');
        const product = await Product.findById(variant.productId._id).populate('categoryid');
        const category = await Category.findById(product.categoryid); 
        const variants = await Variant.find({ productId: variant.productId._id });

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('user/userproduct', { product, variants, category, variant });
    } catch (error) {
        console.error('Error displaying product:', error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    displayProduct,
};
