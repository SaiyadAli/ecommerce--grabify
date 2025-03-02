const categoryModel = require('../model/categoryModel');
const StatusCodes = require('../statusCodes');

// Load categories page
const loadCategories = async (req, res) => {
    try {
        const admin = req.session.admin;

        // Check if the admin is logged in
        if (!admin) {
            return res.redirect('/admin/login');
        }

        // Fetch all categories from the database
        const categories = await categoryModel.find({});

        // Render the admin category management page
        res.render('admin/category', {
            categories,
            message: ''
        });

    } catch (error) {
        console.error('Error loading categories:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('An error occurred while fetching categories.');
    }
};

// Toggle category status
const toggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Find the category by ID
        const category = await categoryModel.findById(categoryId);

        if (!category) {
            return res.status(StatusCodes.NOT_FOUND).send('Category not found');
        }

        // Toggle the isListed status
        category.isListed = !category.isListed;

        // Save the updated category
        await category.save();

        // Respond with the new status to send back to the client (AJAX)
        res.status(StatusCodes.SUCCESS).json({ success: true, isListed: category.isListed });
    } catch (error) {
        console.error('Error updating category status:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'An error occurred while updating category status.' });
    }
};

// Add a category
const addCategory = async (req, res) => {
    try {
        const { categoryName, categoryDescription, isListed } = req.body;

        // Check if the category already exists (case-insensitive)
        const existingCategory = await categoryModel.findOne({ categoryName: { $regex: new RegExp(categoryName.trim(), 'i') } });

        if (existingCategory) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'A category with this name already exists. Please use a different name.',
            });
        }

        // Create a new category document
        const newCategory = new categoryModel({
            categoryName: categoryName.trim(),
            categoryDescription,
            isListed: isListed === 'true',
        });

        await newCategory.save();

        res.status(StatusCodes.SUCCESS).json({ success: true });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to add category.' });
    }
};

// Edit a category
const editCategory = async (req, res) => {
    try {
        const { categoryId, categoryName, categoryDescription, isListed } = req.body;

        // Check if another category with the same name exists (case-insensitive)
        const existingCategory = await categoryModel.findOne({
            categoryName: { $regex: new RegExp(categoryName.trim(), 'i') },
            _id: { $ne: categoryId }, // Exclude the current category ID
        });

        if (existingCategory) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'A category with this name already exists. Please use a different name.',
            });
        }

        // Update the category
        const updatedCategory = await categoryModel.findByIdAndUpdate(
            categoryId,
            {
                categoryName: categoryName.trim(),
                categoryDescription,
                isListed: isListed === 'true',
            },
            { new: true }
        );

        if (updatedCategory) {
            res.status(StatusCodes.SUCCESS).json({ success: true });
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Failed to update the category.' });
        }
    } catch (error) {
        console.error('Error editing category:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'An unexpected error occurred.' });
    }
};

// Delete a category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the category exists
        const category = await categoryModel.findById(id);
        if (!category) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Category not found' });
        }

        // Delete the category
        await categoryModel.findByIdAndDelete(id);

        res.status(StatusCodes.SUCCESS).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to delete category' });
    }
};

module.exports = {
    loadCategories,
    addCategory,
    editCategory,
    toggleCategoryStatus,
    deleteCategory,
};