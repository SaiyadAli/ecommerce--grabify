const mongoose = require('mongoose');
const Cart = require('../model/cartModel');
const Variant = require('../model/variantModel'); // Import the Variant model

exports.addToCart = async (req, res) => {
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
