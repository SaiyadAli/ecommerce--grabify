const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Variant = require('../model/variantModel'); // Import the Variant model

const loadHomePage = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });
        const products = await Product.find({ isListed: true }).populate({
            path: 'categoryid',
            match: { isListed: true }
        });
        const variants = await Variant.find({ isListed: true }).populate({
            path: 'productId',
            match: { isListed: true },
            populate: {
                path: 'categoryid',
                model: 'categories', // Ensure this matches the registered model name
                match: { isListed: true }
            }
        }); // Populate productId and categoryid
        
        const filteredVariants = variants.filter(variant => variant.productId && variant.productId.isListed && variant.productId.categoryid && variant.productId.categoryid.isListed);
        
        const username = req.session.username || null; // Assuming you store the username in the session
        res.render('user/home', { products, categories, variants: filteredVariants, username });
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    loadHomePage,
};