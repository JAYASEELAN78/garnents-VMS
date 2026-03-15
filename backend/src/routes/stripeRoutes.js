import express from 'express';
const router = express.Router();
import { createCheckoutSession, verifyStripePayment } from '../controllers/stripeController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/verify', protect, verifyStripePayment);

export default router;
