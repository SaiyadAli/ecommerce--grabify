const User = require('../model/userModel');

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

module.exports = {
    getMyAccount,
    getMyAddress,
    getAddAddress,
    postAddAddress,
    getEditAddress,
    postEditAddress,
    deleteAddress,
};