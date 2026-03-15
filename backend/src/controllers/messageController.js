import Message from '../models/Message.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { isEmailConfigured, sendNotification } from '../services/emailService.js';

// Get admin email from env or fallback
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jayaseelanjaya67@gmail.com';

// CLIENT sends a message → stored in DB + notify admin via email
export const createMessage = async (req, res) => {
    try {
        const { client_id, order_id, message } = req.body;
        const sender = req.user.role === 'admin' ? 'admin' : 'client';

        const newMessage = new Message({
            client_id: client_id || req.user._id,
            order_id,
            message,
            sender
        });
        await newMessage.save();

        // Populate for email
        const populated = await Message.findById(newMessage._id)
            .populate('client_id', 'name email')
            .populate('order_id', 'order_id product_name');

        // Email notification to ADMIN when client sends a message
        if (sender === 'client' && isEmailConfigured()) {
            const clientName = populated.client_id?.name || 'A client';
            const orderRef = populated.order_id?.order_id || 'Unknown Order';
            const subject = `💬 New Message from ${clientName} - ${orderRef}`;
            const body = `
                <p><strong>${clientName}</strong> sent a new message regarding order <strong>${orderRef}</strong>:</p>
                <blockquote style="background:#f9fafb;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0;border-radius:4px;">
                    ${message}
                </blockquote>
                <p>Please log in to the Admin Dashboard to reply.</p>
            `;
            sendNotification(ADMIN_EMAIL, subject, body).catch(err =>
                console.warn('Admin email notification failed:', err.message)
            );
        }

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ADMIN replies to a message → stored + notify client via email  
export const replyMessage = async (req, res) => {
    try {
        const { client_id, order_id, message } = req.body;

        // Find client to get their email
        const clientUser = await User.findById(client_id).select('name email');
        const order = order_id ? await Order.findById(order_id).select('order_id product_name') : null;

        const newMessage = new Message({
            client_id,
            order_id,
            message,
            sender: 'admin'
        });
        await newMessage.save();

        // Email notification to CLIENT when admin replies
        if (clientUser?.email && isEmailConfigured()) {
            const orderRef = order?.order_id || 'Your Order';
            const subject = `📩 Reply from V.M.S GARMENTS Admin - ${orderRef}`;
            const body = `
                <p>Hello <strong>${clientUser.name}</strong>,</p>
                <p>The admin has replied to your message regarding <strong>${orderRef}</strong>:</p>
                <blockquote style="background:#f9fafb;border-left:4px solid #10b981;padding:12px 16px;margin:16px 0;border-radius:4px;">
                    ${message}
                </blockquote>
                <p>Log in to the V.M.S GARMENTS Client Portal to continue the conversation.</p>
            `;
            sendNotification(clientUser.email, subject, body).catch(err =>
                console.warn('Client email notification failed:', err.message)
            );
        }

        const populated = await Message.findById(newMessage._id)
            .populate('client_id', 'name email')
            .populate('order_id', 'order_id product_name');

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get messages (admin sees all; client sees own)
export const getMessages = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.client_id = req.user._id;
        }
        const messages = await Message.find(query)
            .populate('order_id', 'order_id product_name')
            .populate('client_id', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get unread message count for the current user
export const getUnreadCount = async (req, res) => {
    try {
        let query = { isRead: false };
        if (req.user.role === 'admin') {
            // Admin sees unread messages from clients
            query.sender = 'client';
        } else {
            // Client sees unread replies from admin
            query.client_id = req.user._id;
            query.sender = 'admin';
        }
        const count = await Message.countDocuments(query);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
    try {
        const { ids } = req.body; // Array of message IDs
        await Message.updateMany({ _id: { $in: ids } }, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
