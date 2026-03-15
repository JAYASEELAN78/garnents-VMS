const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createOrder, getOrders, getOrderById, updateOrderStatus, addMessage, getOrderStats, deleteOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// Multer config for design file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, `design-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|png|jpg|jpeg|doc|docx|xlsx|csv/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        if (ext) cb(null, true);
        else cb(new Error('Only document and image files are allowed'));
    }
});

router.get('/stats', protect, getOrderStats);
router.post('/', protect, upload.single('designFile'), createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, roleMiddleware('admin'), updateOrderStatus);
router.post('/:id/message', protect, addMessage);
router.delete('/:id', protect, roleMiddleware('admin'), deleteOrder);

module.exports = router;
