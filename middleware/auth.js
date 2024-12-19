const userModel = require('../model/userModel');

const checkSession = async (req, res, next) => {
    if (req.session.user) {
        // Check if the user exists in the database
        const user = await userModel.findById(req.session.user);
        if (!user) {
            // Destroy the session if the user does not exist
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
                res.redirect('/user/login');
            });
        } else {
            next();  // User exists, proceed with the request
        }
    } else {
        res.redirect('/user/login');
    }
};

const isLogin = (req, res, next) => {
    if (req.session.user) {
        res.redirect('/user/home');
    } else {
        next();
    }
};

module.exports = { checkSession, isLogin };
