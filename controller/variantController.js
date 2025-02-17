const Product = require('../model/productModel');
const Variant = require('../model/variantModel');
const Category = require('../model/categoryModel');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const getAddVariantPage = async (req, res) => {
    try {
        const products = await Product.find({ isListed: true });
        const selectedProductId = req.query.productId || null;
        res.render('admin/addvariant', { products, selectedProductId, message: null, messageType: null });
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).send('Server Error');
    }
};

const addVariant = async (req, res) => {
    try {
        const { productId, color, price, sizes, stock } = req.body;
        const images = req.files;

        if (!images || images.length !== 3) {
            const products = await Product.find({ isListed: true });
            return res.render('admin/addvariant', { products, message: 'Please upload exactly 3 images.', messageType: 'danger' });
        }

        // Check for duplicate variant color
        const existingVariant = await Variant.findOne({ productId, color });
        if (existingVariant) {
            const products = await Product.find({ isListed: true });
            return res.render('admin/addvariant', { products, message: 'Variant with this color already exists.', messageType: 'danger' });
        }

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            const products = await Product.find({ isListed: true });
            return res.render('admin/addvariant', { products, message: 'Product not found', messageType: 'danger' });
        }

        // Save the images to the specified directory
        const imagePaths = [];
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const filename = `${product._id}_${color}_${i + 1}.jpg`;
            const outputPath = path.join(__dirname, '../public/assets/products', filename);

            await sharp(image.buffer)
                .resize(312, 350)
                .toFile(outputPath);

            imagePaths.push(`/assets/products/${filename}`);
        }

        // Create a new variant
        const newVariant = new Variant({
            color,
            images: imagePaths,
            price,
            size: {},
            productId: product._id,
            isListed: true, // Set isListed to true by default
        });

        // Process sizes and stock
        for (const size in sizes) {
            if (sizes[size]) {
                newVariant.size.set(size, stock[size]);
            }
        }

        // Save the new variant
        await newVariant.save();

        res.redirect('/admin/variant');
    } catch (error) {
        console.error('Error adding variant:', error);
        res.status(500).send('Server Error');
    }
};

const getVariantsPage = async (req, res) => {
    try {
        const admin = req.session.admin;

        // Check if the admin is logged in
        if (!admin) {
            return res.redirect('/admin/login');
        }

        // Fetch all variants, categories, and products
        const variants = await Variant.find().populate('productId');
        const categories = await Category.find();
        const products = await Product.find().populate('categoryid');

        // Render the admin variants page
        res.render('admin/variant', {
            variants,
            categories,
            products,
            message: null,
            messageType: null
        });
    } catch (error) {
        console.error('Error loading variants:', error);
        res.status(500).send('Server Error');
    }
};

const toggleVariantStatus = async (req, res) => {
    try {
        const variantId = req.params.id;

        // Find the variant by ID
        const variant = await Variant.findById(variantId);
        
        if (!variant) {
            return res.status(404).send('Variant not found');
        }

        // Toggle the isListed status
        variant.isListed = !variant.isListed;

        // Save the updated variant
        await variant.save();
        console.log('Variant status updated:', variant.isListed);
        // Redirect to the variants page to refresh the view
        res.json(true);
    } catch (error) {
        console.error('Error updating variant status:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating variant status.' });
    }
};

const deleteVariant = async (req, res) => {
    try {
        const variantId = req.params.id;

        // Find the variant by ID
        const variant = await Variant.findById(variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found.' });
        }

        // Delete the images from the file system
        for (const image of variant.images) {
            const imagePath = path.join(__dirname, '../public', image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete the variant by ID
        await Variant.findByIdAndDelete(variantId);

        res.json({ success: true, message: 'Variant deleted successfully!' });
    } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the variant.' });
    }
};

const getEditVariantPage = async (req, res) => {
    try {
        const variantId = req.params.id;
        const variant = await Variant.findById(variantId).populate('productId');

        if (!variant) {
            return res.status(404).send('Variant not found');
        }

        const products = await Product.find({ isListed: true });

        res.render('admin/editvariant', { variant, products, message: null, messageType: null });
    } catch (error) {
        console.error('Error loading variant:', error);
        res.status(500).send('Server Error');
    }
};

const editVariant = async (req, res) => {
    try {
        const variantId = req.params.id;
        const { color, price, sizes, stock, imageIndexes } = req.body;
        const images = req.files;

        const variant = await Variant.findById(variantId);

        if (!variant) {
            return res.status(404).send('Variant not found');
        }

        // Check for duplicate variant color
        const existingVariant = await Variant.findOne({ productId: variant.productId, color, _id: { $ne: variantId } });
        if (existingVariant) {
            const products = await Product.find({ isListed: true });
            return res.render('admin/editvariant', { variant, products, message: 'Variant with this color already exists.', messageType: 'danger' });
        }

        variant.color = color || variant.color;
        variant.price = price || variant.price;

        // Update sizes and stock
        for (const size in sizes) {
            if (sizes[size]) {
                variant.size.set(size, stock[size]);
            } else {
                variant.size.delete(size);
            }
        }

        if (images && images.length > 0) {
            const imagePaths = [...variant.images]; // Copy existing images
            const indexes = imageIndexes.split(',').map(Number);

            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const index = indexes[i];
                const filename = `${variant.productId}_${variant.color}_${index + 1}_${Date.now()}.jpg`; // Generate unique filename
                const outputPath = path.join(__dirname, '../public/assets/products', filename);

                await sharp(image.buffer)
                    .resize(312, 350)
                    .toFile(outputPath);

                // Replace the corresponding image in the array
                if (imagePaths[index]) {
                    const oldImagePath = path.join(__dirname, '..', 'public', imagePaths[index]);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                imagePaths[index] = `/assets/products/${filename}`;
            }

            variant.images = imagePaths;
        }

        await variant.save();

        res.redirect('/admin/variant');
    } catch (error) {
        console.error('Error editing variant:', error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getAddVariantPage,
    addVariant,
    getVariantsPage,
    toggleVariantStatus,
    deleteVariant,
    getEditVariantPage,
    editVariant,
};