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
const shopController = require('../controller/shopController'); // Import the shopController
const wishlistController = require('../controller/wishlistController'); // Import the wishlistController
const walletController = require('../controller/walletController');
const invoiceController = require('../controller/invoiceController');

router.get('/home', userController.loadHome);
// router.get('/', homeController.loadHomePage);
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

// Route for handling AJAX request for updating cart quantity
router.post('/cart/update-quantity/:id', auth.checkSession, cartController.updateCartQuantity);

// Route for displaying checkout page
router.get('/checkout',auth.checkSession, cartController.checkout);

// Route for handling order creation with COD
router.post('/create-order-cod', auth.checkSession, cartController.createOrderCOD);

// Route for handling order creation and verification with Razorpay
router.post('/create-and-verify-order-razorpay', auth.checkSession, cartController.createAndVerifyOrderRazorpay);

// Route for displaying order history
router.get('/order', auth.checkSession, cartController.viewOrders);

// Route for viewing order status
router.get('/orderStatus/:orderId', auth.checkSession, cartController.viewOrderStatus);

// Route for cancelling order
router.post('/cancel-order/:orderId', auth.checkSession, cartController.cancelOrder);

// Route for handling forgot password request
router.get('/forgot', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Route for displaying shop page
router.get('/shop', auth.checkSession,shopController.getShopPage);

// Route for displaying wishlist
router.get('/wishlist',auth.checkSession, wishlistController.getWishlist);
router.post('/wishlist/add', auth.checkSession, wishlistController.addToWishlist);
router.delete('/wishlist/delete/:id', auth.checkSession, wishlistController.deleteFromWishlist);

// Route for displaying wallet
router.get('/wallet',auth.checkSession, walletController.viewWallet);

// Route for handling coupon application
router.post('/apply-coupon',auth.checkSession, cartController.applyCoupon);

// Route for handling wallet update request
router.post('/update-wallet',auth.checkSession, cartController.updateWallet);

// Route for handling invoice download request
router.get('/download-invoice/:orderId', auth.checkSession,invoiceController.downloadInvoice);

module.exports = router;