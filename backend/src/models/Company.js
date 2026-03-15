import mongoose from 'mongoose';
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, default: '' },
    address: { type: String },
    gstNumber: { type: String }
}, { timestamps: true });
export default mongoose.model('Company', companySchema);