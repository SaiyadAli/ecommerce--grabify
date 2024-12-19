const userSchema = require('../model/userModel');
const bcrypt = require('bcrypt');
const saltround = 10;

const registerUser = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Check if user already exists
        const user = await userSchema.findOne({ email });
        if (user) {
            return res.render('user/register', {
                message: 'User already exists',
                username,
                email,
            });
        }

        // Check if password matches confirmPassword
        if (password !== confirmPassword) {
            return res.render('user/register', {
                message: 'Passwords do not match',
                username,
                email,
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltround);

        // Create a new user with the username and email
        const newUser = new userSchema({
            username,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();

        // Redirect to login page after successful registration
        res.render('user/login', { message: 'User created successfully' });

    } catch (error) {
        // Handle any errors
        res.render('user/register', {
            message: 'Something went wrong. Please try again.',
            username,
            email,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await userSchema.findOne({ email });
        if (!user) {
            return res.render('user/login', {
                message: 'User does not exist',
                email,
            });
        }

        // Compare the entered password with the stored password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('user/login', {
                message: 'Incorrect password',
                email,
            });
        }

        // Set the session for the logged-in user
        req.session.user = { id: user._id, username: user.username };

        // Redirect to the user's home page
        res.render('user/userHome', {
            message: 'Login successful',
            username: user.username,
        });

    } catch (error) {
        res.render('user/login', {
            message: 'Something went wrong. Please try again.',
            email,
        });
    }
};

const logout = (req, res) => {
    req.session.user = null;
    res.redirect('/user/login');
};

const loadRegister = (req, res) => {
    res.render('user/register', { message: '', username: '', email: '' });
};

const loadLogin = (req, res) => {
    res.render('user/login', { message: '', email: '' });
};

const loadHome = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }
    res.render('user/userHome', { username: req.session.user.username });
};

module.exports = {
    registerUser,
    loadRegister,
    loadLogin,
    login,
    loadHome,
    logout,
};

