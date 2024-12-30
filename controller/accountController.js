// ...existing code...
exports.getMyAccount = (req, res) => {
    if (req.user) {
        res.render('user/myaccount', {
            username: req.user.username
        });
    } else {
        res.redirect('/user/login');
    }
};
// ...existing code...
