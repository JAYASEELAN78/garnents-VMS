import express from 'express';
const router = express.Router();
import { createDispatch, getDispatches, updateDispatchStatus } from '../controllers/dispatchController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, createDispatch);
router.get('/', protect, getDispatches);
router.put('/:id', protect, updateDispatchStatus);

export default router;