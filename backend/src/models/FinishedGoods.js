import mongoose from 'mongoose';
const finishedGoodsSchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    quality_status: { type: String, enum: ['Pass', 'Fail', 'Pending'], default: 'Pending' },
    ready_date: { type: Date }
}, { timestamps: true });
export default mongoose.model('FinishedGoods', finishedGoodsSchema);