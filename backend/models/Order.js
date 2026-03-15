const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'pcs', trim: true },
    description: { type: String, trim: true },
    designFile: { type: String, default: '' },
    deliveryDate: { type: Date },
    status: {
        type: String,
        enum: [
            'Order Placed',
            'Order Accepted',
            'Raw Material Received',
            'Production Started',
            'Quality Check',
            'Completed',
            'Dispatched',
            'Delivered'
        ],
        default: 'Order Placed'
    },
    timeline: [{
        status: String,
        date: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderRole: { type: String, enum: ['admin', 'client'] },
        message: String,
        date: { type: Date, default: Date.now }
    }],
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-generate order ID
orderSchema.pre('save', async function (next) {
    if (!this.orderId) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderId = `ORD-${String(count + 1001).padStart(5, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
