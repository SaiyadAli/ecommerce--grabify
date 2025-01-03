const express = require('express');
const router = express.Router();
const passport = require('passport');
const homeController = require('../controller/homeController');
const userController = require('../controller/userController');
const userProductController = require('../controller/userProductController'); // Import the userProductController
const accountController = require('../controller/accountController'); // Import the accountController
const userCategoryController = require('../controller/userCategoryController'); // Import the userCategoryController
const auth = require('../middleware/auth');
const cartController = require('../controller/cartController'); // Import the cartController

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
router.get('/product/:id', auth.checkSession,userProductController.displayProduct);

// Route for displaying my account page
router.get('/myaccount', auth.checkSession, accountController.getMyAccount);

// Route for displaying my address page
router.get('/myAddress', auth.checkSession, accountController.getMyAddress);

// Route for displaying add address page
router.get('/addAddress', auth.checkSession, accountController.getAddAddress);

// Route for handling add address form submission
router.post('/addAddress', auth.checkSession, accountController.postAddAddress);

// Route for displaying edit address page
router.get('/editAddress/:addressId', auth.checkSession, accountController.getEditAddress);

// Route for handling edit address form submission
router.post('/editAddress/:addressId', auth.checkSession, accountController.postEditAddress);

// Route for handling address deletion
router.post('/deleteAddress/:addressId', auth.checkSession, accountController.deleteAddress);

// Route for displaying user information
router.get('/userInformation', auth.checkSession, accountController.userInformation);

// Route for displaying edit user information page
router.get('/editUserInformation', auth.checkSession, accountController.editUserInformation);

// Route for updating user information
router.post('/updateUserInformation', auth.checkSession, accountController.updateUserInformation);

// Route for sending OTP
router.post('/sendOTP', auth.checkSession, accountController.sendOTP);

// Route for displaying category products
router.get('/category/:categoryId', userCategoryController.getCategoryProducts);

// Route for handling add-to-cart request
router.post('/add-to-cart',auth.checkSession, cartController.addToCart);

// Route for displaying cart page
router.get('/cart', auth.checkSession, cartController.viewCart);

// Route for deleting cart item
router.get('/cart/delete/:id', auth.checkSession, cartController.deleteItem);

// Route for updating cart quantity
router.post('/cart/update-quantity/:id', auth.checkSession, cartController.updateCartQuantity);

// Route for displaying checkout page
router.get('/checkout',auth.checkSession, cartController.checkout);

// Route for handling order creation
router.post('/create-order', auth.checkSession, cartController.createOrder);

// Route for displaying order history
router.get('/order', auth.checkSession, cartController.viewOrders);

// Route for viewing order status
router.get('/orderStatus/:orderId', auth.checkSession, cartController.viewOrderStatus);

// Route for cancelling order
router.post('/cancel-order/:orderId', auth.checkSession, cartController.cancelOrder);

module.exports = router;