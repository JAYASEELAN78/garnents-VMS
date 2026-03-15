import express from 'express';
import SalesEntry from '../models/SalesEntry.js';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import Customer from '../models/Customer.js';

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

// Get all sales entries with filters and pagination
router.get('/', async (req, res) => {
    try {
        const { search, fromDate, toDate, page = 1, limit = 20 } = req.query;

        const query = {};

        // Search by invoice number or customer name
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Date range filter
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        const entries = await SalesEntry.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: -1, createdAt: -1 });

        const total = await SalesEntry.countDocuments(query);

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

// Get single sales entry by ID
router.get('/:id', async (req, res) => {
    try {
        const entry = await SalesEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Sales entry not found' });
        }
        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Generate SALES bill number (SAL-0001 format)
const generateSalesBillNumber = async () => {
    const count = await Bill.countDocuments({ billType: 'SALES' });
    return `SAL-${(count + 1).toString().padStart(4, '0')}`;
};

// Create new sales entry + auto-generate SALES bill
router.post('/', async (req, res) => {
    try {
        const { customer, date, invoiceNumber, items, notes } = req.body;

        // Calculate totals
        let subtotal = 0;

        const processedItems = items.map(item => {
            const amount = (parseFloat(item.ratePerPack) || 0) * (parseFloat(item.noOfPacks) || 0);
            subtotal += amount;

            return {
                product: item.product || undefined,
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

        const entry = new SalesEntry({
            invoiceNumber: invoiceNumber || undefined,
            date: date || new Date(),
            customer: {
                name: customer.name || customer,
                mobile: customer.mobile || '',
                gstin: customer.gstin || '',
                address: customer.address || ''
            },
            items: processedItems,
            subtotal,
            grandTotal,
            notes
        });

        await entry.save();

        // === Auto-generate SALES bill ===
        // Look up customer email from database
        const customerRecord = await Customer.findOne({ companyName: { $regex: new RegExp(`^${entry.customer.name}$`, 'i') } });
        const customerEmail = customerRecord?.email || '';

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

            // If item has a product reference, link it and deduct stock
            if (item.product) {
                const product = await Product.findById(item.product);
                if (product) {
                    billItem.product = product._id;
                    billItem.sku = product.sku;
                    billItem.hsn = product.hsn;
                    billItem.hsnCode = product.hsn || item.hsnCode;
                    billItem.mrp = product.mrp;

                    // Deduct stock
                    const previousStock = product.stock;
                    product.stock = Math.max(0, product.stock - (item.noOfPacks || 0));
                    await product.save();

                    // Record stock movement
                    await new StockMovement({
                        product: product._id,
                        type: 'out',
                        quantity: item.noOfPacks || 0,
                        previousStock: previousStock,
                        newStock: product.stock,
                        reason: `Sold - Sales Entry #${entry.invoiceNumber}`
                    }).save();
                }
            }

            billItems.push(billItem);
            billSubtotal += itemAmount;
        }

        const billCgst = billTotalTax / 2;
        const billSgst = billTotalTax / 2;
        const billGrandTotal = Math.round(billSubtotal + billTotalTax);
        const billRoundOff = billGrandTotal - (billSubtotal + billTotalTax);
        const totalPacks = entry.items.reduce((sum, item) => sum + (item.noOfPacks || 0), 0);

        const bill = new Bill({
            billNumber: await generateSalesBillNumber(),
            billType: 'SALES',
            partyName: entry.customer.name,
            date: entry.date,
            customer: {
                name: entry.customer.name,
                phone: entry.customer.mobile || '',
                address: entry.customer.address || '',
                gstin: entry.customer.gstin || '',
                email: customerEmail,
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
            notes: `Auto-generated from Sales Entry #${entry.invoiceNumber}`
        });

        await bill.save();

        res.status(201).json({ success: true, data: entry, bill: bill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update sales entry
router.put('/:id', async (req, res) => {
    try {
        const { customer, date, items, notes, status } = req.body;

        // Recalculate totals if items are updated
        let updateData = { notes, status };

        if (date) updateData.date = date;
        if (customer) {
            updateData.customer = {
                name: customer.name || customer,
                mobile: customer.mobile || '',
                gstin: customer.gstin || '',
                address: customer.address || ''
            };
        }

        if (items && items.length > 0) {
            let subtotal = 0;

            const processedItems = items.map(item => {
                const amount = (parseFloat(item.ratePerPack) || 0) * (parseFloat(item.noOfPacks) || 0);
                subtotal += amount;

                return {
                    product: item.product || undefined,
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

        const entry = await SalesEntry.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Sales entry not found' });
        }

        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Generate bill from sales entry
router.post('/:id/generate-bill', async (req, res) => {
    try {
        const entry = await SalesEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Sales entry not found' });
        }

        // Map sales entry items to bill items
        const processedItems = [];
        let subtotal = 0;
        let totalTax = 0;

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

            // If item has a product reference, link it and deduct stock
            if (item.product) {
                const product = await Product.findById(item.product);
                if (product) {
                    billItem.product = product._id;
                    billItem.sku = product.sku;
                    billItem.hsn = product.hsn;
                    billItem.hsnCode = product.hsn || item.hsnCode;
                    billItem.mrp = product.mrp;

                    // Deduct stock
                    const previousStock = product.stock;
                    product.stock = Math.max(0, product.stock - (item.noOfPacks || 0));
                    await product.save();

                    // Check for low stock and notify if necessary
                    const { checkAndNotifyLowStock } = await import('../services/emailService.js');
                    checkAndNotifyLowStock(product).catch(err => console.error('Low stock alert error:', err));

                    // Record stock movement
                    await new StockMovement({
                        product: product._id,
                        type: 'out',
                        quantity: item.noOfPacks || 0,
                        previousStock: previousStock,
                        newStock: product.stock,
                        reason: `Sold - Bill from Sales Entry #${entry.invoiceNumber}`
                    }).save();
                }
            }

            processedItems.push(billItem);
            subtotal += itemAmount;
        }

        const cgst = 0;
        const sgst = 0;
        const grandTotal = Math.round(subtotal);
        const roundOff = grandTotal - subtotal;

        const totalPacks = entry.items.reduce((sum, item) => sum + (item.noOfPacks || 0), 0);

        // Look up customer email
        const custRecord = await Customer.findOne({ companyName: { $regex: new RegExp(`^${entry.customer.name}$`, 'i') } });
        const custEmail = custRecord?.email || '';

        const bill = new Bill({
            billNumber: await generateSalesBillNumber(),
            billType: 'SALES',
            partyName: entry.customer.name,
            date: entry.date,
            customer: {
                name: entry.customer.name,
                phone: entry.customer.mobile || '',
                address: entry.customer.address || '',
                gstin: entry.customer.gstin || '',
                email: custEmail,
                state: 'Tamilnadu',
                stateCode: '33'
            },
            items: processedItems,
            subtotal,
            discountAmount: 0,
            taxableAmount: subtotal,
            cgst,
            sgst,
            totalTax,
            grandTotal,
            roundOff,
            totalPacks,
            numOfBundles: 1,
            amountInWords: numberToWords(grandTotal),
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            notes: `Generated from Sales Entry #${entry.invoiceNumber}`
        });

        await bill.save();

        res.status(201).json({ success: true, data: bill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete sales entry
router.delete('/:id', async (req, res) => {
    try {
        const entry = await SalesEntry.findByIdAndDelete(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Sales entry not found' });
        }
        res.json({ success: true, message: 'Sales entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

