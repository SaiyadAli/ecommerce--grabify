const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Variant = require('../model/variantModel'); // Import the Variant model

const loadHomePage = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryid');
        const variants = await Variant.find().populate('productId'); // Populate productId
        const categories = await Category.find();
        const username = req.session.username || null; // Assuming you store the username in the session
        res.render('user/home', { products, categories, variants, username });
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    loadHomePage,
};