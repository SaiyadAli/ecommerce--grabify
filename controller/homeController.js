const CategoryModel = require('../model/categoryModel');
const ProductModel = require('../model/productModel');

exports.getHomePage = async (req, res) => {
    try {
        const categories = await CategoryModel.find({ isListed: true });
        const products = await ProductModel.find({ isListed: true }).populate('categoryid');
        const username = req.session.user ? req.session.user.username : null; // Get username from session
        res.render('user/home', { categories, products, username }); // Pass username to the view
    } catch (error) {
        res.status(500).send('Server Error');
    }
};