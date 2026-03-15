import mongoose from 'mongoose';
const orderSchema = new mongoose.Schema({
    order_id: { type: String, required: true, unique: true },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, default: 0 },
    order_date: { type: Date, default: Date.now },
    delivery_date: { type: Date },
    status: { type: String, enum: ['Pending', 'Payment Acceptance', 'Material Received', 'Processing', 'Quality Check', 'Completed', 'Dispatched', 'Delivered', 'Cancelled'], default: 'Pending' },
    payment_status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    priceStatus: { type: String, enum: ['Pending', 'Quoted', 'Confirmed', 'Negotiating', 'Finalized'], default: 'Pending' },
    finalCost: { type: Number },
    // Fields from client portal
    unit: { type: String, default: 'pcs' },
    description: { type: String },
    priority: { type: String, default: 'medium' },
    estimatedCost: { type: Number, default: 0 },
    designFile: { type: String },
    files: [{ type: String }]
}, { timestamps: true });
export default mongoose.model('Order', orderSchema);