import express from 'express';
import Payment from '../models/Payment.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Get all payments with pagination and filters
router.get('/', protect, async (req, res) => {
    try {
        const { type, search, fromDate, toDate, page = 1, limit = 10 } = req.query;

        let query = { isActive: true };

        // If client, only show their company's payments
        if (req.user.role === 'client') {
            const userWithCompany = await User.findById(req.user._id).populate('company');
            if (userWithCompany?.company?.name) {
                query.companyName = userWithCompany.company.name;
            } else {
                // If no company, they see nothing
                return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
            }
        }

        if (type) query.type = type;

        if (search && req.user.role !== 'client') {
            query.companyName = { $regex: search, $options: 'i' };
        }

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        const payments = await Payment.find(query)
            .populate('customer', 'companyName mobile')
            .populate('supplier', 'companyName mobile')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: -1, createdAt: -1 });

        const total = await Payment.countDocuments(query);

        res.json({
            success: true,
            data: payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single payment
router.get('/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('customer', 'companyName mobile')
            .populate('supplier', 'companyName mobile');
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create payment
router.post('/', async (req, res) => {
    try {
        const payment = new Payment(req.body);
        await payment.save();
        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update payment
router.put('/:id', async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete payment (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.json({ success: true, message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
