const Wallet = require('../model/walletModel');

const viewWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        res.render('user/wallet', { wallet, username: req.user.username });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ message: 'Error fetching wallet', error });
    }
};

module.exports = {
    viewWallet
};
