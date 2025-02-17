const Coupon = require('../model/couponModel');
const StatusCodes = require('../statusCodes');

const listCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('admin/coupon', { coupons });
    } catch (error) {
        console.error('Error listing coupons:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Error listing coupons');
    }
};

const createCoupon = async (req, res) => {
    try {
        const { couponCode, discountPercentage, startDate, expiryDate, minimumPurchase, maximumDiscount } = req.body;
        const newCoupon = new Coupon({ couponCode, discountPercentage, startDate, expiryDate, minimumPurchase, maximumDiscount });
        await newCoupon.save();
        res.status(StatusCodes.SUCCESS).json({ message: 'Coupon created successfully.' });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error creating coupon' });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const { couponCode, discountPercentage, startDate, expiryDate, minimumPurchase, maximumDiscount } = req.body;
        await Coupon.findByIdAndUpdate(req.params.id, { couponCode, discountPercentage, startDate, expiryDate, minimumPurchase, maximumDiscount });
        res.status(StatusCodes.SUCCESS).json({ message: 'Coupon updated successfully.' });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error updating coupon' });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.status(StatusCodes.SUCCESS).json({ message: 'Coupon deleted successfully.' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error deleting coupon' });
    }
};

module.exports = {
    listCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon
};
