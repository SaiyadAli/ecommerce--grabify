const Category = require('../model/categoryModel');
const Variant = require('../model/variantModel');
const Product = require('../model/productModel');

exports.getCategoryProducts = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const sortBy = req.query.sortBy || 'price'; // Default sorting by price
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1; // Default sorting order is ascending

        const category = await Category.findById(categoryId);
        const products = await Product.find({ categoryid: categoryId, isListed: true });
        const productIds = products.map(product => product._id);

        let sortCriteria = {};
        if (sortBy === 'price') {
            sortCriteria.price = sortOrder;
        } else if (sortBy === 'color') {
            sortCriteria.color = sortOrder;
        }

        const variants = await Variant.find({ productId: { $in: productIds }, isListed: true }).sort(sortCriteria);
        const categories = await Category.find({ isListed: true });
        const colors = await Variant.distinct('color', { productId: { $in: productIds }, isListed: true });

        res.render('user/userCategory', {
            category,
            variants,
            categories,
            colors,
            username: req.session.user ? req.session.user.username : null, // Pass username to the view
            sortBy,
            sortOrder
        });
    } catch (error) {
        console.error('Error fetching category products:', error);
        res.status(500).send('Server Error');
    }
};

