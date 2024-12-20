const express = require('express');
const router = express.Router();

const adminController = require('../controller/adminController');
const categoryController = require('../controller/categoryController');
const productController = require('../controller/productController');

const adminAuth = require('../middleware/adminAuth');

// Admin authentication routes
router.get('/login', adminAuth.isLogin, adminController.loadLogin);
router.post('/login', adminController.login);

// Admin dashboard and user management
router.get('/dashboard', adminAuth.checkSession, adminController.loadDashboard);
router.get('/customers', adminAuth.checkSession, adminController.loadCustomers);
router.put('/edit-status/:id', adminAuth.checkSession, adminController.editUserStatus);
router.delete('/delete-user/:id', adminAuth.checkSession, adminController.deleteUser);

// Category management routes
router.get('/categories', adminAuth.checkSession, categoryController.loadCategories);
router.get('/categories/toggle-status/:id', adminAuth.checkSession, categoryController.toggleCategoryStatus);
router.post('/categories/add', adminAuth.checkSession, categoryController.addCategory);
router.post('/categories/edit', adminAuth.checkSession, categoryController.editCategory);
router.delete('/categories/delete/:id', adminAuth.checkSession, categoryController.deleteCategory);

// Product management routes
router.get('/products', adminAuth.checkSession, productController.loadProducts);
router.get('/products/toggle-status/:id', adminAuth.checkSession, productController.toggleProductStatus);
router.post('/products/add', adminAuth.checkSession, productController.addProduct);
router.post('/products/edit', adminAuth.checkSession, productController.editProduct);
router.delete('/products/delete/:id', adminAuth.checkSession, productController.deleteProduct);

// Admin logout
router.get('/logout', adminAuth.checkSession, adminController.logout);

module.exports = router;
