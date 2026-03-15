import express from 'express';
const router = express.Router();
import { createMessage, replyMessage, getMessages, getUnreadCount, markAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, createMessage);
router.post('/reply', protect, replyMessage);
router.get('/', protect, getMessages);
router.get('/unread-count', protect, getUnreadCount);
router.post('/mark-read', protect, markAsRead);

export default router;
