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
module.exports = {
    getMyAccount,
    getMyAddress,
};

