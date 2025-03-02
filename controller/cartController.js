const mongoose = require('mongoose');
const Cart = require('../model/cartModel');
const Product = require('../model/productModel');
const Variant = require('../model/variantModel'); // Import the Variant model
const User = require('../model/userModel'); // Import the User model
const Order = require('../model/orderModel'); // Import the Order model
const Coupon = require('../model/couponModel'); // Import the Coupon model
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Wallet = require('../model/walletModel'); // Import the Wallet model
const PDFDocument = require('pdfkit'); // Import PDFKit for generating PDFs
const stream = require('stream'); // Import stream for handling in-memory streams
const StatusCodes = require('../statusCodes');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const addToCart = async (req, res) => {
    try {
        const { userId, productId, variantId, quantity, size } = req.body;
        console.log('Received data:', { userId, productId, variantId, quantity, size }); // Debugging line

        // Validate received data
        if (!userId || !productId || !variantId || !quantity || !size) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'All fields are required' });
        }

        // Check if the variant exists and has sufficient stock
        const variant = await Variant.findById(variantId);
        if (!variant) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Variant not found' });
        }
        
        // Check if the cart item already exists for the user
        const existingCartItem = await Cart.findOne({ userId, productId, variantId, size });
        if (existingCartItem) {
            console.log('Duplicate cart item found:', existingCartItem); // Debugging line
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'This product is already in your cart.' });
        }

        
        const availableStock = variant.size.get(size);
        console.log('Available stock:', availableStock); // Debugging line
        console.log('Requested quantity:', quantity); // Debugging line
        if (availableStock < quantity) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Insufficient quantity available' });
        }

        

        // Create a new cart item if it doesn't exist
        const newCartItem = new Cart({ userId, productId, variantId, quantity, size });
        await newCartItem.save();
        console.log('Added new cart item:', newCartItem); // Debugging line
        res.status(StatusCodes.SUCCESS).json({ message: 'Product added to cart successfully!' });
    } catch (error) {
        console.error('Error adding product to cart:', error); // Debugging line
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error adding product to cart', error });
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
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Insufficient quantity available' });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        const cartItems = await Cart.find({ userId: req.user._id }).populate('variantId');
        const total = cartItems.reduce((sum, item) => sum + item.variantId.effectivePrice * item.quantity, 0);
        const totalItem = cartItem.variantId.effectivePrice * cartItem.quantity;

        res.status(StatusCodes.SUCCESS).json({ message: 'Cart updated successfully', total, totalItem });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

const checkout = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('addresses');
        const cartItems = await Cart.find({ userId: req.user._id }).populate('productId variantId');
        let grandTotal = cartItems.reduce((sum, item) => sum + item.variantId.effectivePrice * item.quantity, 0);

        // Round grand total to 2 decimal places
        grandTotal = Math.round(grandTotal * 100) / 100;

        // Fetch available coupons that satisfy the conditions
        const currentDate = new Date();
        const coupons = await Coupon.find({
            startDate: { $lte: currentDate },
            expiryDate: { $gte: currentDate },
            minimumPurchase: { $lte: grandTotal }
        });

        // Fetch user's wallet balance
        const wallet = await Wallet.findOne({ userId: req.user._id });
        const walletBalance = wallet ? wallet.walletBalance : 0;

        res.render('user/checkout', {
            username: req.user.username,
            addressData: user.addresses,
            cartItems,
            grandTotal,
            coupons, // Pass coupons to the view
            walletBalance // Pass wallet balance to the view
        });
    } catch (error) {
        console.error('Error fetching user addresses or cart items:', error);
        res.status(500).json({ message: 'Error fetching user addresses or cart items', error });
    }
};

const createOrderCOD = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chosenAddress, couponCode, walletDeduction, paymentType } = req.body;

        const cartItems = await Cart.find({ userId }).populate('productId variantId');
        const total = cartItems.reduce((sum, item) => sum + item.variantId.effectivePrice * item.quantity, 0);
        const nonOfferPrice = cartItems.reduce((sum, item) => sum + item.variantId.price * item.quantity, 0);

        const coupon = await Coupon.findOne({ couponCode });
        let discountAmount = coupon ? (total * coupon.discountPercentage) / 100 : 0;
        if (coupon && discountAmount > coupon.maximumDiscount) {
            discountAmount = coupon.maximumDiscount;
        }
        let grandTotal = total - discountAmount;

        if (walletDeduction) {
            grandTotal -= walletDeduction;
        }

        if (grandTotal < 0) {
            grandTotal = 0;
        }

        const orderData = cartItems.map(item => ({
            productName: item.productId.name,
            variantColor: item.variantId.color,
            quantity: item.quantity,
            size: item.size,
            price: item.variantId.effectivePrice,
            variantId: item.variantId._id,
            variantImage: item.variantId.images[0] // Add the first image from the variant's images array
        }));

        for (const item of cartItems) {
            const variant = item.variantId;
            if (variant.size.has(item.size)) {
                const currentStock = variant.size.get(item.size);
                if (currentStock >= item.quantity) {
                    variant.size.set(item.size, currentStock - item.quantity);
                    await variant.save();
                } else {
                    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Insufficient stock for ${item.productId.name} (${item.variantId.color})` });
                }
            } else {
                return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Size ${item.size} not available for ${item.productId.name} (${item.variantId.color})` });
            }
        }

        const newOrder = new Order({
            userId,
            orderNumber: Date.now(),
            paymentType: paymentType === 'wallet' ? 'wallet' : 'COD',
            addressChosen: chosenAddress,
            cartData: orderData,
            grandTotalCost: grandTotal,
            couponDeduction: discountAmount,
            walletDeduction,
            paymentStatus: paymentType === 'wallet' ? 'Paid' : 'Pending',
            nonOfferPrice
        });

        await newOrder.save();
        await Cart.deleteMany({ userId });

        // Deduct wallet balance after order is successfully placed
        if (walletDeduction) {
            const wallet = await Wallet.findOne({ userId });
            if (wallet) {
                wallet.walletBalance -= walletDeduction;
                wallet.walletTransaction.push({
                    transactionDate: new Date(),
                    transactionAmount: walletDeduction,
                    transactionType: 'Debit'
                });
                await wallet.save();
            }
        }

        res.json({ success: true, message: 'Order created successfully!' });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error creating order', error });
    }
};

const createAndVerifyOrderRazorpay = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chosenAddress, paymentId, orderId, signature, couponCode, walletDeduction } = req.body;

        if (!paymentId || !orderId || !signature) {
            const cartItems = await Cart.find({ userId }).populate('productId variantId');
            const total = cartItems.reduce((sum, item) => sum + item.variantId.effectivePrice * item.quantity, 0);
            const nonOfferPrice = cartItems.reduce((sum, item) => sum + item.variantId.price * item.quantity, 0);

            const coupon = await Coupon.findOne({ couponCode });
            let discountAmount = coupon ? (total * coupon.discountPercentage) / 100 : 0;
            if (coupon && discountAmount > coupon.maximumDiscount) {
                discountAmount = coupon.maximumDiscount;
            }
            let grandTotal = total - discountAmount;

            if (walletDeduction) {
                grandTotal -= walletDeduction;
            }

            if (grandTotal < 0) {
                grandTotal = 0;
            }

            const orderData = cartItems.map(item => ({
                productName: item.productId.name,
                variantColor: item.variantId.color,
                quantity: item.quantity,
                size: item.size,
                price: item.variantId.effectivePrice,
                variantId: item.variantId._id,
                variantImage: item.variantId.images[0] // Add the first image from the variant's images array
            }));

            for (const item of cartItems) {
                const variant = item.variantId;
                if (variant.size.has(item.size)) {
                    const currentStock = variant.size.get(item.size);
                    if (currentStock >= item.quantity) {
                        variant.size.set(item.size, currentStock - item.quantity);
                        await variant.save();
                    } else {
                        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Insufficient stock for ${item.productId.name} (${item.variantId.color})` });
                    }
                } else {
                    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Size ${item.size} not available for ${item.productId.name} (${item.variantId.color})` });
                }
            }

            const options = {
                amount: grandTotal * 100,
                currency: 'INR',
                receipt: `receipt_order_${Date.now()}`
            };
            const razorpayOrder = await razorpay.orders.create(options);

            req.session.tempOrder = {
                userId,
                orderNumber: Date.now(),
                paymentType: 'razorpay',
                addressChosen: chosenAddress,
                cartData: orderData,
                grandTotalCost: grandTotal,
                couponDeduction: discountAmount,
                razorpayOrderId: razorpayOrder.id,
                paymentStatus: 'Pending',
                walletDeduction,
                nonOfferPrice
            };

            res.json({ success: true, amount: options.amount, orderId: razorpayOrder.id, userName: req.user.name, userEmail: req.user.email, userContact: req.user.contact });
        } else {
            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            hmac.update(orderId + '|' + paymentId);
            const generatedSignature = hmac.digest('hex');

            if (generatedSignature === signature) {
                const tempOrder = req.session.tempOrder;
                if (!tempOrder || tempOrder.razorpayOrderId !== orderId) {
                    return res.json({ success: false, message: 'Order not found.' });
                }

                // Delete previous order if it exists
                await Order.deleteOne({ orderNumber: tempOrder.orderNumber });

                const newOrder = new Order(tempOrder);
                newOrder.paymentStatus = 'Paid';
                await newOrder.save();

                await Cart.deleteMany({ userId: newOrder.userId });

                req.session.tempOrder = null;

                // Deduct wallet balance after order is successfully placed
                if (tempOrder.walletDeduction) {
                    const wallet = await Wallet.findOne({ userId: newOrder.userId });
                    if (wallet) {
                        wallet.walletBalance -= tempOrder.walletDeduction;
                        wallet.walletTransaction.push({
                            transactionDate: new Date(),
                            transactionAmount: tempOrder.walletDeduction,
                            transactionType: 'Debit'
                        });
                        await wallet.save();
                    }
                }

                res.json({ success: true, message: 'Payment verified and order placed successfully.' });
            } else {
                res.json({ success: false, message: 'Payment verification failed. Please try again from your orders page.' });
            }
        }
    } catch (error) {
        console.error('Error creating or verifying order:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error creating or verifying order', error });
    }
};

const createOrderPayLater = async (req, res) => {
    try {
        const tempOrder = req.session.tempOrder;
        if (tempOrder) {
            const newOrder = new Order(tempOrder);
            newOrder.paymentStatus = 'Payment Pending';
            newOrder.paymentType = 'Pay Later';
            await newOrder.save();

            await Cart.deleteMany({ userId: newOrder.userId });

            req.session.tempOrder = null;

            res.json({ success: true, message: 'Order created with payment pending. Please complete the payment from your orders page.' });
        } else {
            res.json({ success: false, message: 'Order creation failed. Please try again.' });
        }
    } catch (error) {
        console.error('Error creating order with payment pending:', error);
        res.status(500).json({ success: false, message: 'Error creating order with payment pending', error });
    }
};

const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('cartData.variantId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const options = {
            amount: order.grandTotalCost * 100,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };
        const razorpayOrder = await razorpay.orders.create(options);

        // Delete previous order if it exists
        await Order.deleteOne({ orderNumber: order.orderNumber });

        req.session.tempOrder = {
            userId: order.userId,
            orderNumber: Date.now(),
            paymentType: 'razorpay',
            addressChosen: order.addressChosen,
            cartData: order.cartData.map(item => ({
                ...item,
                variantImage: item.variantId.images[0] // Add the first image from the variant's images array
            })),
            grandTotalCost: order.grandTotalCost,
            couponDeduction: order.couponDeduction,
            razorpayOrderId: razorpayOrder.id,
            paymentStatus: 'Pending',
            walletDeduction: order.walletDeduction,
            nonOfferPrice: order.nonOfferPrice
        };

        res.json({ success: true, amount: options.amount, orderId: razorpayOrder.id, userName: req.user.name, userEmail: req.user.email, userContact: req.user.contact });
    } catch (error) {
        console.error('Error retrying payment:', error);
        res.status(500).json({ message: 'Error retrying payment', error });
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
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
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

        // Handle wallet balance based on payment type and status
        let wallet = await Wallet.findOne({ userId: order.userId });
        if (!wallet) {
            wallet = new Wallet({ userId: order.userId, walletBalance: 0, walletTransaction: [] });
        }

        if (order.paymentType === 'wallet') {
            wallet.walletBalance += order.walletDeduction;
            wallet.walletTransaction.push({
                transactionDate: new Date(),
                transactionAmount: order.walletDeduction,
                transactionType: 'Refund'
            });
        } else if (order.paymentStatus === 'Paid') {
            wallet.walletBalance += order.grandTotalCost + order.walletDeduction;
            wallet.walletTransaction.push({
                transactionDate: new Date(),
                transactionAmount: order.grandTotalCost + order.walletDeduction,
                transactionType: 'Refund'
            });
        } else if (order.paymentType === 'COD' && order.walletDeduction > 0) {
            wallet.walletBalance += order.walletDeduction;
            wallet.walletTransaction.push({
                transactionDate: new Date(),
                transactionAmount: order.walletDeduction,
                transactionType: 'Refund'
            });
        }

        await wallet.save();
        console.log('Money added to wallet:', wallet);

        console.log('Order cancelled successfully');
        res.redirect(`/user/orderStatus/${orderId}`);
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error cancelling order', error });
    }
};

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.user._id;

        const coupon = await Coupon.findOne({ couponCode });
        if (!coupon) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid coupon code.' });
        }

        const cartItems = await Cart.find({ userId }).populate('variantId');
        const total = cartItems.reduce((sum, item) => sum + item.variantId.effectivePrice * item.quantity, 0);

        let discountAmount = (total * coupon.discountPercentage) / 100;
        if (discountAmount > coupon.maximumDiscount) {
            discountAmount = coupon.maximumDiscount;
        }
        const newTotal = total - discountAmount;

        res.json({ success: true, discountAmount, newTotal });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error applying coupon', error });
    }
};

const updateWallet = async (req, res) => {
    try {
        const userId = req.user._id;
        const { walletDeduction } = req.body;

        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
            wallet.walletBalance -= walletDeduction;
            wallet.walletTransaction.push({
                transactionDate: new Date(),
                transactionAmount: walletDeduction,
                transactionType: 'Debit'
            });
            await wallet.save();
            res.json({ success: true, message: 'Wallet updated successfully' });
        } else {
            res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Wallet not found' });
        }
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error updating wallet', error });
    }
};



module.exports = {
    viewCart,
    addToCart,
    deleteItem,
    updateCartQuantity,
    checkout,
    createOrderCOD, 
    createAndVerifyOrderRazorpay, 
    viewOrders,
    viewOrderStatus,
    cancelOrder,
    applyCoupon, 
    updateWallet, 
    createOrderPayLater,
    retryPayment,
    
};