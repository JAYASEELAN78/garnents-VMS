import mongoose from 'mongoose';
const rawMaterialSchema = new mongoose.Schema({
    material_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    received_date: { type: Date, default: Date.now },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }
}, { timestamps: true });
export default mongoose.model('RawMaterial', rawMaterialSchema);