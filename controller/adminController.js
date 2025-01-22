const adminModel = require('../model/adminModel');
const bcrypt = require('bcrypt');
const userModel = require('../model/userModel');
const cartModel = require('../model/cartModel');
const orderModel = require('../model/orderModel');
const walletModel = require('../model/walletModel'); // Import the wallet model
const wishlistModel = require('../model/wishlistModel'); // Import the wishlist model
const categoryModel = require('../model/categoryModel'); // Import the category model
const productModel = require('../model/productModel'); // Import the product model
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
     
        // Fetch additional data from cartModel and orderModel
        const totalOrders = await orderModel.countDocuments({});
        console.log("Total Orders:", totalOrders); // Debug line

        const totalSalesAmount = await orderModel.aggregate([
            { $match: { orderStatus: 'Delivered' } },
            { $group: { _id: null, total: { $sum: { $add: ["$grandTotalCost", "$walletDeduction"] } } } }
        ]);
        console.log("Total Sales Amount:", totalSalesAmount); // Debug line

        const dOrders = await orderModel.find({ orderStatus: 'Delivered' });
        // console.log("Delivered Orders:", dOrders);
        dOrders.forEach(order => {
            
            console.log("grandTotalCost:", order.grandTotalCost);
            console.log("walletDeduction:", order.walletDeduction);
            console.log("couponDeduction:", order.couponDeduction);
            console.log("nonOfferPrice:", order.nonOfferPrice);
        });

        const totalDiscount = await orderModel.aggregate([
            { $match: { orderStatus: 'Delivered' } },
            { $group: { _id: null, total: { $sum: { $subtract: [
            "$nonOfferPrice",
            { $add: [
                { $ifNull: ["$grandTotalCost", 0] },
                { $ifNull: ["$walletDeduction", 0] },
                //{ $ifNull: ["$couponDeduction", 0] }
            ]}
            ]}}}}
        ]);
        console.log("Total Discount:", totalDiscount); // Debug line

        const sales = totalSalesAmount.length > 0 ? totalSalesAmount[0].total : 0;
        console.log("Sales:", sales); // Debug line

        // Fetch latest 5 orders
        const latestOrders = await orderModel.find().sort({ orderDate: -1 }).limit(5).populate('userId', 'username');
        // console.log("Latest Orders:", latestOrders); // Debug line

        // Fetch top 5 products by unit sold for delivered orders
        const topProducts = await orderModel.aggregate([
            { $match: { orderStatus: 'Delivered' } },
            { $unwind: "$cartData" },
            { $group: { _id: "$cartData.productName", totalSold: { $sum: "$cartData.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);
        console.log("Top Products:", topProducts); // Debug line

        // Fetch all delivered orders
        const deliveredOrders = await orderModel.find({ orderStatus: 'Delivered' }).populate('cartData.variantId');

        // Map product IDs to their respective categories
        const categorySalesMap = new Map();
        for (const order of deliveredOrders) {
            for (const item of order.cartData) {
                const product = await productModel.findById(item.variantId.productId).populate('categoryid');
                const categoryName = product.categoryid.categoryName;
                if (categorySalesMap.has(categoryName)) {
                    categorySalesMap.set(categoryName, categorySalesMap.get(categoryName) + item.quantity);
                } else {
                    categorySalesMap.set(categoryName, item.quantity);
                }
            }
        }

        // Convert the map to an array and sort by totalSold
        const topCategories = Array.from(categorySalesMap, ([categoryName, totalSold]) => ({ categoryName, totalSold }))
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 5);

        console.log("Top Categories:", topCategories); // Debug line

        const ordersDelivered = await orderModel.countDocuments({ orderStatus: 'Delivered' });

        res.render('admin/dashboard', {
            users,
            message: '',
            conversionRate,
            conversionRateChange,
            addedToCart,
            addedToCartChange,
            sales,
            totalOrders,
            totalSalesAmount: sales,
            totalDiscount: totalDiscount.length > 0 ? totalDiscount[0].total : 0,
            latestOrders, // Pass latest orders to the view
            topProducts, // Pass top products to the view
            topCategories, // Pass top categories to the view
            ordersDelivered // Pass orders delivered to the view
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
        match.deliveryDate = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
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
            deliveryDate: { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) },
            orderStatus: 'Delivered'
        }).populate('userId', 'username');

        const totalSalesAmount = orders.reduce((sum, order) => sum + order.grandTotalCost + order.walletDeduction, 0);
        const ordersDelivered = orders.length;

        res.status(200).json({ ...report, orders, totalSalesAmount, ordersDelivered });
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
            deliveryDate: { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) },
            orderStatus: 'Delivered'
        }).populate('userId', 'username');

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 30 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');

        doc.pipe(res);

        // Header Section
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Report Type: Monthly`, { align: 'left' });
        doc.text(`Sales Report Period: ${startDate} to ${endDate}`);
        doc.text(`Total Sales Count: ${orders.length}`);
        doc.text(`Overall Order Amount: ₹${report.totalAmount}`);
        doc.text(`Total Coupon Deductions: ₹${report.totalCouponDeductions}`);
        doc.moveDown(2);

        // Table Header
        doc.fontSize(14).text('Order Details', { underline: true });
        doc.moveDown();

        const tableHeader = ["Order ID", "Customer", "Total Price", "Created At"];
        const tableColumnWidths = [80, 150, 100, 150];

        // Draw table header
        let cursorY = doc.y;
        tableHeader.forEach((header, i) => {
            doc.fontSize(12).font('Helvetica-Bold').text(header, 50 + tableColumnWidths.slice(0, i).reduce((a, b) => a + b, 0), cursorY, { width: tableColumnWidths[i], align: 'center' });
        });

        // Draw a horizontal line below header
        doc.moveTo(50, cursorY + 15).lineTo(550, cursorY + 15).stroke();
        doc.moveDown();

        // Draw table rows
        orders.forEach(order => {
            cursorY = doc.y;
            const orderDetails = [
                order.orderNumber,
                order.userId.username,
                `₹${order.grandTotalCost}`,
                new Date(order.deliveryDate).toLocaleString()
            ];

            orderDetails.forEach((detail, i) => {
                doc.fontSize(10).font('Helvetica').text(detail, 50 + tableColumnWidths.slice(0, i).reduce((a, b) => a + b, 0), cursorY, { width: tableColumnWidths[i], align: 'center' });
            });

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
