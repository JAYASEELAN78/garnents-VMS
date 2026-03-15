import express from 'express';
const router = express.Router();
import { addMaterial, getMaterialsByOrder } from '../controllers/rawMaterialController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, addMaterial);
router.get('/:orderId', protect, getMaterialsByOrder);

export default router;