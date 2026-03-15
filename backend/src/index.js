import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import './env.js';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';


// Load environment variables

// Import Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import billRoutes from './routes/bills.js';
import inventoryRoutes from './routes/inventory.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import customerRoutes from './routes/customers.js';
import hsnRoutes from './routes/hsn.js';
import supplierRoutes from './routes/suppliers.js';
import paymentRoutes from './routes/payments.js';
import salesEntriesRoutes from './routes/salesEntries.js';
import purchaseEntriesRoutes from './routes/purchaseEntries.js';
import aiRoutes from './routes/ai.js';
import emailRoutes from './routes/email.js';

// New System Routes
import companyRoutes from './routes/companyRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import finishedGoodsRoutes from './routes/finishedGoodsRoutes.js';
import dispatchRoutes from './routes/dispatchRoutes.js';
import userRoutes from './routes/userRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import razorpayRoutes from './routes/razorpayRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS Configuration - Allow frontend
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    process.env.ADMIN_URL
].filter(Boolean);

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb+srv://dineshknight19_db_user:dinesh1910@cluster0.hepq0h5.mongodb.net/vms-garments"

const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'jayaseelanjaya67@gmail.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            await User.create({
                name: 'Admin User',
                email: 'jayaseelanjaya67@gmail.com',
                password: hashedPassword,
                phone: '9080573831',
                role: 'admin',
                isActive: true
            });
            console.log('✅ Default admin user created (jayaseelanjaya67@gmail.com / 123456)');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
})
    .then(async () => {
        console.log('✅ Connected to MongoDB Atlas');
        console.log(`📦 Database: ${mongoose.connection.name}`);
        await createDefaultAdmin();
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('💡 Please check:');
        console.error('   1. MongoDB Atlas cluster is running');
        console.error('   2. Network access allows your IP address');
        console.error('   3. Database username/password are correct');
        console.error('   4. Internet connection is stable');
    });

// Basic routes
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
            <h1 style="color: #bc6c25;">V.M.S GARMENTS API</h1>
            <p>Backend server is running on port ${process.env.PORT || 5000}.</p>
            <div style="background: #fefae0; padding: 15px; border-radius: 8px; border-left: 5px solid #bc6c25;">
                <h3>Frontend Access:</h3>
                <ul>
                    <li><strong>Client Portal:</strong> <a href="http://localhost:5173">http://localhost:5173</a></li>
                    <li><strong>Admin Portal:</strong> <a href="http://localhost:5174">http://localhost:5174</a> (or 5175)</li>
                </ul>
            </div>
            <p>For API health check, visit <a href="/api/health">/api/health</a></p>
        </div>
    `);
});

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'V.M.S GARMENTS API Base Path',
        health: '/api/health',
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/hsn', hsnRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sales-entries', salesEntriesRoutes);
app.use('/api/purchase-entries', purchaseEntriesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/email', emailRoutes);

// New System Routes Mounted
app.use('/api/companies', companyRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/raw-materials', materialRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/finished-goods', finishedGoodsRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/stripe', stripeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'V.M.S GARMENTS API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
import { initScheduler } from './services/schedulerService.js';

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);
    
    // Diagnostic for Stripe Configuration
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
        console.log(`💳 Stripe Key Loaded: ${stripeKey.substring(0, 7)}...${stripeKey.substring(stripeKey.length - 4)}`);
    } else {
        console.warn('⚠️ STRIPE_SECRET_KEY is NOT loaded in process.env');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
        console.log(`🔑 JWT Secret Loaded: ${jwtSecret.substring(0, 5)}...`);
    } else {
        console.warn('⚠️ JWT_SECRET is using DEFAULT fallback!');
    }

    // Start automated tasks
    initScheduler();
});

export default app;
