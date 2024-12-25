const Product = require('../model/productModel');
const Variant = require('../model/variantModel');
const Category = require('../model/categoryModel');
const path = require('path');
const fs = require('fs');

const getAddVariantPage = async (req, res) => {
    try {
        const products = await Product.find({ isListed: true });
        res.render('admin/addvariant', { products, message: null, messageType: null });
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
        const imagePaths = images.map((image, index) => {
            const imageName = `${product.name}_${color}_${index + 1}${path.extname(image.originalname)}`;
            const imagePath = path.join(__dirname, '../public/assets/products', imageName);
            fs.writeFileSync(imagePath, fs.readFileSync(image.path));
            return `/assets/products/${imageName}`;
        });

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

        // Delete the variant by ID
        const deletedVariant = await Variant.findByIdAndDelete(variantId);
         
        if (!deletedVariant) {
            return res.status(404).json({ success: false, message: 'Variant not found.' });
        }

        res.json({ success: true, message: 'Variant deleted successfully!' });
    } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the variant.' });
    }
};

module.exports = {
    getAddVariantPage,
    addVariant,
    getVariantsPage,
    toggleVariantStatus,
    deleteVariant,
};