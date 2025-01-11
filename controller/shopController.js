const Product = require('../model/productModel');
const Variant = require('../model/variantModel');
const Category = require('../model/categoryModel');

exports.getShopPage = async (req, res) => {
    try {
        const categories = await Category.find();
        const searchQuery = req.query.search || '';
        const categoryFilter = req.query.category ? req.query.category.split(',') : [];
        const sortBy = req.query.sortBy || '';
        const colorFilter = req.query.color ? req.query.color.split(',') : [];
        
        let query = {};
        if (searchQuery) {
            query = { 'productId.name': { $regex: searchQuery, $options: 'i' } };
        }
        if (categoryFilter.length > 0) {
            query['productId.categoryid'] = { $in: categoryFilter };
        }
        if (colorFilter.length > 0) {
            query.color = { $in: colorFilter };
        }

        let variants = await Variant.find(query).populate('productId');

        if (sortBy) {
            if (sortBy === 'priceAsc') {
                variants = variants.sort((a, b) => a.price - b.price);
            } else if (sortBy === 'priceDesc') {
                variants = variants.sort((a, b) => b.price - a.price);
            }
        }

        const colors = [...new Set(variants.map(variant => variant.color))];

        const username = req.user ? req.user.username : null; // Assuming you have user information in req.user

        res.render('user/shop', {
            categories: categories,
            variants: variants,
            colors: colors,
            username: username,
            user: req.user
        });
    } catch (err) {
        console.error('Error fetching shop page:', err);
        res.status(500).send('Server Error');
    }
};
