const Order = require('../model/orderModel');

// List all orders
const listOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('userId').populate('cartData.variantId');
        res.render('admin/order', { orders });
    } catch (error) {
        res.status(500).send('Error listing orders: ' + error.message);
    }
};

const viewOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('userId');
        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('admin/orderStatus', { order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('Server error');
    }
};

module.exports = {
    listOrders,
    viewOrderStatus,
};
