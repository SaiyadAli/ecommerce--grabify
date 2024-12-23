const express = require('express');
const router = express.Router();
const homeController = require('../controller/homeController');
const userController = require('../controller/userController');
const auth = require('../middleware/auth');

router.get('/home', homeController.getHomePage); // Allow access to home page without session check
router.get('/login', auth.isLogin, userController.getLoginPage);
router.post('/login', userController.loginUser);
router.get('/register', userController.getRegisterPage); // Add this line for registration page
router.post('/register', userController.registerUser);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);

router.get('/logout', userController.logoutUser); 

module.exports = router;