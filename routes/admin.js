const express = require('express')
const router = express.Router();
const adminController = require('../controller/adminController')
const categoryController = require('../controller/categoryController')
const adminAuth = require('../middleware/adminAuth')


router.get('/login', adminAuth.isLogin,adminController.loadLogin)
router.post('/login', adminController.login)


router.get('/dashboard',adminAuth.checkSession, adminController.loadDashboard)
router.get('/customers',adminAuth.checkSession,adminController.loadCustomers)
router.put('/edit-status/:id', adminAuth.checkSession, adminController.editUserStatus)
router.delete('/delete-user/:id',adminAuth.checkSession,adminController.deleteUser)


router.get('/categories',adminAuth.checkSession,categoryController.loadCategories)
router.get('/categories/toggle-status/:id', adminAuth.checkSession, categoryController.toggleCategoryStatus);
router.post('/categories/add', adminAuth.checkSession, categoryController.addCategory);
router.post('/categories/edit', adminAuth.checkSession, categoryController.editCategory);
router.delete('/categories/delete/:id', categoryController.deleteCategory);





router.get('/logout',adminAuth.checkSession,adminController.logout)

module.exports = router