const ProductOffer = require('../model/productOfferModel');
const Product = require('../model/productModel');

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
            return res.status(400).send('An offer already exists for this product.');
        }
        const newOffer = new ProductOffer({
            productId,
            productOfferPercentage,
            startDate,
            endDate,
            currentStatus
        });
        await newOffer.save();
        res.redirect('/admin/offers');
    } catch (error) {
        res.status(500).send(error.message);
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
        const existingOffer = await ProductOffer.findOne({ productId, _id: { $ne: req.params.id } });
        if (existingOffer) {
            return res.status(400).send('An offer already exists for this product.');
        }
        await ProductOffer.findByIdAndUpdate(req.params.id, {
            productId,
            productOfferPercentage,
            startDate,
            endDate,
            currentStatus
        });
        res.redirect('/admin/offers');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const deleteOffer = async (req, res) => {
    try {
        await ProductOffer.findByIdAndDelete(req.params.id);
        res.redirect('/admin/offers');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { deleteOffer, editOffer, getOffers, createOffer, updateOffer };
