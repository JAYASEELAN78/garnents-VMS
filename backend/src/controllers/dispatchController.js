import Dispatch from '../models/Dispatch.js';

export const createDispatch = async (req, res) => {
    try {
        const dispatch = new Dispatch(req.body);
        await dispatch.save();
        res.status(201).json(dispatch);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const updateDispatchStatus = async (req, res) => {
    try {
        const { delivery_status } = req.body;
        const dispatch = await Dispatch.findByIdAndUpdate(
            req.params.id,
            { delivery_status },
            { new: true }
        );
        if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });
        res.json(dispatch);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const getDispatches = async (req, res) => {
    try {
        const dispatches = await Dispatch.find().populate({
            path: 'order_id',
            populate: [
                { path: 'company_id' },
                { path: 'user_id', select: 'name' }
            ]
        });
        res.json(dispatches);
    } catch (err) { res.status(500).json({ error: err.message }); }
};