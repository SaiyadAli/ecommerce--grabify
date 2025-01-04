const express = require('express');
const router = express.Router();
const variantController = require('../controller/variantController');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const adminController = require('../controller/adminController');
const categoryController = require('../controller/categoryController');
const productController = require('../controller/productController');
const orderController = require('../controller/orderController');

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

// Order management routes
router.get('/orders', adminAuth.checkSession, orderController.listOrders);


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/addvariant', adminAuth.checkSession, variantController.getAddVariantPage);
router.post('/addvariant', adminAuth.checkSession, upload.array('images', 5), variantController.addVariant);

router.get('/variant', adminAuth.checkSession, variantController.getVariantsPage);
router.post('/variant/togglestatus/:id', adminAuth.checkSession, variantController.toggleVariantStatus); // Add this line for toggling status
router.delete('/variant/:id', adminAuth.checkSession, variantController.deleteVariant);

router.get('/editvariant/:id', adminAuth.checkSession, variantController.getEditVariantPage);
router.post('/editvariant/:id', adminAuth.checkSession, variantController.editVariant);

// Admin logout
router.get('/logout', adminAuth.checkSession, adminController.logout);

module.exports = router;
