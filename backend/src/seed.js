import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Bill from './models/Bill.js';
import Settings from './models/Settings.js';

// Get MongoDB URI
const MONGODB_URI = "mongodb+srv://<db_username>:<db_password>@cluster0.qoepicz.mongodb.net/"

if (!MONGODB_URI) {
    console.error("❌ ERROR: MONGODB_URI is missing in .env file");
    process.exit(1);
}

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Bill.deleteMany({});
        await Settings.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // Create Admin User
        const hashedPassword = await bcrypt.hash('password123', 10);
        const admin = await User.create({
            name: 'Admin User',
            email: 'jayaseelanjaya67@gmail.com',
            password: hashedPassword,
            phone: '9876543210',
            role: 'admin',
            isActive: true
        });
        console.log('👤 Admin user created');

        // Create Categories
        const categories = await Category.insertMany([
            { name: 'Sarees', description: 'Traditional and designer sarees' },
            { name: 'Kurtas', description: 'Men and women kurtas' },
            { name: 'Lehengas', description: 'Bridal and party wear lehengas' },
            { name: 'Dupattas', description: 'Silk and cotton dupattas' },
            { name: 'Suits', description: 'Salwar suits and dress materials' }
        ]);
        console.log('📁 Categories created');

        // Create Products
        const products = await Product.insertMany([
            { name: 'Banarasi Silk Saree - Red', sku: 'SAR001', category: categories[0]._id, mrp: 4500, sellingPrice: 3999, stock: 15, gstRate: 12, hsn: '5007', lowStockThreshold: 5 },
            { name: 'Kanjivaram Silk Saree - Gold', sku: 'SAR002', category: categories[0]._id, mrp: 8500, sellingPrice: 7499, stock: 8, gstRate: 12, hsn: '5007', lowStockThreshold: 3 },
            { name: 'Cotton Saree - Blue', sku: 'SAR003', category: categories[0]._id, mrp: 1800, sellingPrice: 1499, stock: 25, gstRate: 5, hsn: '5208', lowStockThreshold: 10 },
            { name: 'Georgette Saree - Pink', sku: 'SAR004', category: categories[0]._id, mrp: 2500, sellingPrice: 2199, stock: 3, gstRate: 12, hsn: '5407', lowStockThreshold: 5 },
            { name: 'Silk Kurta - Blue', sku: 'KUR001', category: categories[1]._id, mrp: 1200, sellingPrice: 999, stock: 30, gstRate: 12, hsn: '6206', lowStockThreshold: 8 },
            { name: 'Cotton Kurta Set - White', sku: 'KUR002', category: categories[1]._id, mrp: 1500, sellingPrice: 1299, stock: 20, gstRate: 5, hsn: '6206', lowStockThreshold: 5 },
            { name: 'Designer Kurta - Maroon', sku: 'KUR003', category: categories[1]._id, mrp: 2200, sellingPrice: 1899, stock: 4, gstRate: 12, hsn: '6206', lowStockThreshold: 5 },
            { name: 'Bridal Lehenga - Red Gold', sku: 'LEH001', category: categories[2]._id, mrp: 25000, sellingPrice: 21999, stock: 5, gstRate: 12, hsn: '6204', lowStockThreshold: 2 },
            { name: 'Party Lehenga - Purple', sku: 'LEH002', category: categories[2]._id, mrp: 8500, sellingPrice: 7499, stock: 7, gstRate: 12, hsn: '6204', lowStockThreshold: 3 },
            { name: 'Chiffon Dupatta - Multi', sku: 'DUP001', category: categories[3]._id, mrp: 600, sellingPrice: 499, stock: 50, gstRate: 5, hsn: '6214', lowStockThreshold: 15 },
            { name: 'Silk Dupatta - Gold', sku: 'DUP002', category: categories[3]._id, mrp: 1200, sellingPrice: 999, stock: 25, gstRate: 12, hsn: '6214', lowStockThreshold: 8 },
            { name: 'Anarkali Suit - Green', sku: 'SUT001', category: categories[4]._id, mrp: 3500, sellingPrice: 2999, stock: 12, gstRate: 12, hsn: '6204', lowStockThreshold: 4 },
        ]);
        console.log('📦 Products created');

        // Generate Bill Number
        const generateBillNumber = () => {
            const date = new Date();
            const y = date.getFullYear().toString().slice(-2);
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const r = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `SRF${y}${m}${r}`;
        };

        // Create Bills
        const sampleBills = [
            {
                billNumber: generateBillNumber(),
                customer: { name: 'Ramesh Kumar', phone: '9876543211', address: 'Chennai' },
                items: [
                    { product: products[0]._id, productName: products[0].name, sku: products[0].sku, quantity: 1, price: 3999, gstRate: 12, gstAmount: 480, total: 4479 }
                ],
                subtotal: 3999, discountAmount: 0, taxableAmount: 3999, cgst: 240, sgst: 240, totalTax: 480, grandTotal: 4479,
                paymentMethod: 'upi', paymentStatus: 'paid', createdBy: admin._id
            },
            {
                billNumber: generateBillNumber(),
                customer: { name: 'Priya Sharma', phone: '9876543212', address: 'Mumbai' },
                items: [
                    { product: products[4]._id, productName: products[4].name, sku: products[4].sku, quantity: 2, price: 999, gstRate: 12, gstAmount: 240, total: 2238 },
                    { product: products[9]._id, productName: products[9].name, sku: products[9].sku, quantity: 1, price: 499, gstRate: 5, gstAmount: 25, total: 524 }
                ],
                subtotal: 2497, discountAmount: 0, taxableAmount: 2497, cgst: 132, sgst: 133, totalTax: 265, grandTotal: 2762,
                paymentMethod: 'cash', paymentStatus: 'paid', createdBy: admin._id
            }
        ];

        await Bill.insertMany(sampleBills);
        console.log('🧾 Sample bills created');

        // Settings
        await Settings.create({
            company: {
                name: 'V.M.S GARMENTS',
                address1: '61C9, Anupparpalayam Puthur, Tirupur. 641652',
                address2: '81 K, Madurai Raod, SankerNager, Tirunelveli Dt. 627357',
                city: 'Tirupur',
                state: 'Tamilnadu',
                stateCode: '33',
                pincode: '641652',
                phone: '9080573831',
                phone2: '9442807770',
                email: 'jayaseelanjaya67@gmail.com',
                gstin: '33AZRPM4425F2ZA'
            },
            bank: {
                accountHolderName: 'V.M.S GARMENTS',
                bankName: 'SOUTH INDIAN BANK',
                accountNumber: '0338073000002328',
                ifscCode: 'SIBL0000338',
                branchName: 'TIRUPUR'
            },
            tax: {
                cgstRate: 2.5,
                sgstRate: 2.5,
                enableGst: true
            },
            billTerms: 'Cheques made in favour of V.M.S GARMENTS to be send toTrinelveli Address\nAll disputes are subjected toTrinelveli Jurisdiction',
            billFooter: 'Certified that above particulars are true and correct\nFor V.M.S GARMENTS'
        });
        console.log('⚙️ Settings created');

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Email: jayaseelanjaya67@gmail.com');
        console.log('   Password: password123\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedDatabase();
