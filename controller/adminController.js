const adminModel = require('../model/adminModel');
const bcrypt = require('bcrypt');
const userModel = require('../model/userModel');
const cartModel = require('../model/cartModel');
const orderModel = require('../model/orderModel');
const walletModel = require('../model/walletModel'); // Import the wallet model
const wishlistModel = require('../model/wishlistModel'); // Import the wishlist model
const categoryModel = require('../model/categoryModel'); // Import the category model
const productModel = require('../model/productModel'); // Import the product model
const ExcelJS = require('exceljs'); // Import ExcelJS
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

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
      
    
     
        // Fetch additional data from cartModel and orderModel
        const totalOrders = await orderModel.countDocuments({});
        console.log("Total Orders:", totalOrders); // Debug line

        const totalSalesAmount = await orderModel.aggregate([
            { $match: { orderStatus: 'Delivered' } },
            { $group: { _id: null, total: { $sum: { $add: ["$grandTotalCost", "$walletDeduction"] } } } }
        ]);
        console.log("Total Sales Amount:", totalSalesAmount); // Debug line

        // const dOrders = await orderModel.find({ orderStatus: 'Delivered' });
        // // console.log("Delivered Orders:", dOrders);
        // dOrders.forEach(order => {
            
        //     console.log("grandTotalCost:", order.grandTotalCost);
        //     console.log("walletDeduction:", order.walletDeduction);
        //     console.log("couponDeduction:", order.couponDeduction);
        //     console.log("nonOfferPrice:", order.nonOfferPrice);
        // });

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
        const latestOrders = await orderModel.find().sort({ orderDate: -1 }).limit(8).populate('userId', 'username');
        // console.log("Latest Orders:", latestOrders); // Debug line

        // Fetch top 5 products by unit sold for delivered orders
        const topProducts = await orderModel.aggregate([
            { $match: { orderStatus: 'Delivered' } },
            { $unwind: "$cartData" },
            { $group: { _id: "$cartData.productName", totalSold: { $sum: "$cartData.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5}
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
        const pendingOrders = await orderModel.countDocuments({ orderStatus: { $nin: ['Delivered', 'Cancelled'] } });

        res.render('admin/dashboard', {
            users,
            message: '',
            sales,
            totalOrders,
            pendingOrders,
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
    const match = { orderStatus: 'Delivered' }; // Only include delivered orders
    if (startDate && endDate) {
        match.deliveryDate = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }

    const orders = await orderModel.find(match).sort({ deliveryDate: -1 }); // Sort by deliveryDate in descending order
    const totalOrders = orders.length;
    const totalSalesAmount = orders.reduce((sum, order) => sum + order.grandTotalCost + order.walletDeduction, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + (order.nonOfferPrice - (order.grandTotalCost + order.walletDeduction)), 0);

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

const downloadReport = async (req, res) => {
    const { format } = req.params;
    const { startDate, endDate } = req.query;

    try {
        if (!startDate || !endDate) {
            return res.status(400).send('Start date and end date are required');
        }

        const orders = await orderModel.find({
            deliveryDate: { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) },
            orderStatus: 'Delivered'
        }).sort({ deliveryDate: -1 }).populate('userId', 'username'); // Sort by deliveryDate in descending order

        const totalSalesCount = orders.length;
        const overallOrderAmount = orders.reduce((sum, order) => sum + order.grandTotalCost + order.walletDeduction, 0);
        const totalCouponDeductions = orders.reduce((sum, order) => sum + order.couponDeduction, 0);

        const reportsDir = path.join(__dirname, '..', 'public', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30 });
            const filePath = path.join(reportsDir, 'salesReport.pdf');
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            doc.fontSize(18).text(`Sales Report`, { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(10).text(`Sales Report from: ${new Date(startDate).toLocaleDateString('en-GB')} to ${new Date(endDate).toLocaleDateString('en-GB')}`, { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(10).text(`Total Sales Count: ${totalSalesCount}`, { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(10).text(`Overall Order Amount: Rs ${overallOrderAmount.toFixed(2)}`, { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(10).text(`Total Coupon Deductions: Rs ${totalCouponDeductions.toFixed(2)}`, { align: 'center' });
            doc.moveDown(2);

            const headerHeight = 18;
            const startY = doc.y; // Store the initial y position
            
            const headers = [
                { x: 50, width: 50, text: 'Sl. No' },
                { x: 100, width: 150, text: 'Order ID' },
                { x: 250, width: 100, text: 'Date (dd-mm-yyyy)' },
                { x: 350, width: 150, text: 'Customer ID' },
                { x: 500, width: 100, text: 'Total Amount (Rs)' }
            ];
            
            // Draw header background
            headers.forEach(({ x, width }) => {
                doc.rect(x, startY, width, headerHeight).fill('#3D464D');
            });
            
            // Add text (keeping y position fixed)
            doc.fontSize(8).fillColor('white');
            headers.forEach(({ x, width, text }) => {
                doc.text(text, x, startY + 5, { width, align: 'center' });
            });
            
            doc.moveDown(1); 
            orders.forEach((order, index) => {
                const yPosition = doc.y + 3;
                const rowHeight = 18;

                doc.rect(50, yPosition, 50, rowHeight).stroke();
                doc.rect(120, yPosition, 150, rowHeight).stroke();
                doc.rect(270, yPosition, 100, rowHeight).stroke();
                doc.rect(380, yPosition, 100, rowHeight).stroke();
                doc.rect(490, yPosition, 100, rowHeight).stroke();

                doc.fontSize(8).fillColor('black')
                    .text(index + 1, 50, yPosition + 5, { width: 50, align: 'center' })
                    .text(order.orderNumber, 120, yPosition + 5, { width: 150, align: 'center' })
                    .text(new Date(order.deliveryDate).toLocaleDateString('en-GB'), 270, yPosition + 5, { width: 100, align: 'center' })
                    .text(order.userId.username, 380, yPosition + 5, { width: 100, align: 'center' })
                    .text(order.grandTotalCost, 490, yPosition + 5, { width: 100, align: 'center' });

                doc.moveDown(1);
            });

            doc.end();

            stream.on('finish', () => {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="SalesReport.pdf"');
                res.sendFile(filePath, (err) => {
                    if (err) {
                        console.error('Error downloading PDF:', err);
                        return res.status(500).send('Error downloading file');
                    }

                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Error cleaning up PDF file:', err);
                    });
                });
            });
        } else if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

            worksheet.columns = [
                { header: 'Sl. No', key: 'sl_no', width: 10 },
                { header: 'Order ID', key: 'orderId', width: 30 },
                { header: 'Date (dd-mm-yyyy)', key: 'date', width: 20 },
                { header: 'Customer ID', key: 'userId', width: 20 },
                { header: 'Total Amount (₹)', key: 'totalAmount', width: 20 },
            ];

           

            worksheet.addRow({}); // Empty row for spacing

            orders.forEach((order, index) => {
                worksheet.addRow({
                    sl_no: index + 1,
                    orderId: order.orderNumber,
                    date: new Date(order.deliveryDate).toLocaleDateString('en-GB'),
                    userId: order.userId.username,
                    totalAmount: order.grandTotalCost,
                });
            });
            worksheet.addRow({
                sl_no: '',
                orderId: `Sales Report from: ${new Date(startDate).toLocaleDateString('en-GB')} to ${new Date(endDate).toLocaleDateString('en-GB')}`,
                date: '',
                userId: '',
                totalAmount: ''
            });

            worksheet.addRow({
                sl_no: '',
                orderId: `Total Sales Count: ${totalSalesCount}`,
                date: '',
                userId: '',
                totalAmount: ''
            });

            worksheet.addRow({
                sl_no: '',
                orderId: `Overall Order Amount: ₹${overallOrderAmount.toFixed(2)}`,
                date: '',
                userId: '',
                totalAmount: ''
            });

            worksheet.addRow({
                sl_no: '',
                orderId: `Total Coupon & Offer  Deductions: ₹${totalCouponDeductions.toFixed(2)}`,
                date: '',
                userId: '',
                totalAmount: ''
            });

            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
            });

            const filePath = path.join(reportsDir, 'salesReport.xlsx');
            await workbook.xlsx.writeFile(filePath);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="SalesReport.xlsx"');
            res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error downloading Excel:', err);
                    return res.status(500).send('Error downloading file');
                }

                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error cleaning up Excel file:', err);
                });
            });
        } else {
            return res.status(400).send('Invalid format');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).send('Internal Server Error');
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
    downloadReport // Update this line
};
