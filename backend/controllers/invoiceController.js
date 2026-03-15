const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { generateInvoicePDF } = require('../utils/generateInvoice');

// POST /api/invoices
const createInvoice = async (req, res) => {
    try {
        const { orderId, items, taxRate, discount, notes, dueDate } = req.body;
        const order = await Order.findById(orderId).populate('company');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const subtotal = items.reduce((sum, item) => sum + (item.amount || item.quantity * item.rate), 0);
        const tax = subtotal * ((taxRate || 18) / 100);
        const total = subtotal + tax - (discount || 0);

        const invoice = await Invoice.create({
            order: orderId,
            company: order.company._id,
            items: items.map(item => ({ ...item, amount: item.amount || item.quantity * item.rate })),
            subtotal,
            tax,
            taxRate: taxRate || 18,
            discount: discount || 0,
            total,
            dueDate,
            notes
        });

        const populated = await Invoice.findById(invoice._id).populate('order').populate('company');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create invoice', error: error.message });
    }
};

// GET /api/invoices
const getInvoices = async (req, res) => {
    try {
        const { status, search } = req.query;
        let filter = {};
        if (req.user.role === 'client') {
            const Order2 = require('../models/Order');
            const userOrders = await Order2.find({ user: req.user._id }).select('_id');
            filter.order = { $in: userOrders.map(o => o._id) };
        }
        if (status) filter.status = status;
        if (search) filter.invoiceId = { $regex: search, $options: 'i' };

        const invoices = await Invoice.find(filter)
            .populate('order', 'orderId productName')
            .populate('company', 'name')
            .sort('-createdAt');
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
    }
};

// GET /api/invoices/:id
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('order')
            .populate('company');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch invoice', error: error.message });
    }
};

// GET /api/invoices/:id/pdf
const downloadInvoicePDF = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('order')
            .populate('company');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceId}.pdf`);

        generateInvoicePDF(invoice, res);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
    }
};

// PUT /api/invoices/:id
const updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('order').populate('company');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update invoice', error: error.message });
    }
};

module.exports = { createInvoice, getInvoices, getInvoiceById, downloadInvoicePDF, updateInvoice };
