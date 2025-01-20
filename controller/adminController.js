const adminModel = require('../model/adminModel');
const bcrypt = require('bcrypt');
const userModel = require('../model/userModel');
const cartModel = require('../model/cartModel');
const orderModel = require('../model/orderModel');
const walletModel = require('../model/walletModel'); // Import the wallet model
const wishlistModel = require('../model/wishlistModel'); // Import the wishlist model
const PDFDocument = require('pdfkit');

const loadLogin = async (req, res) => {
    res.render('admin/login');
};

let loadCustomers = async (req, res) => {
    try {
        const admin = req.session.admin;
        if (!admin) return res.redirect('/admin/login');

        const users = await userModel.find({});
        res.render('admin/customers', { users, message: '' });
    } catch (error) {
        console.error(error);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await adminModel.findOne({ email });

        if (!admin) return res.render('admin/login', { message: 'admin not found' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.render('admin/login', { message: 'Invalid credentials' });

        req.session.admin = true;
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.send(error);
    }
};

const loadDashboard = async (req, res) => {
    try {
        const admin = req.session.admin;
        if (!admin) return res.redirect('/admin/login');

        const users = await userModel.find({});
        const conversionRate = 3.72; // Fetch from database
        const conversionRateChange = 23; // Fetch from database
        const addedToCart = 12.92; // Fetch from database
        const addedToCartChange = -5; // Fetch from database
        const reachedCheckout = 5.67; // Fetch from database
        const reachedCheckoutChange = -2; // Fetch from database
        const salesChange = 12.23; // Fetch from database

        // Fetch additional data from cartModel and orderModel
        const totalOrders = await orderModel.countDocuments({});
        console.log("Total Orders:", totalOrders); // Debug line

        const totalSalesAmount = await orderModel.aggregate([
            { $match: { orderStatus: 'Delivered' } },
            { $group: { _id: null, total: { $sum: { $add: ["$grandTotalCost", "$walletDeduction"] } } } }
        ]);
        console.log("Total Sales Amount:", totalSalesAmount); // Debug line

        const totalDiscount = await orderModel.aggregate([
            { $group: { _id: null, total: { $sum: "$couponDeduction" } } }
        ]);
        console.log("Total Discount:", totalDiscount); // Debug line

        const sales = totalSalesAmount.length > 0 ? totalSalesAmount[0].total : 0;
        console.log("Sales:", sales); // Debug line

        // Fetch latest 5 orders
        const latestOrders = await orderModel.find().sort({ orderDate: -1 }).limit(5).populate('userId', 'username');
        console.log("Latest Orders:", latestOrders); // Debug line

        // Fetch top 5 products by unit sold for delivered orders
        const topProducts = await orderModel.aggregate([
            { $match: { orderStatus: 'Delivered' } },
            { $unwind: "$cartData" },
            { $group: { _id: "$cartData.productName", totalSold: { $sum: "$cartData.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);
        console.log("Top Products:", topProducts); // Debug line

        res.render('admin/dashboard', {
            users,
            message: '',
            conversionRate,
            conversionRateChange,
            addedToCart,
            addedToCartChange,
            reachedCheckout,
            reachedCheckoutChange,
            sales,
            salesChange,
            totalOrders,
            totalSalesAmount: sales,
            totalDiscount: totalDiscount.length > 0 ? totalDiscount[0].total : 0,
            latestOrders, // Pass latest orders to the view
            topProducts // Pass top products to the view
        });
    } catch (error) {
        console.error(error);
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete the user
        const user = await userModel.findOneAndDelete({ _id: id });

        if (user) {
            // Delete the cart associated with the user
            await cartModel.deleteMany({ userId: id });

            // Delete the orders associated with the user
            await orderModel.deleteMany({ userId: id });

            // Delete the wallet associated with the user
            await walletModel.deleteMany({ userId: id });

            // Delete the wishlist associated with the user
            await wishlistModel.deleteMany({ userId: id });

            return res.status(200).json({ message: 'User and associated data deleted successfully.' });
        } else {
            return res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

const editUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the user and toggle the isBlock status
        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.isBlock = !user.isBlock; // Toggle the status
        await user.save();

        res.status(200).json({ message: `User status updated to ${user.isBlock ? 'Blocked' : 'Live'}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

const logout = async (req, res) => {
    req.session.admin = null;
    res.redirect('/admin/login');
};

const generateSalesReport = async (period, startDate, endDate) => {
    const match = {};
    if (startDate && endDate) {
        match.orderDate = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }

    const orders = await orderModel.find(match);
    const totalOrders = orders.length;
    const totalSalesAmount = orders.reduce((sum, order) => sum + order.grandTotalCost + order.walletDeduction, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + order.couponDeduction, 0);

    return { totalOrders, totalSalesAmount, totalDiscount };
};

const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await generateSalesReport(null, startDate, endDate);
        const orders = await orderModel.find({
            orderDate: { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) },
            orderStatus: 'Delivered'
        }).populate('userId', 'username');

        const totalSalesAmount = orders.reduce((sum, order) => sum + order.grandTotalCost + order.walletDeduction, 0);

        res.status(200).json({ ...report, orders, totalSalesAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

const downloadSalesReportPDF = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await generateSalesReport(null, startDate, endDate);
        const orders = await orderModel.find({
            orderDate: { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) },
            orderStatus: 'Delivered'
        }).populate('userId', 'username');

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');

        doc.pipe(res);

        doc.fontSize(18).text('Sales Report', { align: 'center' });
        doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('Orders:');
        orders.forEach(order => {
            doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
            doc.text(`User Name: ${order.userId.username}`);
            doc.text(`Items: ${order.cartData.length}`);
            doc.text(`Payment Type: ${order.paymentType}`);
            doc.text(`Total Cost: ₹${order.grandTotalCost}`);
            doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`);
            doc.text(`Status: Delivered`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

module.exports = { 
    loadLogin, 
    login, 
    loadDashboard, 
    loadCustomers, 
    editUserStatus, 
    deleteUser, 
    logout, 
    getSalesReport, 
    downloadSalesReportPDF // Add this line
};
