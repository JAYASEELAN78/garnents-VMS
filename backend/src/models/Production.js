import mongoose from 'mongoose';
const productionSchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    machine: { type: String },
    staff: { type: String },
    start_date: { type: Date, default: Date.now },
    progress: { type: String, default: 'Not Started' },
    completion_date: { type: Date }
}, { timestamps: true });
export default mongoose.model('Production', productionSchema);