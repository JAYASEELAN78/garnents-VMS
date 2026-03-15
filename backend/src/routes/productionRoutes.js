import express from 'express';
const router = express.Router();
import { startProduction, getProductions, updateProgress, deleteProduction } from '../controllers/productionController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, startProduction);
router.get('/', protect, getProductions);
router.put('/:id', protect, updateProgress);
router.delete('/:id', protect, deleteProduction);

export default router;