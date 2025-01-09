const mongoose = require('mongoose');
const Cart = require('../model/cartModel');
const Product = require('../model/productModel');
const Variant = require('../model/variantModel'); // Import the Variant model
const User = require('../model/userModel'); // Import the User model
const Order = require('../model/orderModel'); // Import the Order model

const addToCart = async (req, res) => {
    try {
        const { userId, productId, variantId, quantity, size } = req.body;
        console.log('Received data:', { userId, productId, variantId, quantity, size }); // Debugging line

        // Validate received data
        if (!userId || !productId || !variantId || !quantity || !size) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if the variant exists and has sufficient stock
        const variant = await Variant.findById(variantId);
        if (!variant) {
            return res.status(404).json({ error: 'Variant not found' });
        }
        
        // Check if the cart item already exists for the user
        const existingCartItem = await Cart.findOne({ userId, productId, variantId, size });
        if (existingCartItem) {
            console.log('Duplicate cart item found:', existingCartItem); // Debugging line
            return res.status(400).json({ error: 'This product is already in your cart.' });
        }

        
        const availableStock = variant.size.get(size);
        console.log('Available stock:', availableStock); // Debugging line
        console.log('Requested quantity:', quantity); // Debugging line
        if (availableStock < quantity) {
            return res.status(400).json({ error: 'Insufficient quantity available' });
        }

        

        // Create a new cart item if it doesn't exist
        const newCartItem = new Cart({ userId, productId, variantId, quantity, size });
        await newCartItem.save();
        console.log('Added new cart item:', newCartItem); // Debugging line
        res.status(200).json({ message: 'Product added to cart successfully!' });
    } catch (error) {
        console.error('Error adding product to cart:', error); // Debugging line
        res.status(500).json({ message: 'Error adding product to cart', error });
    }
};

const viewCart = async (req, res) => {
    if (req.user) {
        try {
            const cartItems = await Cart.find({ userId: req.user._id }).populate('productId variantId');
            res.render('user/cart', {
                username: req.user.username,
                cartItems
            });
        } catch (error) {
            console.error('Error fetching cart items:', error);
            res.status(500).json({ message: 'Error fetching cart items', error });
        }
    } else {
        res.redirect('/user/login');
    }
};

const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        await Cart.findByIdAndDelete(itemId);
        res.redirect('/user/cart');
    } catch (error) {
        console.error('Error deleting cart item:', error);
        res.status(500).json({ message: 'Error deleting cart item', error });
    }
};

const updateCartQuantity = async (req, res) => {
    const { quantity, size } = req.body;
    const { id } = req.params;

    try {
        const cartItem = await Cart.findById(id).populate('variantId');
        const variant = await Variant.findById(cartItem.variantId._id);

        if (variant.size.get(size) < quantity) {
            return res.status(400).json({ message: 'Insufficient quantity available' });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        const cartItems = await Cart.find({ userId: req.user._id }).populate('variantId');
        const total = cartItems.reduce((sum, item) => sum + item.variantId.price * item.quantity, 0);
        const totalItem = cartItem.variantId.price * cartItem.quantity;

        res.status(200).json({ message: 'Cart updated successfully', total, totalItem });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const checkout = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('addresses');
        const cartItems = await Cart.find({ userId: req.user._id }).populate('productId variantId');
        const grandTotal = cartItems.reduce((sum, item) => sum + item.variantId.price * item.quantity, 0);

        res.render('user/checkout', {
            username: req.user.username,
            addressData: user.addresses,
            cartItems,
            grandTotal
        });
    } catch (error) {
        console.error('Error fetching user addresses or cart items:', error);
        res.status(500).json({ message: 'Error fetching user addresses or cart items', error });
    }
};

const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chosenAddress, paymentType } = req.body;

        const cartItems = await Cart.find({ userId }).populate('productId variantId');
        const grandTotal = cartItems.reduce((sum, item) => sum + item.variantId.price * item.quantity, 0);

        const orderData = cartItems.map(item => ({
            productName: item.productId.name,
            variantColor: item.variantId.color,
            quantity: item.quantity,
            size: item.size,
            price: item.variantId.price,
            variantId: item.variantId._id
        }));

        // Subtract stock count for each item
        for (const item of cartItems) {
            const variant = item.variantId;
            if (variant.size.has(item.size)) {
                const currentStock = variant.size.get(item.size);
                if (currentStock >= item.quantity) {
                    variant.size.set(item.size, currentStock - item.quantity);
                    await variant.save();
                } else {
                    return res.status(400).json({ success: false, message: `Insufficient stock for ${item.productId.name} (${item.variantId.color})` });
                }
            } else {
                return res.status(400).json({ success: false, message: `Size ${item.size} not available for ${item.productId.name} (${item.variantId.color})` });
            }
        }

        const newOrder = new Order({
            userId,
            orderNumber: Date.now(), // Use current timestamp as order number
            paymentType,
            addressChosen: chosenAddress,
            cartData: orderData,
            grandTotalCost: grandTotal
        });

        await newOrder.save();
        await Cart.deleteMany({ userId }); // Clear the cart after order is placed

        res.json({ success: true, message: 'Order created successfully!' });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Error creating order', error });
    }
};

const viewOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).populate({
            path: 'addressChosen',
            model: 'User',
            select: 'addresses',
            populate: {
                path: 'addresses',
                model: 'User',
                match: { _id: req.user._id }
            }
        });
        res.render('user/order', {
            username: req.user.username,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

const viewOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate('cartData.variantId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let address = null;
        if (order.addressChosen) {
            address = user.addresses.id(order.addressChosen) || null;
        }

        res.render('user/orderStatus', {
            username: req.user.username,
            order,
            address
        });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).json({ message: 'Error fetching order status', error });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        console.log(`Fetching order with ID: ${orderId}`);
        const order = await Order.findById(orderId);
        if (!order) {
            console.log('Order not found');
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('Order found, adding stock count back to variant');
        // Add stock count back to variant
        for (const item of order.cartData) {
            const variant = await Variant.findById(item.variantId);
            if (variant.size.has(item.size)) {
                const currentStock = variant.size.get(item.size);
                variant.size.set(item.size, currentStock + item.quantity);
                await variant.save();
                console.log(`Updated stock for size ${item.size}: ${variant.size.get(item.size)}`);
            }
        }

        console.log('Updating order status to Cancelled');
        order.orderStatus = 'Cancelled';
        await order.save();

        console.log('Order cancelled successfully');
        res.redirect(`/user/orderStatus/${orderId}`);
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Error cancelling order', error });
    }
};

module.exports = {
    viewCart,
    addToCart,
    deleteItem,
    updateCartQuantity,
    checkout,
    createOrder,
    viewOrders,
    viewOrderStatus,
    cancelOrder
};