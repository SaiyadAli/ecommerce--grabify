const categoryModel = require('../model/categoryModel')

const loadCategories = async (req, res) => {
    try {
        const admin = req.session.admin;

        // Check if the admin is logged in
        if (!admin) {
            return res.redirect('/admin/login');
        }

        // Fetch all categories from the database
        const categories = await categoryModel.find({});

        // Render the admin category management page, passing categories and an empty message
        res.render('admin/category', {
            categories,  // Ensure the variable matches the one used in EJS
            message: ''  // Placeholder for potential feedback messages
        });

    } catch (error) {
        // Log the error for debugging purposes
        console.error('Error loading categories:', error);

        // Send a response to the client in case of an error
        res.status(500).send('An error occurred while fetching categories.');
    }
};
const toggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Find the category by ID
        const category = await categoryModel.findById(categoryId);

        if (!category) {
            return res.status(404).send('Category not found');
        }

        // Toggle the isListed status
        category.isListed = !category.isListed;

        // Save the updated category
        await category.save();

        // Respond with the new status to send back to the client (AJAX)
        res.json({ success: true, isListed: category.isListed });
    } catch (error) {
        console.error('Error updating category status:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating category status.' });
    }
};
const addCategory = async (req, res) => {
    try {
      const { categoryName, categoryDescription, isListed } = req.body;
  
      // Check if the category already exists
      const existingCategory = await categoryModel.findOne({ categoryName: categoryName.trim() });
  
      if (existingCategory) {
        return res.json({
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
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error adding category:', error);
      res.status(500).json({ success: false, message: 'Failed to add category.' });
    }
  };
  
  const editCategory = async (req, res) => {
    try {
      const { categoryId, categoryName, categoryDescription, isListed } = req.body;
  
      // Check if another category with the same name exists
      const existingCategory = await categoryModel.findOne({
        categoryName: categoryName.trim(),
        _id: { $ne: categoryId }, // Exclude the current category ID
      });
  
      if (existingCategory) {
        return res.json({
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
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Failed to update the category.' });
      }
    } catch (error) {
      console.error('Error editing category:', error);
      res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
    }
  };


const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the category exists
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Delete the category
    await categoryModel.findByIdAndDelete(id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};



  module.exports = { loadCategories, addCategory, editCategory, toggleCategoryStatus,deleteCategory };
  


