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



module.exports = {
    listOrders,
   
};
