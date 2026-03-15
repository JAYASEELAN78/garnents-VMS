import express from 'express';
const router = express.Router();
import { createRazorpayOrder, verifyPayment } from '../controllers/razorpayController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);

export default router;
