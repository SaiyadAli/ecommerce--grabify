const mongoose = require('mongoose');
const Product = require('../model/productModel');
const Variant = require('../model/variantModel');
const Category = require('../model/categoryModel');
const CategoryOffer = require('../model/categoryOfferModel'); // Add this line
const ProductOffer = require('../model/productOfferModel'); // Add this line
const StatusCodes = require('../statusCodes');

const displayProduct = async (req, res) => {
    try {
        const variantId = req.params.id;
        console.log('variantId:', variantId); // Log the variantId for debugging
        if (!variantId) {
            return res.status(StatusCodes.BAD_REQUEST).send('Variant ID is required');
        }

        const variant = await Variant.findById(variantId).populate('productId');
        if (!variant) {
            return res.status(StatusCodes.NOT_FOUND).send('Variant not found');
        }

        const product = await Product.findById(variant.productId._id).populate('categoryid');
        if (!product) {
            return res.status(StatusCodes.NOT_FOUND).send('Product not found');
        }

        const category = await Category.findById(product.categoryid);
        const variants = await Variant.find({ productId: variant.productId._id });

        const categoryOffer = await CategoryOffer.findOne({ categoryId: product.categoryid._id, currentStatus: true }).exec();
        const productOffer = await ProductOffer.findOne({ productId: product._id, currentStatus: true }).exec();

        let finalPrice = variant.price;
        if (productOffer) {
            finalPrice = finalPrice - (finalPrice * (productOffer.productOfferPercentage / 100));
        } else if (categoryOffer) {
            finalPrice = finalPrice - (finalPrice * (categoryOffer.categoryOfferPercentage / 100));
        }

        variant.effectivePrice = finalPrice;
        await variant.save();

        const username = req.user ? req.user.username : null; // Assuming you have user information in req.user

        res.render('user/userproduct', { product, variants, category, variant, finalPrice, username, user: req.user });
    } catch (error) {
        console.error('Error displaying product:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Server Error');
    }
};

// Function to get product details including offers
async function getProductDetails(req, res) {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('categoryid').exec();
        const categoryOffer = await CategoryOffer.findOne({ categoryId: product.categoryid._id, currentStatus: true }).exec();
        const productOffer = await ProductOffer.findOne({ productId: product._id, currentStatus: true }).exec();

        let finalPrice = product.price;
        if (productOffer) {
            finalPrice = finalPrice - (finalPrice * (productOffer.productOfferPercentage / 100));
        } 
         if (categoryOffer) {
            finalPrice = finalPrice - (finalPrice * (categoryOffer.categoryOfferPercentage / 100));
        }

        res.render('user/userproduct', {
            product,
            finalPrice,
            category: product.categoryid,
            variant: product, // Assuming variant is the same as product for simplicity
            variants: [product] // Assuming a single variant for simplicity
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
}

module.exports = {
    displayProduct,
    getProductDetails
};
