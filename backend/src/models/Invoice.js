import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    invoice_id: { type: String, required: true, unique: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
