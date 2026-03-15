import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    sender: { type: String, enum: ['admin', 'client'], default: 'admin' },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);

