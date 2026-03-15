const PDFDocument = require('pdfkit');

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

const generateInvoicePDF = (invoice, stream) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(stream);

    // --- Document Layout & Borders ---
    const startX = 30;
    const endX = 565; // A4 width (595.28) - 30 margin
    const startY = 30;
    const endY = 810; // A4 height (841.89) - ~30 margin

    // Draw Outer Border
    doc.rect(startX, startY, endX - startX, endY - startY).stroke();

    // --- Header Section ---
    // Header Text
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#1d4ed8').text('V.M.S GARMENTS', startX + 50, startY + 15);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000').text('GSTIN: 33AZRPM4425F2ZA', 400, startY + 20);

    // Header Divider Line
    doc.moveTo(startX, startY + 50).lineTo(endX, startY + 50).stroke();

    // --- Office Details & Invoice Details ---
    doc.font('Helvetica').fontSize(8);
    doc.text('OFF : 61C9, Anupparpalayam Puthur, Tirupur. 641652', startX + 5, startY + 55);
    doc.text('Email: vmsgarments@gmail.com', startX + 5, startY + 70);
    doc.text('Mob: 9080573831', startX + 5, startY + 85);

    // Vertical divider for Invoice Details
    doc.moveTo(350, startY + 50).lineTo(350, startY + 110).stroke();

    doc.font('Helvetica-Bold').text('Invoice Number', 360, startY + 55);
    doc.text(`: ${invoice.invoiceId}`, 450, startY + 55);

    doc.text('Invoice Date', 360, startY + 70);
    doc.text(`: ${new Date(invoice.createdAt || invoice.date).toLocaleDateString('en-GB')}`, 450, startY + 70);

    // Tax Invoice Title Divider
    doc.moveTo(startX, startY + 110).lineTo(endX, startY + 110).stroke();
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e40af')
        .text('TAX INVOICE', startX, startY + 115, { align: 'center', underline: true });
    doc.fillColor('#000');
    // Another divider below Tax Invoice
    doc.moveTo(startX, startY + 135).lineTo(endX, startY + 135).stroke();

    // --- Consignee Details ---
    const clientCompany = invoice.company?.name || '';
    const clientName = invoice.client?.name || 'Valued Client';
    const clientEmail = invoice.company?.email || invoice.client?.email || '';
    const clientPhone = invoice.company?.phone || invoice.client?.phone || '';

    doc.font('Helvetica-Oblique').fontSize(8).text('Consignee Copy', startX + 5, startY + 140);

    doc.font('Helvetica-Bold').fontSize(9).text('BUYER:', startX + 5, startY + 155);
    doc.font('Helvetica').text(clientCompany || clientName, startX + 70, startY + 155);

    doc.font('Helvetica-Bold').text('STATE:', startX + 5, startY + 170);
    doc.font('Helvetica').text('TAMILNADU', startX + 70, startY + 170); // Placeholder

    doc.font('Helvetica-Bold').text('TRANSPORT:', startX + 5, startY + 185);

    // Vertical Divider for Buyer Details
    doc.moveTo(350, startY + 135).lineTo(350, startY + 200).stroke();

    doc.font('Helvetica-Bold').text('MOB:', 360, startY + 155);
    doc.font('Helvetica').text(clientPhone || 'N/A', 410, startY + 155);

    doc.font('Helvetica-Bold').text('EMAIL:', 360, startY + 170);
    doc.font('Helvetica').text(clientEmail || 'N/A', 410, startY + 170);

    // End Consignee Header Line
    doc.moveTo(startX, startY + 200).lineTo(endX, startY + 200).stroke();

    // --- Table Headers ---
    const tableHeaderY = startY + 200;
    doc.font('Helvetica-Bold').fontSize(8);

    const cols = [
        { x: startX, w: 30, text: 'S.No' },
        { x: startX + 30, w: 100, text: 'Product' },
        { x: startX + 130, w: 50, text: 'HSN\nCode' },
        { x: startX + 180, w: 55, text: 'Sizes/\nPieces' },
        { x: startX + 235, w: 60, text: 'Rate Per\nPiece' },
        { x: startX + 295, w: 40, text: 'Pcs in\nPack' },
        { x: startX + 335, w: 60, text: 'Rate Per\nPack' },
        { x: startX + 395, w: 50, text: 'No Of\nPacks' },
        { x: startX + 445, w: 90, text: 'Amount\nRs.' }
    ];

    // Draw Headers & Vertical Lines
    cols.forEach((col, i) => {
        if (i > 0) doc.moveTo(col.x, tableHeaderY).lineTo(col.x, endY - 150).stroke();
        doc.text(col.text, col.x, tableHeaderY + 5, { width: col.w, align: 'center' });
    });

    // Line under table headers
    doc.moveTo(startX, tableHeaderY + 25).lineTo(endX, tableHeaderY + 25).stroke();

    // --- Table Data ---
    // If multiple items, we loop. Usually, it's one job work order item here.
    let rowY = tableHeaderY + 35;
    doc.font('Helvetica').fontSize(9);

    const items = invoice.items && invoice.items.length > 0
        ? invoice.items
        : [{ description: 'Job Work / Service', quantity: 1, rate: invoice.total, amount: invoice.total }];

    let totalQty = 0;

    items.forEach((item, index) => {
        totalQty += (item.quantity || 1);
        doc.text(`${index + 1}`, cols[0].x, rowY, { width: cols[0].w, align: 'center' });
        doc.text(item.description || 'Service', cols[1].x + 5, rowY, { width: cols[1].w - 10, align: 'left' });
        doc.text('6104', cols[2].x, rowY, { width: cols[2].w, align: 'center' }); // Example HSN
        doc.text('Multiple', cols[3].x, rowY, { width: cols[3].w, align: 'center' });
        doc.text((item.rate || item.amount).toFixed(2), cols[4].x, rowY, { width: cols[4].w, align: 'center' });
        doc.text('1', cols[5].x, rowY, { width: cols[5].w, align: 'center' }); // Pcs in pack
        doc.text((item.rate || item.amount).toFixed(2), cols[6].x, rowY, { width: cols[6].w, align: 'center' });
        doc.text(`${item.quantity || 1}`, cols[7].x, rowY, { width: cols[7].w, align: 'center' });
        doc.text(`${(item.amount || item.rate).toFixed(2)}`, cols[8].x, rowY, { width: cols[8].w, align: 'center' });
        rowY += 20;
    });

    // --- Footer Box (Bottom 150pt) ---
    const footerY = endY - 150;
    doc.moveTo(startX, footerY).lineTo(endX, footerY).stroke();

    // Bottom Grid Lines
    doc.moveTo(250, footerY).lineTo(250, footerY + 70).stroke();
    doc.moveTo(400, footerY).lineTo(400, footerY + 90).stroke();

    // Summary details box (Left Side)
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Total Packs', startX + 5, footerY + 10);
    doc.text(`: ${totalQty}`, startX + 80, footerY + 10);

    doc.text('Bill Amount', startX + 5, footerY + 30);
    doc.text(`: ${invoice.total}`, startX + 80, footerY + 30);

    doc.text('In words', startX + 5, footerY + 50);
    doc.font('Helvetica-Oblique').fontSize(8);
    const amountInWords = numberToWords(Math.round(invoice.total));
    doc.text(`: Rupees ${amountInWords ? amountInWords + ' Only' : 'Zero Only'}`, startX + 80, footerY + 50, { width: 160 });

    // Middle Section (Bundles and Total GST)
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('NUM OF BUNDLES :', 255, footerY + 10);
    doc.fontSize(10).text('1', 370, footerY + 10); // default

    // Total GST Box
    doc.rect(255, footerY + 45, 135, 20).stroke('red');
    doc.fillColor('red').fontSize(9).text('TOTAL GST', 260, footerY + 50);
    const taxValue = invoice.tax || (invoice.total * 0.05); // Default to 5% if not directly set
    doc.text(`${taxValue.toFixed(0)}`, 350, footerY + 50, { width: 35, align: 'right' });
    doc.fillColor('#000').stroke('#000'); // Reset colors

    // Right Section (Tax Breakdown)
    const taxBase = invoice.total;
    const discount = invoice.discount || 0;
    const taxableAmt = taxBase - discount;
    const cgst = taxableAmt * 0.025; // Example 2.5%
    const sgst = taxableAmt * 0.025; // Example 2.5%

    doc.font('Helvetica').fontSize(8);
    let taxY = footerY + 5;
    doc.text('Product Amt', 405, taxY); doc.font('Helvetica-Bold').text(`${taxBase.toFixed(2)}`, 490, taxY, { width: 70, align: 'right' });
    taxY += 12;
    doc.font('Helvetica').text('Discount', 405, taxY); doc.font('Helvetica-Bold').text(`${discount.toFixed(2)}`, 490, taxY, { width: 70, align: 'right' });
    taxY += 12;
    doc.font('Helvetica').text('Taxable Amt', 405, taxY); doc.font('Helvetica-Bold').text(`${taxableAmt.toFixed(2)}`, 490, taxY, { width: 70, align: 'right' });
    taxY += 12;
    doc.fillColor('red');
    doc.font('Helvetica').text('CGST @ 2.5%', 405, taxY); doc.font('Helvetica-Bold').text(`${cgst.toFixed(2)}`, 490, taxY, { width: 70, align: 'right' });
    taxY += 12;
    doc.font('Helvetica').text('SGST @ 2.5%', 405, taxY); doc.font('Helvetica-Bold').text(`${sgst.toFixed(2)}`, 490, taxY, { width: 70, align: 'right' });
    taxY += 12;
    doc.fillColor('#000');
    doc.font('Helvetica').text('Round Off', 405, taxY); doc.font('Helvetica-Bold').text('0.00', 490, taxY, { width: 70, align: 'right' });

    // Total divider
    doc.moveTo(startX, footerY + 70).lineTo(400, footerY + 70).stroke(); // horizontal
    doc.moveTo(400, footerY + 83).lineTo(endX, footerY + 83).stroke(); // horizontal total line

    // Total Amount
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Total Amt', 405, footerY + 88);
    doc.text(`${invoice.total.toFixed(2)}`, 490, footerY + 88, { width: 70, align: 'right' });

    // --- Terms and Bank Details (Bottom Left) ---
    const termY = footerY + 75;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1d4ed8').text('Terms And Conditions', startX + 5, termY, { underline: true });
    doc.fillColor('#000').font('Helvetica').fontSize(6);
    doc.text('Subject to Tirupur Jurisdiction.', startX + 5, termY + 12);
    doc.text('Payment by Cheque/DD only, payable at Tirupur.', startX + 5, termY + 20);
    doc.text('Cheques made in favour of V.M.S GARMENTS to be sent to Tirupur Address', startX + 5, termY + 28);

    // Bank Details Box
    doc.rect(startX + 5, termY + 40, 310, 30).stroke('#d97706');
    doc.font('Helvetica-Bold').fillColor('red').fontSize(7).text('Bank Details:', startX + 8, termY + 43);
    doc.fillColor('#1d4ed8').text('ACC NAME : V.M.S GARMENTS', startX + 8, termY + 51);
    doc.text('BANK: SOUTH INDIAN BANK', startX + 8, termY + 59);
    doc.fillColor('#d97706').text('ACC NUM: 0338073000002328    BRANCH: TIRUPUR    IFSC: SIBL0000338', startX + 8, termY + 67);

    // --- Signature ---
    doc.font('Helvetica-Oblique').fillColor('#000').fontSize(8);
    doc.text('Certified that above particulars are true', 370, termY + 15, { width: 170, align: 'center' });
    doc.text('and correct', 370, termY + 25, { width: 170, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1d4ed8');
    doc.text('For V.M.S GARMENTS', 370, termY + 60, { width: 170, align: 'center' });

    doc.end();
    return doc;
};

module.exports = { generateInvoicePDF };

