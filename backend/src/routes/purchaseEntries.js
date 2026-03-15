import express from 'express';
import PurchaseEntry from '../models/PurchaseEntry.js';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

const router = express.Router();

// Generate PURCHASE bill number (PUR-0001 format)
const generatePurchaseBillNumber = async () => {
    const count = await Bill.countDocuments({ billType: 'PURCHASE' });
    return `PUR-${(count + 1).toString().padStart(4, '0')}`;
};

// Number to words for Indian currency
const numberToWords = (num) => {
    return `Rupees ${Math.floor(num)} Only`;
};

// Get all purchase entries with filters and pagination
router.get('/', async (req, res) => {
    try {
        const { search, fromDate, toDate, page = 1, limit = 20 } = req.query;

        const query = {};

        // Search by invoice number or supplier name
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { 'supplier.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Date range filter
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        const entries = await PurchaseEntry.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: -1, createdAt: -1 });

        const total = await PurchaseEntry.countDocuments(query);

        res.json({
            success: true,
            data: entries,
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

// Get single purchase entry by ID
router.get('/:id', async (req, res) => {
    try {
        const entry = await PurchaseEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Purchase entry not found' });
        }
        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new purchase entry + auto-generate PURCHASE bill
router.post('/', async (req, res) => {
    try {
        const { supplier, date, invoiceNumber, items, notes } = req.body;

        if (!invoiceNumber) {
            return res.status(400).json({ success: false, message: 'Invoice number is required for purchase entries' });
        }

        // Calculate totals
        let subtotal = 0;

        const processedItems = items.map(item => {
            const amount = (parseFloat(item.ratePerPack) || 0) * (parseFloat(item.noOfPacks) || 0);
            subtotal += amount;

            return {
                particular: item.particular,
                hsnCode: item.hsnCode || '',
                size: item.size || '',
                ratePerPiece: parseFloat(item.ratePerPiece) || 0,
                pcsInPack: parseFloat(item.pcsInPack) || 1,
                ratePerPack: parseFloat(item.ratePerPack) || 0,
                noOfPacks: parseFloat(item.noOfPacks) || 0,
                amount,
                total: amount
            };
        });

        const grandTotal = subtotal;

        const entry = new PurchaseEntry({
            invoiceNumber,
            date: date || new Date(),
            supplier: {
                name: supplier.name || supplier,
                mobile: supplier.mobile || '',
                gstin: supplier.gstin || '',
                address: supplier.address || ''
            },
            items: processedItems,
            subtotal,
            grandTotal,
            notes
        });

        await entry.save();

        // === Auto-generate PURCHASE bill ===
        const billItems = [];
        let billSubtotal = 0;
        let billTotalTax = 0;

        for (const item of entry.items) {
            const itemAmount = (item.ratePerPack || 0) * (item.noOfPacks || 0);

            const billItem = {
                productName: item.particular,
                sizesOrPieces: item.size || '',
                quantity: item.noOfPacks || 0,
                price: item.ratePerPack || 0,
                ratePerPiece: item.ratePerPiece || 0,
                pcsInPack: item.pcsInPack || 1,
                ratePerPack: item.ratePerPack || 0,
                noOfPacks: item.noOfPacks || 0,
                hsnCode: item.hsnCode || '',
                gstRate: 0,
                gstAmount: 0,
                discount: 0,
                total: itemAmount
            };

            billItems.push(billItem);
            billSubtotal += itemAmount;
        }

        // Increase stock for items that match products by name
        for (const item of entry.items) {
            const product = await Product.findOne({ name: { $regex: new RegExp(`^${item.particular}$`, 'i') } });
            if (product) {
                const previousStock = product.stock;
                product.stock += (item.noOfPacks || 0);
                await product.save();

                // Record stock movement
                await new StockMovement({
                    product: product._id,
                    type: 'in',
                    quantity: item.noOfPacks || 0,
                    previousStock: previousStock,
                    newStock: product.stock,
                    reason: `Purchased - Purchase Entry #${entry.invoiceNumber}`
                }).save();
            }
        }

        const billCgst = 0;
        const billSgst = 0;
        const billGrandTotal = Math.round(billSubtotal);
        const billRoundOff = billGrandTotal - billSubtotal;
        const totalPacks = entry.items.reduce((sum, item) => sum + (item.noOfPacks || 0), 0);

        const bill = new Bill({
            billNumber: await generatePurchaseBillNumber(),
            billType: 'PURCHASE',
            partyName: entry.supplier.name,
            date: entry.date,
            customer: {
                name: entry.supplier.name,
                phone: entry.supplier.mobile || '',
                address: entry.supplier.address || '',
                gstin: entry.supplier.gstin || '',
                state: 'Tamilnadu',
                stateCode: '33'
            },
            items: billItems,
            subtotal: billSubtotal,
            discountAmount: 0,
            taxableAmount: billSubtotal,
            cgst: billCgst,
            sgst: billSgst,
            totalTax: billTotalTax,
            grandTotal: billGrandTotal,
            roundOff: billRoundOff,
            totalPacks,
            numOfBundles: 1,
            amountInWords: numberToWords(billGrandTotal),
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            notes: `Auto-generated from Purchase Entry #${entry.invoiceNumber}`
        });

        await bill.save();

        res.status(201).json({ success: true, data: entry, bill: bill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update purchase entry
router.put('/:id', async (req, res) => {
    try {
        const { supplier, date, invoiceNumber, items, notes, status } = req.body;

        // Recalculate totals if items are updated
        let updateData = { notes, status };

        if (date) updateData.date = date;
        if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
        if (supplier) {
            updateData.supplier = {
                name: supplier.name || supplier,
                mobile: supplier.mobile || '',
                gstin: supplier.gstin || '',
                address: supplier.address || ''
            };
        }

        if (items && items.length > 0) {
            let subtotal = 0;

            const processedItems = items.map(item => {
                const amount = (parseFloat(item.ratePerPack) || 0) * (parseFloat(item.noOfPacks) || 0);
                subtotal += amount;

                return {
                    particular: item.particular,
                    hsnCode: item.hsnCode || '',
                    size: item.size || '',
                    ratePerPiece: parseFloat(item.ratePerPiece) || 0,
                    pcsInPack: parseFloat(item.pcsInPack) || 1,
                    ratePerPack: parseFloat(item.ratePerPack) || 0,
                    noOfPacks: parseFloat(item.noOfPacks) || 0,
                    amount,
                    total: amount
                };
            });

            const grandTotal = subtotal;

            updateData = {
                ...updateData,
                items: processedItems,
                subtotal,
                grandTotal
            };
        }

        const entry = await PurchaseEntry.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Purchase entry not found' });
        }

        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete purchase entry
router.delete('/:id', async (req, res) => {
    try {
        const entry = await PurchaseEntry.findByIdAndDelete(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Purchase entry not found' });
        }
        res.json({ success: true, message: 'Purchase entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
