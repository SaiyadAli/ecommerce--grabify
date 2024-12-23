let express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const auth = require('../middleware/auth');

// Uncomment these routes as needed
router.get('/login', auth.isLogin, userController.loadLogin);
router.post('/login', userController.login);
router.get('/register', auth.isLogin, userController.loadRegister);
router.post('/register', userController.registerUser);
router.get('/home', auth.checkSession, userController.loadHome);
router.get('/logout', auth.checkSession, userController.logout);

module.exports = router; // Export router at the bottom after defining it
