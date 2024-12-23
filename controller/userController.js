// const userSchema = require('../model/userModel');
// const bcrypt = require('bcrypt');
// const saltround = 10;

// const registerUser = async (req, res) => {
//     try {
//         const { username, email, password, confirmPassword } = req.body;

//         // Check if user already exists
//         const user = await userSchema.findOne({ email });
//         if (user) {
//             return res.render('user/register', {
//                 message: 'User already exists',
//                 username,
//                 email,
//             });
//         }

//         // Check if password matches confirmPassword
//         if (password !== confirmPassword) {
//             return res.render('user/register', {
//                 message: 'Passwords do not match',
//                 username,
//                 email,
//             });
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, saltround);

//         // Create a new user with the username and email
//         const newUser = new userSchema({
//             username,
//             email,
//             password: hashedPassword,
//         });

//         // Save the user to the database
//         await newUser.save();

//         // Redirect to login page after successful registration
//         res.render('user/login', { message: 'User created successfully' });

//     } catch (error) {
//         // Handle any errors
//         res.render('user/register', {
//             message: 'Something went wrong. Please try again.',
//             username,
//             email,
//         });
//     }
// };

// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Check if the user exists
//         const user = await userSchema.findOne({ email });
//         if (!user) {
//             return res.render('user/login', {
//                 message: 'User does not exist',
//                 email,
//             });
//         }

//         // Compare the entered password with the stored password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.render('user/login', {
//                 message: 'Incorrect password',
//                 email,
//             });
//         }

//         // Set the session for the logged-in user
//         req.session.user = { id: user._id, username: user.username };

//         // Redirect to the user's home page
//         res.render('user/userHome', {
//             message: 'Login successful',
//             username: user.username,
//         });

//     } catch (error) {
//         res.render('user/login', {
//             message: 'Something went wrong. Please try again.',
//             email,
//         });
//     }
// };

// const logout = (req, res) => {
//     req.session.user = null;
//     res.redirect('/user/login');
// };

// const loadRegister = (req, res) => {
//     res.render('user/register', { message: '', username: '', email: '' });
// };

// const loadLogin = (req, res) => {
//     res.render('user/login', { message: '', email: '' });
// };

// const loadHome = (req, res) => {
//     if (!req.session.user) {
//         return res.redirect('/user/login');
//     }
//     res.render('user/userHome', { username: req.session.user.username });
// };

// module.exports = {
//     registerUser,
//     loadRegister,
//     loadLogin,
//     login,
//     loadHome,
//     logout,
// };

// filepath: src/controller/userController.js
const userSchema = require('../model/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const saltround = 10;

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'grabify75@gmail.com',
        pass: 'hjgi ftcx kbop nmyf'
    }
});

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

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Send OTP to user's email
        const mailOptions = {
            from: 'grabify75@gmail.com',
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP for email verification is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending OTP email:', error);
                return res.status(500).send('Error sending OTP email');
            }

            // Store OTP and user details in session
            req.session.otp = otp;
            req.session.tempUser = { username, email, password };

            res.render('user/verifyotp', { email, message: null }); // Ensure message is defined
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).send('Server Error');
    }
};

const verifyOtp = (req, res) => {
    const { otp } = req.body;

    if (otp === req.session.otp) {
        // OTP is correct, proceed with registration
        const { username, email, password } = req.session.tempUser;

        // Hash the password
        bcrypt.hash(password, saltround, async (err, hashedPassword) => {
            if (err) {
                return res.status(500).send('Server Error');
            }

            // Create a new user with the username and email
            const newUser = new userSchema({
                username,
                email,
                password: hashedPassword,
            });

            await newUser.save();

            // Clear OTP and tempUser from session
            req.session.otp = null;
            req.session.tempUser = null;

            res.render('user/login', {
                message: 'Registration successful. Please log in.',
            });
        });
    } else {
        res.render('user/verifyotp', {
            email: req.session.tempUser.email,
            message: 'Invalid OTP. Please try again.',
        });
    }
};

const resendOtp = (req, res) => {
    try {
        const { email } = req.session.tempUser;

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Send OTP to user's email
        const mailOptions = {
            from: 'grabify75@gmail.com',
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP for email verification is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending OTP email:', error);
                return res.status(500).json({ success: false, message: 'Error sending OTP email' });
            }

            // Store new OTP in session
            req.session.otp = otp;

            res.status(200).json({ success: true, message: 'OTP has been resent to your email.' });
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getLoginPage = (req, res) => {
    res.render('user/login', { message: null });
};

const getRegisterPage = (req, res) => {
    res.render('user/register', { message: null });
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await userSchema.findOne({ email });
        if (!user) {
            return res.render('user/login', {
                message: 'Invalid email or password',
            });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('user/login', {
                message: 'Invalid email or password',
            });
        }

        // Set session
        req.session.user = { id: user._id, username: user.username };

        res.redirect('/user/home');
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/user/home');
    });
};

module.exports = {
    registerUser,
    getLoginPage,
    getRegisterPage,
    loginUser,
    verifyOtp,
    resendOtp, // Add this line
    logoutUser,
};