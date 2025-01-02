const mongoose = require('mongoose');
const Cart = require('../model/cartModel');
const Product = require('../model/productModel');
const Variant = require('../model/variantModel'); // Import the Variant model

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

        res.status(200).json({ message: 'Cart updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    viewCart,
    addToCart,
    deleteItem,
    updateCartQuantity,
    
};