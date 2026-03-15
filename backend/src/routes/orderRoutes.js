import express from 'express';
import multer from 'multer';
import path from 'path';

// Configure storage to preserve file extensions
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage });

const router = express.Router();
import { 
    createOrder, 
    getOrders, 
    getOrderById, 
    updateOrder, 
    deleteOrder, 
    getOrderStats,
    downloadDesignFile 
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/stats', protect, getOrderStats);
router.post('/', protect, upload.single('designFile'), createOrder);
router.get('/download/:filename', downloadDesignFile);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id', protect, updateOrder);
router.delete('/:id', protect, deleteOrder);

export default router;