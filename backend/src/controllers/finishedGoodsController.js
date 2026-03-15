import FinishedGoods from '../models/FinishedGoods.js';

export const addFinishedGoods = async (req, res) => {
    try {
        const goods = new FinishedGoods(req.body);
        await goods.save();
        res.status(201).json(goods);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const getFinishedGoods = async (req, res) => {
    try {
        const goods = await FinishedGoods.find().populate('order_id');
        res.json(goods);
    } catch (err) { res.status(500).json({ error: err.message }); }
};