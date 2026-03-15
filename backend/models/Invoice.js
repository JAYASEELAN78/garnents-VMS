const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceId: { type: String, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    items: [{
        description: String,
        quantity: Number,
        rate: Number,
        amount: Number
    }],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
    dueDate: { type: Date },
    paidDate: { type: Date },
    notes: { type: String, trim: true }
}, { timestamps: true });

invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceId) {
        const count = await mongoose.model('Invoice').countDocuments();
        this.invoiceId = `INV-${String(count + 1001).padStart(5, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
