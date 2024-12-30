const userModel = require('../model/userModel');

const checkSession = async (req, res, next) => {
    if (req.session.user) {
        try {
            // Verify the user exists in the database
            const user = await userModel.findById(req.session.user.id); // Use `id` if stored in session
            if (!user) {
                // User not found, destroy session and redirect
                return req.session.destroy((err) => {
                    if (err) {
                        console.error('Error destroying session:', err);
                    }
                    res.clearCookie('connect.sid');
                    return res.redirect('/user/login');
                });
            }
            req.user = user; // Attach user to request
            next(); // Proceed if user exists
        } catch (err) {
            console.error('Error checking session:', err);
            res.redirect('/user/login'); // Redirect on error
        }
    } else {
        // No session exists
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

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/user/login');
};

module.exports = { checkSession, isLogin, isAuthenticated };