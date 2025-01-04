const Order = require('../model/orderModel');
const User = require('../model/userModel');

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
        const { id } = req.params;

        const order = await Order.findById(id).populate('cartData.variantId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(order.addressChosen);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.render('admin/orderStatus', {
            order,
            address
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('Server error');
    }
};

module.exports = {
    listOrders,
    viewOrderStatus,
};
