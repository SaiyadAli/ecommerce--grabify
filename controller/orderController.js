const Order = require('../model/orderModel');
const User = require('../model/userModel');
const Product = require('../model/productModel');
const Wallet = require('../model/walletModel'); // Import the Wallet model

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
        // if (!address) {
        //     return res.status(404).json({ message: 'Address not found' });
        // }

        res.render('admin/orderStatus', {
            order,
            address
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('Server error');
    }
};

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('cartData.variantId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.orderStatus === 'Cancelled') {
            return res.status(400).send('Order is already cancelled');
        }

        // Update stock
        for (const item of order.cartData) {
            const variant = item.variantId;
            variant.stock += item.quantity;
            await variant.save();
        }

        // Update order status
        order.orderStatus = 'Cancelled';
        await order.save();

        // If payment status is 'Paid', add the money back to the user's wallet
        if (order.paymentStatus === 'Paid') {
            const wallet = await Wallet.findOne({ userId: order.userId });
            if (wallet) {
                wallet.walletBalance += order.grandTotalCost;
                wallet.walletTransaction.push({
                    transactionDate: new Date(),
                    transactionAmount: order.grandTotalCost,
                    transactionType: 'Refund'
                });
                await wallet.save();
                console.log('Money added to wallet:', wallet);
            } else {
                const newWallet = new Wallet({
                    userId: order.userId,
                    walletBalance: order.grandTotalCost,
                    walletTransaction: [{
                        transactionDate: new Date(),
                        transactionAmount: order.grandTotalCost,
                        transactionType: 'Refund'
                    }]
                });
                await newWallet.save();
                console.log('New wallet created and money added:', newWallet);
            }
        }

        res.redirect(`/admin/orders/${orderId}/status`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

const shipOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { deliveryDate } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.orderStatus === 'Cancelled') {
            return res.status(400).send('Cannot ship a cancelled order');
        }

        // Update order status and delivery date
        order.orderStatus = 'Shipped';
        order.deliveryDate = new Date(deliveryDate);
        await order.save();

        res.redirect(`/admin/orders/${orderId}/status`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

const deliverOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log(`Delivering order with ID: ${orderId}`);
        
        const order = await Order.findById(orderId);
        if (!order) {
            console.log('Order not found');
            return res.status(404).send('Order not found');
        }

        if (order.orderStatus !== 'Shipped') {
            console.log('Order is not in Shipped status');
            return res.status(400).send('Only shipped orders can be marked as delivered');
        }

        // Update order status
        order.orderStatus = 'Delivered';
        await order.save();
        console.log('Order status updated to Delivered');

        res.redirect(`/admin/orders/${orderId}/status`);
    } catch (error) {
        console.error('Error delivering order:', error);
        res.status(500).send('Server error');
    }
};

module.exports = {
    listOrders,
    viewOrderStatus,
    cancelOrder,
    shipOrder,
    deliverOrder,
};
