const express = require('express');
const router = express.Router();
const passport = require('passport');
const homeController = require('../controller/homeController');
const userController = require('../controller/userController');
const userProductController = require('../controller/userProductController'); // Import the userProductController
const accountController = require('../controller/accountController'); // Import the accountController
const auth = require('../middleware/auth');

router.get('/home', userController.loadHome);
router.get('/', homeController.loadHomePage);
router.get('/login', auth.isLogin, userController.getLoginPage);
router.post('/login', userController.loginUser);
router.get('/register', userController.getRegisterPage);
router.post('/register', userController.registerUser);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.get('/logout', userController.logoutUser);

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/user/login' }),
  (req, res) => {
    // Set session user information
    req.session.user = { id: req.user._id, username: req.user.username };
    res.redirect('/user/home');
  }
);

// Route for displaying product details
router.get('/product/:id', userProductController.displayProduct);

// Route for displaying my account page
router.get('/myaccount', auth.checkSession, accountController.getMyAccount);

module.exports = router;