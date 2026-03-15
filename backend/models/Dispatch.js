const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    transportMode: { type: String, trim: true },
    transporterName: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    dispatchDate: { type: Date },
    expectedDelivery: { type: Date },
    actualDelivery: { type: Date },
    status: {
        type: String,
        enum: ['preparing', 'dispatched', 'in-transit', 'delivered'],
        default: 'preparing'
    },
    notes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Dispatch', dispatchSchema);
