const Order = require('../models/Order');
const Production = require('../models/Production');

// POST /api/orders — Client creates order
const createOrder = async (req, res) => {
    try {
        const { productName, quantity, unit, description, deliveryDate, priority, estimatedCost } = req.body;
        const user = req.user;

        const order = await Order.create({
            company: user.company,
            user: user._id,
            productName,
            quantity,
            unit: unit || 'pcs',
            description,
            designFile: req.file ? `/uploads/${req.file.filename}` : '',
            deliveryDate,
            priority: priority || 'medium',
            estimatedCost: estimatedCost || 0,
            status: 'Order Placed',
            timeline: [{ status: 'Order Placed', date: new Date(), note: 'Order has been placed', updatedBy: user._id }]
        });

        const populated = await Order.findById(order._id).populate('company').populate('user', 'name email');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};

// GET /api/orders — Get orders (client sees own, admin sees all)
const getOrders = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
        let filter = {};

        if (req.user.role === 'client') {
            filter.user = req.user._id;
        }
        if (status && status !== 'all') filter.status = status;
        if (search) {
            filter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { productName: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('company', 'name')
            .populate('user', 'name email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('company')
            .populate('user', 'name email phone')
            .populate('timeline.updatedBy', 'name')
            .populate('messages.sender', 'name');

        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (req.user.role === 'client' && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch order', error: error.message });
    }
};

// PUT /api/orders/:id/status — Admin updates status
const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const order = await Order.findById(req.params.id).populate('user', 'name email').populate('company', 'name');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const oldStatus = order.status;
        order.status = status;
        order.timeline.push({ status, date: new Date(), note: note || `Status updated to ${status}`, updatedBy: req.user._id });

        if (status === 'Production Started') {
            const existingProd = await Production.findOne({ order: order._id });
            if (!existingProd) {
                await Production.create({ order: order._id, status: 'in-progress', startDate: new Date() });
            }
        }

        await order.save();

        // Send Email Notification
        if (oldStatus !== status && order.user?.email) {
            try {
                await sendEmail({
                    email: order.user.email,
                    subject: `Order Status Updated: ${order.orderId}`,
                    message: `Hello ${order.user.name},\n\nYour order ${order.orderId} (${order.productName}) status has been updated to: ${status}.\n\nNote: ${note || 'No additional notes.'}\n\nTrack your order at the Client Portal.\n\nBest regards,\nV.M.S GARMENTS Team`,
                    html: `<h3>Order Status Update</h3>
                           <p>Hello <b>${order.user.name}</b>,</p>
                           <p>Your order <b>${order.orderId}</b> (<i>${order.productName}</i>) status has been updated to: <b style="color: #dc2626;">${status}</b>.</p>
                           <p><b>Admin Note:</b> ${note || 'No additional notes.'}</p>
                           <p>Visit the <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">Client Portal</a> to track progress.</p>`
                });
            } catch (e) { console.error('Email failed:', e.message); }
        }

        const populated = await Order.findById(order._id)
            .populate('company')
            .populate('user', 'name email')
            .populate('timeline.updatedBy', 'name');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status', error: error.message });
    }
};

// POST /api/orders/:id/message
const addMessage = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.messages.push({
            sender: req.user._id,
            senderRole: req.user.role,
            message: req.body.message,
            date: new Date()
        });
        await order.save();

        const populated = await Order.findById(order._id)
            .populate('messages.sender', 'name');
        res.json(populated.messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add message', error: error.message });
    }
};

// GET /api/orders/stats — Dashboard statistics
const getOrderStats = async (req, res) => {
    try {
        let matchFilter = {};
        if (req.user.role === 'client') matchFilter.user = req.user._id;

        const total = await Order.countDocuments(matchFilter);
        const statuses = await Order.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const recentOrders = await Order.find(matchFilter)
            .populate('company', 'name')
            .sort('-createdAt')
            .limit(5);

        const monthlyOrders = await Order.aggregate([
            { $match: matchFilter },
            { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
        ]);

        res.json({ total, statuses, recentOrders, monthlyOrders });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete order', error: error.message });
    }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, addMessage, getOrderStats, deleteOrder };
