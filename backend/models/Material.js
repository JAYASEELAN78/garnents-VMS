const mongoose = require('mongoose')

const materialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, default: 'Raw' },
    currentStock: { type: Number, default: 0 },
    unit: { type: String, required: true },
    minLevel: { type: Number, default: 10 },
    lastRestockDate: { type: Date, default: Date.now },
    supplierInfo: String,
}, { timestamps: true })

module.exports = mongoose.model('Material', materialSchema)
