import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import PDFDocument from 'pdfkit';

// Create Invoice
export const createInvoice = async (req, res) => {
    try {
        const { orderId, orderNumber, subtotal, total, tax } = req.body;

        const invoiceCount = await Invoice.countDocuments();
        const invoice_id = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

        const newInvoice = new Invoice({
            invoice_id,
            order_id: orderId,
            amount: subtotal || 0,
            tax: tax || 0,
            total: total || 0,
            date: new Date()
        });

        await newInvoice.save();

        res.status(201).json(newInvoice);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Invoices
export const getInvoices = async (req, res) => {
    try {
        let query = {};

        // If client, only show their invoices
        if (req.user.role === 'client') {
            const clientOrders = await Order.find({ user_id: req.user._id }).select('_id');
            const clientOrderIds = clientOrders.map(o => o._id);
            query.order_id = { $in: clientOrderIds };
        }

        const invoices = await Invoice.find(query)
            .populate({
                path: 'order_id',
                populate: [
                    { path: 'company_id' },
                    { path: 'user_id', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 });

        // Format exactly how the frontend expects it
        const formatted = invoices.map(inv => ({
            _id: inv._id,
            invoiceId: inv.invoice_id,
            orderNumber: inv.order_id ? inv.order_id.order_id : 'UNKNOWN',
            clientName: inv.order_id ? (inv.order_id.company_id?.name || inv.order_id.user_id?.name || 'Unknown Client') : 'Unknown',
            total: inv.total,
            status: 'Paid',
            createdAt: inv.createdAt
        }));
        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Number to words helper function
const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
};

// Generate and Stream PDF
export const generateInvoicePDF = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate({
            path: 'order_id',
            populate: [
                { path: 'company_id' },
                { path: 'user_id' }
            ]
        });

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Security check for clients
        if (req.user.role === 'client') {
            const orderUserId = invoice.order_id?.user_id?._id || invoice.order_id?.user_id;
            if (!invoice.order_id || !orderUserId || orderUserId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this invoice' });
            }
        }

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_id}.pdf"`);

        doc.pipe(res);

        // --- Document Layout & Borders ---
        const startX = 30;
        const endX = 565;
        const startY = 30;
        const endY = 810;

        // Draw Outer Border
        doc.rect(startX, startY, endX - startX, endY - startY).stroke();

        // --- Header Section (Grid Style) ---
        // Add Logo (Top Left)
        try {
            const logoPath = 'd:\\VMS__final-main\\client\\public\\assets\\logo.png';
            doc.image(logoPath, startX + 5, startY + 5, { width: 45 });
        } catch (err) {
            console.error('Logo not found, skipping image');
        }

        // Logo & Name Block (Top Left Offset)
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#000').text('V.M.S GARMENTS', startX + 60, startY + 5);

        // Address Block (Below Name)
        doc.font('Helvetica').fontSize(8).text('8/514-B, Sedapalayam Road, Arulpuram,', startX + 60, startY + 30);
        doc.text('Karaipudur (PO), Tirupur - 641 605.', startX + 60, startY + 40);

        // Contact Block (Top Right)
        doc.font('Helvetica-Bold').fontSize(8).text('Mob : 98430 82511', 410, startY + 5);
        doc.font('Helvetica').fontSize(7).text('E-mail : vmsgarments1981@gmail.com', 410, startY + 15);
        doc.font('Helvetica-Bold').fontSize(8).text('GSTIN: 33BCVPM6343J1Z3', 410, startY + 25);

        // Header Lines
        doc.moveTo(startX, startY + 55).lineTo(endX, startY + 55).stroke();

        // Invoice No & Date Row
        doc.fontSize(9).text('Invoice No.', startX + 5, startY + 62);
        doc.fontSize(12).text(invoice.invoice_id?.replace('INV-', '') || '070', startX + 70, startY + 60);

        // Tax Invoice Box (Center)
        doc.rect(250, startY + 55, 120, 25).stroke();
        doc.font('Helvetica-Bold').fontSize(10).text('TAX INVOICE', 250, startY + 62, { width: 120, align: 'center' });

        doc.font('Helvetica').fontSize(9).text('Invoice Date :', 380, startY + 62);
        doc.font('Helvetica-Bold').text(new Date(invoice.date).toLocaleDateString('en-GB'), 470, startY + 62);

        doc.moveTo(startX, startY + 80).lineTo(endX, startY + 80).stroke();

        // State & Code Row
        doc.font('Helvetica').fontSize(9).text('State : TAMILNADU', startX + 5, startY + 86);
        doc.text('Code : 33', startX + 5, startY + 104);

        doc.moveTo(310, startY + 80).lineTo(310, startY + 130).stroke(); // Vertical divider

        doc.text(`Transportation Mode: Truck`, 315, startY + 86);
        doc.text(`Vehicle Number      : TN36 AK 8086`, 315, startY + 104);
        doc.text(`Place of Supply     : 33BCVPM6343J1Z3`, 315, startY + 118);

        doc.moveTo(startX, startY + 130).lineTo(endX, startY + 130).stroke();

        // --- To, M/s (Consignee) ---
        const clientCompany = invoice.order_id?.company_id?.name || '';
        const clientName = invoice.order_id?.user_id?.name || 'Valued Client';
        const clientGST = '33AADCS8200N1ZB'; 

        doc.font('Helvetica').text('To, M/s.', startX + 5, startY + 135);
        doc.font('Helvetica-Bold').fontSize(11).text(clientCompany || clientName, startX + 50, startY + 135);

        doc.font('Helvetica').fontSize(9).text("Party's GSTIN :", startX + 5, startY + 175);
        doc.font('Helvetica-Bold').text(clientGST, startX + 80, startY + 175);
        doc.font('Helvetica').text('State : Tamilnadu', 400, startY + 175);
        doc.text('Code : 33', 510, startY + 175);

        doc.moveTo(startX, startY + 195).lineTo(endX, startY + 195).stroke();

        // --- Table Section ---
        const tableY = startY + 195;
        const tableBottom = endY - 140;

        // Column Headers
        doc.font('Helvetica-Bold').fontSize(8);
        const colMap = [
            { x: startX, w: 25, t: 'S.\nNo.' },
            { x: startX + 25, w: 35, t: 'DC No.' },
            { x: startX + 60, w: 240, t: 'Description of Goods' },
            { x: startX + 300, w: 50, t: 'HSN CODE' },
            { x: startX + 350, w: 50, t: 'Qty.' },
            { x: startX + 400, w: 60, t: 'Rate\nRs.   P.' },
            { x: startX + 460, w: 75, t: 'Amount\nRs.      P.' }
        ];

        colMap.forEach((c, i) => {
            doc.text(c.t, c.x, tableY + 5, { width: c.w, align: 'center' });
            if (i > 0) doc.moveTo(c.x, tableY).lineTo(c.x, tableBottom).stroke();
        });

        doc.moveTo(startX, tableY + 30).lineTo(endX, tableY + 30).stroke();

        // Table Content
        const order = invoice.order_id;
        const qty = order?.quantity || 0;
        const rate = (invoice.amount / qty) || 0;
        const amount = invoice.amount || 0;

        doc.font('Helvetica').fontSize(10);
        doc.text('1', colMap[0].x, tableY + 40, { width: colMap[0].w, align: 'center' });
        doc.text(order?.product_name || 'Goods', colMap[2].x + 10, tableY + 40, { width: colMap[2].w - 20 });
        doc.text('6109', colMap[3].x, tableY + 40, { width: colMap[3].w, align: 'center' });
        doc.text(qty.toString(), colMap[4].x, tableY + 40, { width: colMap[4].w, align: 'center' });

        // Rate Rs P
        doc.text(Math.floor(rate).toString(), colMap[5].x + 5, tableY + 40, { width: 30, align: 'right' });
        doc.text((rate % 1).toFixed(2).split('.')[1], colMap[5].x + 38, tableY + 40);

        // Amount Rs P
        doc.text(Math.floor(amount).toLocaleString(), colMap[6].x + 5, tableY + 40, { width: 45, align: 'right' });
        doc.text((amount % 1).toFixed(2).split('.')[1], colMap[6].x + 55, tableY + 40);

        // --- Bottom Summary ---
        doc.moveTo(startX, tableBottom).lineTo(endX, tableBottom).stroke();

        const subtotal = amount;
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        const grandTotal = subtotal + cgst + sgst;

        // Left Bottom (Rupees in words & Bank Details)
        doc.font('Helvetica').fontSize(8).text('Rupees', startX + 5, tableBottom + 12);
        const words = numberToWords(Math.round(grandTotal));
        doc.font('Helvetica-Bold').fontSize(10).text(`${words} Rupees only`, startX + 50, tableBottom + 11);

        doc.moveTo(startX, tableBottom + 45).lineTo(410, tableBottom + 45).stroke();

        doc.font('Helvetica-Bold').fontSize(8).text('Name of the Account Holder: V.M.S GARMENTS', startX + 5, tableBottom + 55);
        doc.font('Helvetica').text('Name of the Bank          : AXIS BANK', startX + 5, tableBottom + 65);
        doc.text('Bank Account Number       : 922030044486398', startX + 5, tableBottom + 75);
        doc.text('Bank Branch IFSC          : UTIB0001205', startX + 5, tableBottom + 85);

        doc.moveTo(startX, tableBottom + 105).lineTo(410, tableBottom + 105).stroke();
        doc.font('Helvetica-Oblique').fontSize(8).text("Receiver's Signature", startX + 110, tableBottom + 112);

        // Right Bottom (Totals)
        doc.moveTo(410, tableBottom).lineTo(410, endY).stroke();

        let totalY = tableBottom + 5;
        doc.font('Helvetica-Bold').fontSize(9).text('TOTAL', 415, totalY);
        doc.text(Math.floor(subtotal).toLocaleString(), 495, totalY, { width: 45, align: 'right' });
        doc.text('00', 545, totalY);

        totalY += 20;
        doc.font('Helvetica').fontSize(9).text('Add : CGST 2.5%', 415, totalY);
        doc.text(Math.floor(cgst).toLocaleString(), 495, totalY, { width: 45, align: 'right' });
        doc.text('00', 545, totalY);

        totalY += 20;
        doc.text('Add : SGST 2.5%', 415, totalY);
        doc.text(Math.floor(sgst).toLocaleString(), 495, totalY, { width: 45, align: 'right' });
        doc.text('00', 545, totalY);

        doc.moveTo(410, totalY + 15).lineTo(endX, totalY + 15).stroke();

        totalY += 25;
        doc.text('Round Off', 415, totalY);
        doc.text('00', 545, totalY);

        doc.moveTo(410, totalY + 15).lineTo(endX, totalY + 15).stroke();

        totalY += 25;
        doc.font('Helvetica-Bold').fontSize(11).text('GRAND TOTAL', 415, totalY - 2);
        doc.text(Math.floor(grandTotal).toLocaleString(), 495, totalY, { width: 45, align: 'right' });
        doc.text('00', 545, totalY);

        // Signature Area
        doc.font('Helvetica').fontSize(8).text('For V.M.S GARMENTS', 415, tableBottom + 145, { width: 145, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(12).text('V. M. J', 415, tableBottom + 175, { width: 145, align: 'center' }); // Placeholder for signature
        doc.font('Helvetica').fontSize(8).text('Authorised Signatory', 415, tableBottom + 205, { width: 145, align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
