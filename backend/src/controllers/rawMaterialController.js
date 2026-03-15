import RawMaterial from '../models/RawMaterial.js';

export const addMaterial = async (req, res) => {
    try {
        const material = new RawMaterial(req.body);
        await material.save();
        res.status(201).json(material);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const getAllMaterials = async (req, res) => {
    try {
        const materials = await RawMaterial.find().populate('order_id');
        res.json(materials);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getMaterialsByOrder = async (req, res) => {
    try {
        const materials = await RawMaterial.find({ order_id: req.params.orderId });
        res.json(materials);
    } catch (err) { res.status(500).json({ error: err.message }); }
};