const Wallet = require('../model/walletModel');

const viewWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            // Create a new wallet if it doesn't exist
            wallet = new Wallet({
                userId: req.user._id,
                walletBalance: 0,
                walletTransaction: []
            });
            await wallet.save();
        }
        const page = parseInt(req.query.page) || 1;
        res.render('user/wallet', { wallet, username: req.user.username, page });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ message: 'Error fetching wallet', error });
    }
};

module.exports = {
    viewWallet
};
