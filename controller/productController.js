const productModel = require('../model/productModel');
const categoryModel = require('../model/categoryModel');

// Load products page with categories
const loadProducts = async (req, res) => {
    try {
        const admin = req.session.admin;

        // Check if the admin is logged in
        if (!admin) {
            return res.redirect('/admin/login');
        }

        // Fetch all products and categories
        const products = await productModel.find({}).populate('categoryid');
        const categories = await categoryModel.find({});

        // Render the admin products page
        res.render('admin/products', {
            products,
            categories,
            message: ''
        });
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).send('An error occurred while fetching products.');
    }
};

// Toggle product status
const toggleProductStatus = async (req, res) => {
    try {
        const productId = req.params.id;

        // Find the product by ID
        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Toggle the isListed status
        product.isListed = !product.isListed;

        // Save the updated product
        await product.save();

        // Respond with the new status to send back to the client (AJAX)
        res.json({ success: true, isListed: product.isListed });
    } catch (error) {
        console.error('Error updating product status:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating product status.' });
    }
};

// Add a product
const addProduct = async (req, res) => {
    try {
        const { name, description, categoryid, isListed } = req.body;

        // Check if the product name already exists (case-insensitive)
        const existingProduct = await productModel.findOne({ name: { $regex: new RegExp(name, 'i') } });
        if (existingProduct) {
            return res.status(400).json({ success: false, message: 'Product name already exists. Please use a different name.' });
        }

        // Create a new product
        const newProduct = new productModel({
            name,
            description,
            categoryid,
            isListed: isListed === 'true', // Convert string to boolean
        });

        // Save the product
        await newProduct.save();

        res.json({ success: true, message: 'Product added successfully!' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while adding the product.' });
    }
};

// Edit a product
const editProduct = async (req, res) => {
    try {
        const { productId, name, description, categoryid, isListed } = req.body;

        // Check if the product name already exists (case-insensitive)
        const existingProduct = await productModel.findOne({ name: { $regex: new RegExp(name, 'i') }, _id: { $ne: productId } });
        if (existingProduct) {
            return res.status(400).json({ success: false, message: 'Product name already exists. Please use a different name.' });
        }

        // Find the product by ID and update
        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            {
                name,
                description,
                categoryid,
                isListed: isListed === 'true', // Convert string to boolean
            },
            { new: true } // Return the updated product
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.json({ success: true, message: 'Product updated successfully!' });
    } catch (error) {
        console.error('Error editing product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while editing the product.' });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // Delete the product by ID
        const deletedProduct = await productModel.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.json({ success: true, message: 'Product deleted successfully!' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the product.' });
    }
};

const getProductsByCategory = async (req, res) => {
    try {
        const products = await productModel.find({ categoryid: req.params.categoryId }); // Ensure the field name matches your schema
        res.json(products);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    loadProducts,
    addProduct,
    editProduct,
    toggleProductStatus,
    deleteProduct,
    getProductsByCategory
};



