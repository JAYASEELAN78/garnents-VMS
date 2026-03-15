const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    machine: { type: String, trim: true },
    staff: { type: String, trim: true },
    startDate: { type: Date },
    completionDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, trim: true },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'quality-check', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Production', productionSchema);
