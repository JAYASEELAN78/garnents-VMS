import express from 'express';
const router = express.Router();
import { createCompany, getCompanies, updateCompany, deleteCompany } from '../controllers/companyController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, createCompany);
router.get('/', protect, getCompanies);
router.put('/:id', protect, updateCompany);
router.delete('/:id', protect, deleteCompany);

export default router;