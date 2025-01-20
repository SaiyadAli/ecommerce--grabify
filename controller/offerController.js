const ProductOffer = require('../model/productOfferModel');
const Product = require('../model/productModel');
const CategoryOffer = require('../model/categoryOfferModel');
const Category = require('../model/categoryModel'); // Ensure this is the correct path to your Category model

const getOffers = async (req, res) => {
    try {
        const offers = await ProductOffer.find().populate('productId');
        const products = await Product.find();
        res.render('admin/offer', { offers, products });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const createOffer = async (req, res) => {
    try {
        const { productId, productOfferPercentage, startDate, endDate, currentStatus } = req.body;
        const existingOffer = await ProductOffer.findOne({ productId });
        if (existingOffer) {
            return res.status(400).json({ message: 'An offer for this product already exists.' });
        }
        const product = await Product.findById(productId);
        const newOffer = new ProductOffer({
            productId,
            productName: product.name,
            productOfferPercentage,
            startDate,
            endDate,
            currentStatus
        });
        await newOffer.save();
        res.json({ message: 'Offer created successfully.' });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ message: 'Error creating coupon' });
    }
};

const editOffer = async (req, res) => {
    try {
        const offer = await ProductOffer.findById(req.params.id).populate('productId');
        const products = await Product.find();
        res.render('admin/editOffer', { offer, products });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateOffer = async (req, res) => {
    try {
        const { productId, productOfferPercentage, startDate, endDate, currentStatus } = req.body;
        const product = await Product.findById(productId);
        await ProductOffer.findByIdAndUpdate(req.params.id, {
            productId,
            productName: product.name,
            productOfferPercentage,
            startDate,
            endDate,
            currentStatus
        });
        res.json({ message: 'Offer updated successfully.' });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ message: 'Error updating offer' });
    }
};

const deleteOffer = async (req, res) => {
    try {
        await ProductOffer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted successfully.' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ message: 'Error deleting offer' });
    }
};

const getCategoryOffers = async (req, res) => {
    try {
        const offers = await CategoryOffer.find().populate('categoryId');
        const categories = await Category.find();
        res.render('admin/categoryOffer', { offers, categories });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const createCategoryOffer = async (req, res) => {
    try {
        const { categoryId, categoryOfferPercentage, startDate, endDate, currentStatus } = req.body;
        const existingOffer = await CategoryOffer.findOne({ categoryId });
        if (existingOffer) {
            return res.status(400).json({ message: 'An offer for this category already exists.' });
        }
        const category = await Category.findById(categoryId);
        const newOffer = new CategoryOffer({
            categoryId,
            categoryName: category.categoryName,
            categoryOfferPercentage,
            startDate,
            endDate,
            currentStatus
        });
        await newOffer.save();
        res.json({ message: 'Category offer created successfully.' });
    } catch (error) {
        console.error('Error creating category offer:', error);
        res.status(500).json({ message: 'Error creating category offer' });
    }
};

const editCategoryOffer = async (req, res) => {
    try {
        const offer = await CategoryOffer.findById(req.params.id).populate('categoryId');
        const categories = await Category.find();
        res.render('admin/editCategoryOffer', { offer, categories });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateCategoryOffer = async (req, res) => {
    try {
        const { categoryId, categoryOfferPercentage, startDate, endDate, currentStatus } = req.body;
        const category = await Category.findById(categoryId);
        await CategoryOffer.findByIdAndUpdate(req.params.id, {
            categoryId,
            categoryName: category.categoryName,
            categoryOfferPercentage,
            startDate,
            endDate,
            currentStatus
        });
        res.json({ message: 'Category offer updated successfully.' });
    } catch (error) {
        console.error('Error updating category offer:', error);
        res.status(500).json({ message: 'Error updating category offer' });
    }
};

const deleteCategoryOffer = async (req, res) => {
    try {
        await CategoryOffer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category offer deleted successfully.' });
    } catch (error) {
        console.error('Error deleting category offer:', error);
        res.status(500).json({ message: 'Error deleting category offer' });
    }
};

module.exports = {
    deleteOffer,
    editOffer,
    getOffers,
    createOffer,
    updateOffer,
    getCategoryOffers,
    createCategoryOffer,
    editCategoryOffer,
    updateCategoryOffer,
    deleteCategoryOffer
};