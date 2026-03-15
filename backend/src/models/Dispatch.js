import mongoose from 'mongoose';
const dispatchSchema = new mongoose.Schema({
    dispatch_id: { type: String, required: true, unique: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    dispatch_date: { type: Date, default: Date.now },
    transport: { type: String },
    lr_number: { type: String },
    delivery_date: { type: Date },
    invoice_number: { type: String },
    delivery_status: { type: String, enum: ['Pending', 'In Transit', 'Delivered'], default: 'Pending' }
}, { timestamps: true });
export default mongoose.model('Dispatch', dispatchSchema);