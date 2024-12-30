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

const getMyAddress = (req, res) => {
    if (req.user) {
        res.render('user/myAddress', {
            username: req.user.username
        });
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

module.exports = {
    getMyAccount,
    getMyAddress,
    getAddAddress,
    postAddAddress,
};
