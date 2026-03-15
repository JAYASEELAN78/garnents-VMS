import mongoose from 'mongoose';
import Order from '../models/Order.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendOrderStatusEmail, sendQuoteEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createOrder = async (req, res) => {
    try {
        // Handle fields from both the React Client app and the web app
        const { productName, product_name, quantity, unit, description, deliveryDate, delivery_date, priority, estimatedCost } = req.body;

        const generatedOrderId = `ORD-${Date.now()}`;

        const orderData = {
            order_id: req.body.order_id || generatedOrderId,
            user_id: req.user?._id, // Set by protect middleware
            product_name: productName || product_name,
            quantity: quantity,
            unit,
            description,
            delivery_date: deliveryDate || delivery_date,
            priority,
            estimatedCost,
            designFile: req.file ? req.file.filename : undefined
        };

        const order = new Order({ ...req.body, ...orderData });
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'client') {
            query.user_id = req.user._id;
        }

        const orders = await Order.find(query)
            .populate('company_id')
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('company_id')
            .populate('user_id', 'name email');
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateOrder = async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id).populate('user_id', 'email');
        if (!oldOrder) return res.status(404).json({ error: 'Order not found' });

        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        console.log("UPDATE ORDER CALLED. RESEND KEY IS:", process.env.RESEND_API_KEY);

        // Check if status has changed and trigger email
        if (req.body.status && oldOrder.status !== req.body.status) {
            if (oldOrder.user_id && oldOrder.user_id.email) {
                sendOrderStatusEmail(order, oldOrder.status, req.body.status, oldOrder.user_id.email)
                    .catch(err => console.error('Failed to send status update email:', err));
            }
        }

        // Check if a quote was sent and trigger quote email
        if (req.body.priceStatus === 'Quoted' && oldOrder.priceStatus !== 'Quoted') {
            if (oldOrder.user_id && oldOrder.user_id.email) {
                sendQuoteEmail(order, req.body.estimatedCost || order.estimatedCost, oldOrder.user_id.email)
                    .catch(err => console.error('Failed to send quote email:', err));
            }
        }

        res.json(order);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const getOrderStats = async (req, res) => {
    try {
        let matchFilter = {};
        if (req.user.role === 'client') {
            matchFilter.user_id = new mongoose.Types.ObjectId(req.user._id);
        }

        const total = await Order.countDocuments(matchFilter);
        const statuses = await Order.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const recentOrders = await Order.find(matchFilter)
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({ total, statuses, recentOrders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const downloadDesignFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const uploadDir = path.join(__dirname, '../../uploads');
        let filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Detect if file has extension, if not (legacy files), try to guess for the download filename
        let downloadName = filename;
        if (!path.extname(filename)) {
            // Check file header (magic bytes) for common types
            const buffer = Buffer.alloc(12);
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, 12, 0);
            fs.closeSync(fd);

            const hex = buffer.toString('hex').toUpperCase();
            if (hex.startsWith('89504E47')) downloadName += '.png';
            else if (hex.startsWith('FFD8FF')) downloadName += '.jpg';
            else if (hex.startsWith('25504446')) downloadName += '.pdf';
            else if (hex.startsWith('47494638')) downloadName += '.gif';
            else if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') downloadName += '.webp'; // RIFF....WEBP
            else if (hex.startsWith('52494646')) downloadName += '.webp'; // Generic RIFF (likely WebP)
            else if (hex.startsWith('424D')) downloadName += '.bmp';
            else if (hex.startsWith('49492A00') || hex.startsWith('4D4D002A')) downloadName += '.tiff';
        }

        res.download(filePath, downloadName);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};