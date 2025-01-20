const User = require('../model/userModel');
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const saltround = 10;

// ...existing code...

const getMyAccount = (req, res) => {
    if (req.user) {
        res.render('user/myaccount', {
            username: req.user.username
        });
    } else {
        res.redirect('/user/login');
    }
};

const getMyAddress = async (req, res) => {
    if (req.user) {
        try {
            const user = await User.findById(req.user._id);
            if (user) {
                res.render('user/myAddress', {
                    username: req.user.username,
                    addresses: user.addresses
                });
            } else {
                res.redirect('/user/login');
            }
        } catch (err) {
            console.error('Error fetching addresses:', err);
            res.redirect('/user/myaccount');
        }
    } else {
        res.redirect('/user/login');
    }
};

const getAddAddress = (req, res) => {
    if (req.user) {
        res.render('user/addAddress', {
            username: req.user.username
        });
    } else {
        res.redirect('/user/login');
    }
};

const postAddAddress = async (req, res) => {
    if (req.user) {
        try {
            const user = await User.findById(req.user._id);
            if (user) {
                const existingAlias = user.addresses.find(address => address.addressAlias === req.body.addressAlias);
                if (existingAlias) {
                    return res.status(400).json({ message: 'Address alias must be unique.' });
                }
                user.addresses.push({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    company: req.body.company,
                    street: req.body.street,
                    addressLine2: req.body.addressLine2,
                    city: req.body.city,
                    state: req.body.state,
                    country: req.body.country,
                    pincode: req.body.pincode,
                    additionalInformation: req.body.additionalInformation,
                    number: req.body.number,
                    addressAlias: req.body.addressAlias
                });
                await user.save();
                res.redirect('/user/myAddress');
            } else {
                res.redirect('/user/login');
            }
        } catch (err) {
            console.error('Error adding address:', err);
            res.redirect('/user/addAddress');
        }
    } else {
        res.redirect('/user/login');
    }
};

const getEditAddress = async (req, res) => {
    if (req.user) {
        try {
            const user = await User.findById(req.user._id);
            const address = user.addresses.id(req.params.addressId);
            if (address) {
                res.render('user/editAddress', {
                    username: req.user.username,
                    address: address
                });
            } else {
                res.redirect('/user/myAddress');
            }
        } catch (err) {
            console.error('Error fetching address:', err);
            res.redirect('/user/myAddress');
        }
    } else {
        res.redirect('/user/login');
    }
};

const postEditAddress = async (req, res) => {
    if (req.user) {
        try {
            const user = await User.findById(req.user._id);
            const address = user.addresses.id(req.params.addressId);
            if (address) {
                const existingAlias = user.addresses.find(addr => addr.addressAlias === req.body.addressAlias && addr._id.toString() !== req.params.addressId);
                if (existingAlias) {
                    return res.status(400).json({ message: 'Address alias must be unique.' });
                }
                address.firstName = req.body.firstName;
                address.lastName = req.body.lastName;
                address.company = req.body.company;
                address.street = req.body.street;
                address.addressLine2 = req.body.addressLine2;
                address.city = req.body.city;
                address.state = req.body.state;
                address.country = req.body.country;
                address.pincode = req.body.pincode;
                address.additionalInformation = req.body.additionalInformation;
                address.number = req.body.number;
                address.addressAlias = req.body.addressAlias;
                await user.save();
                res.redirect('/user/myAddress');
            } else {
                res.redirect('/user/myAddress');
            }
        } catch (err) {
            console.error('Error editing address:', err);
            res.redirect('/user/myAddress');
        }
    } else {
        res.redirect('/user/login');
    }
};

const deleteAddress = async (req, res) => {
    if (req.user) {
        try {
            const user = await User.findById(req.user._id);
            if (user) {
                user.addresses = user.addresses.filter(address => address._id.toString() !== req.params.addressId);
                await user.save();
                res.redirect('/user/myAddress');
            } else {
                res.redirect('/user/login');
            }
        } catch (err) {
            console.error('Error deleting address:', err);
            res.redirect('/user/myAddress');
        }
    } else {
        res.redirect('/user/login');
    }
};


const userInformation = (req, res) => {
    if (req.user) {
        res.render('user/userInformation', {
            title: 'User Information',
            user: req.user,
            username: req.user.username // Pass the username to the view
        });
    } else {
        res.redirect('/user/login');
    }
};

const editUserInformation = (req, res) => {
    if (req.user) {
        res.render('user/editUserInformation', {
            title: 'Edit User Information',
            user: req.user,
            username: req.user.username // Pass the username to the view
        });
    } else {
        res.redirect('/user/login');
    }
};

const updateUserInformation = async (req, res) => {
    if (req.user) {
        const { username, phone,  InputPasswordNew, InputPasswordNewConfirm, InputOTP } = req.body;
        let errors = [];

       

        try {
            const user = await User.findById(req.user._id);

          

            if (InputOTP !== req.session.otp) {
                errors.push('Invalid OTP.');
            }

            if (errors.length > 0) {
                return res.status(400).json({ errors });
            }

            user.username = username;
            user.phoneNumber = phone; // Ensure phone number is updated

            if (InputPasswordNew) {
                user.password = await bcrypt.hash(InputPasswordNew, 10);
            }

            await user.save();
            req.session.otp = null; // Clear the OTP after successful verification
            res.status(200).json({ message: 'Your details have been updated successfully!' });
        } catch (err) {
            console.error('Error updating user information:', err);
            res.status(500).json({ message: 'Error updating user information' });
        }
    } else {
        res.redirect('/user/login');
    }
};
const sendOTP = (req, res) => {
    if (req.user) {
        const otp = crypto.randomInt(100000, 999999).toString(); // Generate OTP using crypto
        req.session.otp = otp;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.APP_PASSWORD
            }
        });

        const mailOptions = {
            from: 'your-email@gmail.com',
            to: req.user.email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending OTP:', error);
                res.status(500).send('Error sending OTP');
            } else {
                res.status(200).send('OTP sent successfully');
            }
        });
    } else {
        res.redirect('/user/login');
    }
};



module.exports = {
    getMyAccount,
    getMyAddress,
    getAddAddress,
    postAddAddress,
    getEditAddress,
    postEditAddress,
    deleteAddress,
    userInformation,
    editUserInformation,
    updateUserInformation,
    sendOTP,
};
