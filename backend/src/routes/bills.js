import express from 'express';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { sendBillNotification } from '../services/emailService.js';

const router = express.Router();

// Generate bill number
const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SRF${year}${month}${random}`;
};

// Number to words for Indian currency
const numberToWords = (num) => {
    return `Rupees ${Math.floor(num)} Only`;
};

// Get all bills
router.get('/', async (req, res) => {
    try {
        const { status, startDate, endDate, search, billType, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.paymentStatus = status;
        if (billType) query.billType = billType;
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (search) {
            query.$or = [
                { billNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.phone': { $regex: search, $options: 'i' } },
                { partyName: { $regex: search, $options: 'i' } }
            ];
        }

        const bills = await Bill.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Bill.countDocuments(query);

        res.json({
            success: true,
            data: bills,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get bill stats
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateQuery = startDate && endDate
            ? { date: { $gte: new Date(startDate), $lte: new Date(endDate) } }
            : {};

        const stats = await Bill.aggregate([
            { $match: dateQuery },
            {
                $group: {
                    _id: null,
                    totalBills: { $sum: 1 },
                    totalRevenue: { $sum: '$grandTotal' },
                    avgOrderValue: { $avg: '$grandTotal' },
                    paidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } }
                }
            }
        ]);

        res.json({ success: true, data: stats[0] || {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single bill
router.get('/:id', async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id).populate('items.product');
        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }
        res.json({ success: true, data: bill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create bill
router.post('/', async (req, res) => {
    try {
        const { customer, items, discount = 0, paymentMethod, notes, transport, fromDate, toDate, totalPacks, numOfBundles } = req.body;

        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            const itemSubtotal = item.price * item.quantity;
            const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
            const taxableAmount = itemSubtotal - itemDiscount;
            const gstAmount = (taxableAmount * product.gstRate) / 100;

            processedItems.push({
                product: product._id,
                productName: product.name,
                sku: product.sku,
                hsn: product.hsn,
                hsnCode: item.hsnCode || product.hsn,
                sizesOrPieces: item.sizesOrPieces || '',
                quantity: item.quantity,
                mrp: product.mrp,
                price: item.price,
                ratePerPiece: item.ratePerPiece || item.price,
                pcsInPack: item.pcsInPack || 1,
                ratePerPack: item.ratePerPack || item.price,
                noOfPacks: item.noOfPacks || item.quantity,
                discount: item.discount || 0,
                gstRate: product.gstRate,
                gstAmount,
                total: taxableAmount + gstAmount
            });

            subtotal += itemSubtotal;
            totalTax += gstAmount;

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();

            // Record stock movement
            await new StockMovement({
                product: product._id,
                type: 'out',
                quantity: item.quantity,
                previousStock: product.stock + item.quantity,
                newStock: product.stock,
                reason: `Sold - Bill pending`
            }).save();
        }

        const discountAmount = (subtotal * discount) / 100;
        const taxableAmount = subtotal - discountAmount;
        const cgst = totalTax / 2;
        const sgst = totalTax / 2;
        const grandTotal = taxableAmount + totalTax;

        const bill = new Bill({
            billNumber: generateBillNumber(),
            billType: 'DIRECT',
            partyName: customer?.name || '',
            customer,
            transport,
            fromText: fromDate || '',
            toText: toDate || '',
            totalPacks: totalPacks || 0,
            numOfBundles: numOfBundles || 1,
            items: processedItems,
            subtotal,
            discountAmount,
            taxableAmount,
            cgst,
            sgst,
            totalTax,
            grandTotal,
            amountInWords: numberToWords(grandTotal),
            paymentMethod,
            paymentStatus: paymentMethod === 'credit' ? 'pending' : 'paid',
            notes
        });

        await bill.save();

        // Update stock movement reference
        await StockMovement.updateMany(
            { reason: 'Sold - Bill pending' },
            { reason: `Sold - Bill #${bill.billNumber}` }
        );

        // Send email notification if configured
        if (process.env.ADMIN_EMAIL) {
            const emailList = process.env.ADMIN_EMAIL.split(',').map(e => e.trim());
            sendBillNotification(bill, emailList).catch(err => {
                console.error('Failed to send bill notification:', err);
            });
        }

        res.status(201).json({ success: true, data: bill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update bill status
router.put('/:id', async (req, res) => {
    try {
        const bill = await Bill.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, data: bill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete bill
router.delete('/:id', async (req, res) => {
    try {
        await Bill.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Bill deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
