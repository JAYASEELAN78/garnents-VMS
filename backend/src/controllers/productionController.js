import Production from '../models/Production.js';
import Order from '../models/Order.js';

export const startProduction = async (req, res) => {
    try {
        const prod = new Production(req.body);
        await prod.save();

        // Sync with Order status: If production starts, order is "Processing"
        if (req.body.order_id) {
            await Order.findByIdAndUpdate(req.body.order_id, { status: 'Processing' });
        }

        res.status(201).json(prod);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const getProductions = async (req, res) => {
    try {
        const productions = await Production.find().populate({
            path: 'order_id',
            populate: [
                { path: 'company_id' },
                { path: 'user_id', select: 'name email' }
            ]
        });
        res.json(productions);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateProgress = async (req, res) => {
    try {
        const prod = await Production.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // If production is marked as Completed, sync with Order status
        if (req.body.progress === 'Completed') {
            await Order.findByIdAndUpdate(prod.order_id, { status: 'Completed' });
        }

        res.json(prod);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const deleteProduction = async (req, res) => {
    try {
        await Production.findByIdAndDelete(req.params.id);
        res.json({ message: 'Production record deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};