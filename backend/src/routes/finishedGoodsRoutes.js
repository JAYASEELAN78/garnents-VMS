import express from 'express';
const router = express.Router();
import { addFinishedGoods, getFinishedGoods } from '../controllers/finishedGoodsController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, addFinishedGoods);
router.get('/', protect, getFinishedGoods);

export default router;