const mongoose = require('mongoose');
const User = require('../model/userModel'); // Import the User model
const Order = require('../model/orderModel'); // Import the Order model
const PDFDocument = require('pdfkit'); // Import PDFKit for generating PDFs
const stream = require('stream');

const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('cartData.variantId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const doc = new PDFDocument({ margin: 50 });
        const invoiceStream = new stream.PassThrough();
        doc.pipe(invoiceStream);

        // Set font
        doc.font('Helvetica');

        // Add logo on the left side
        doc.image('public/assets/grabifylogo.png', 50, 45, { width: 50 });

        // Company details on the right side
        doc.fontSize(20).fillColor('#333').text('Grabify', 110, 45, { align: 'right' });
        doc.moveDown(2);
       
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#666').text('Address: 4th Main Street, Bengaluru, Karnataka, 560077', 110, 85, { align: 'right' });
        doc.moveDown(1);
        doc.text('Email: support@grabify.com | Phone: (123) 456-7890', 110, 95, { align: 'right' });
        doc.moveDown(2);

        // Invoice and Order Details on the same line
        doc.fontSize(16).fillColor('#333').text('Invoice', 50, 140);
        doc.fontSize(16).fillColor('#333').text('Order Details:', 400, 140);
        doc.moveDown();

        // Invoice Details
        doc.fontSize(12).fillColor('#000').text(`Invoice Number: ${order.orderNumber}`, 50, 160);
        doc.text(`Date: ${order.orderDate.toLocaleString()}`, 50, 175);
        doc.text(`Payment Method: ${order.paymentType}`, 50, 190);
        doc.text(`Payment Status: ${order.paymentStatus || 'Pending'}`, 50, 205);
        doc.moveDown(2);

        // Billing Address
        if (order.addressChosen) {
            const address = user.addresses.id(order.addressChosen);
            if (address) {
                doc.fontSize(12).fillColor('#333').text('Billing Details:', 400, 160);
                doc.fontSize(10).fillColor('#000').text(`Name: ${address.firstName} ${address.lastName}`, 400, 175);
                doc.text(`Phone: ${address.number}`, 400, 190);
                doc.text(`Address: ${address.street}`, 400, 205);
                doc.text(`City: ${address.city}`, 400, 220);
                doc.text(`State: ${address.state}`, 400, 235);
                doc.text(`Postal Code: ${address.pincode}`, 400, 250);
                doc.text(`Country: ${address.country}`, 400, 265);
                doc.moveDown(2);
            }
        }

        // Table Headers
        const tableTop = doc.y;
        const slNoWidth = 30;
        const itemWidth = 120;
        const variantWidth = 80;
        const sizeWidth = 50;
        const quantityWidth = 50;
        const priceWidth = 80;
        const totalWidth = 100;

        // Table Headers with background color
        doc.rect(50, tableTop, 530, 20).fill('#f2f2f2').stroke();
        doc.fillColor('#000').fontSize(12).text('No', 55, tableTop + 5, { width: slNoWidth, align: 'center' });
        doc.text('Product', 85, tableTop + 5, { width: itemWidth, align: 'center' });
        doc.text('Variant', 205, tableTop + 5, { width: variantWidth, align: 'center' });
        doc.text('Size', 285, tableTop + 5, { width: sizeWidth, align: 'center' });
        doc.text('Quantity', 335, tableTop + 5, { width: quantityWidth, align: 'center' });
        doc.text('Price', 385, tableTop + 5, { width: priceWidth, align: 'center' });
        doc.text('Total Cost(Rs)', 465, tableTop + 5, { width: totalWidth, align: 'center' });

        // Draw table borders
        doc.moveTo(50, tableTop + 20)
            .lineTo(580, tableTop + 20)
            .stroke();

        // Vertical lines for table headers
        doc.moveTo(85, tableTop).lineTo(85, tableTop + 20).stroke();
        doc.moveTo(205, tableTop).lineTo(205, tableTop + 20).stroke();
        doc.moveTo(285, tableTop).lineTo(285, tableTop + 20).stroke();
        doc.moveTo(335, tableTop).lineTo(335, tableTop + 20).stroke();
        doc.moveTo(385, tableTop).lineTo(385, tableTop + 20).stroke();
        doc.moveTo(465, tableTop).lineTo(465, tableTop + 20).stroke();

        // Table Content
        let position = tableTop + 25;
        order.cartData.forEach((item, index) => {
            const isEvenRow = index % 2 === 0;
            const rowColor = isEvenRow ? '#f9f9f9' : '#ffffff';
            doc.rect(50, position, 530, 20).fill(rowColor).stroke();
            doc.fillColor('#000').fontSize(10).text((index + 1).toString(), 55, position + 5, { width: slNoWidth, align: 'center' });
            doc.text(item.productName, 85, position + 5, { width: itemWidth, align: 'center' });
            doc.text(item.variantColor, 205, position + 5, { width: variantWidth, align: 'center' });
            doc.text(item.size, 285, position + 5, { width: sizeWidth, align: 'center' });
            doc.text(item.quantity.toString(), 335, position + 5, { width: quantityWidth, align: 'center' });
            doc.text(`Rs ${item.price}`, 385, position + 5, { width: priceWidth, align: 'center' });
            doc.text(`Rs ${item.price * item.quantity}`, 465, position + 5, { width: totalWidth, align: 'center' });

            // Vertical lines for table content
            doc.moveTo(85, position).lineTo(85, position + 20).stroke();
            doc.moveTo(205, position).lineTo(205, position + 20).stroke();
            doc.moveTo(285, position).lineTo(285, position + 20).stroke();
            doc.moveTo(335, position).lineTo(335, position + 20).stroke();
            doc.moveTo(385, position).lineTo(385, position + 20).stroke();
            doc.moveTo(465, position).lineTo(465, position + 20).stroke();

            position += 20;
        });

        // Draw table borders
        doc.moveTo(50, position)
            .lineTo(580, position)
            .stroke();

        // Coupon and Total Price as part of table
        const coupon = order.couponDeduction || 0;
        const walletDeduction = order.walletDeduction || 0;
        const nonOfferPrice= order.nonOfferPrice|| 0;
        const grandTotalCost= order.grandTotalCost|| 0;
        
        
        const discountedPrice = order.grandTotalCost ;

        doc.rect(50, position, 530, 20).fill('#f9f9f9').stroke();
        doc.fillColor('#000').fontSize(10).text('Coupon Deduction', 85, position + 5, { width: itemWidth + variantWidth + sizeWidth + quantityWidth, align: 'center' });
        doc.text(`${coupon}`, 465, position + 5, { width: totalWidth, align: 'center' });

        position += 20;

        doc.rect(50, position, 530, 20).fill('#ffffff').stroke();
        doc.fillColor('#000').fontSize(10).text('Offer Deduction', 85, position + 5, { width: itemWidth + variantWidth + sizeWidth + quantityWidth, align: 'center' });
        doc.text(`${nonOfferPrice-grandTotalCost-walletDeduction}`, 465, position + 5, { width: totalWidth, align: 'center' });

        position += 20;

        doc.rect(50, position, 530, 20).fill('#f9f9f9').stroke();
        doc.fillColor('#000').fontSize(10).text('Total Price', 85, position + 5, { width: itemWidth + variantWidth + sizeWidth + quantityWidth, align: 'center' });
        doc.text(` ${discountedPrice+walletDeduction}`, 465, position + 5, { width: totalWidth, align: 'center' });

        doc.moveDown(2);

        // Footer
        doc.fontSize(12).fillColor('#333').text('Thank you for shopping with us!', { align: 'center' });

        // Finalize the PDF
        doc.end();

        // Set Response Headers
        res.setHeader('Content-disposition', `attachment; filename=invoice_${order.orderNumber}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        invoiceStream.pipe(res);
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ message: 'Error generating invoice', error });
    }
};

module.exports = {
    downloadInvoice // Ensure this function is exported
};