import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Provide __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Since we are running this as a script, we might need to manually import the models
// But they depend on mongoose.model.
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment variables');
    process.exit(1);
}

const sampleProducts = [
    {
        name: "Classic White Oxford Shirt",
        desc: "A timeless, versatile white oxford button-down shirt made from premium cotton.",
        price: 1299,
        image: "https://images.unsplash.com/photo-1596755094514-f87e32f85f2c?auto=format&fit=crop&q=80&w=800",
        catName: "Shirts"
    },
    {
        name: "Essential Denim Jacket",
        desc: "Rugged blue denim jacket with a classic fit, perfect for layering in any season.",
        price: 2499,
        image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800",
        catName: "Outerwear"
    },
    {
        name: "Slim Fit Black Jeans",
        desc: "Comfortable stretch denim in a sleek black wash. Fits close to the body without being restrictive.",
        price: 1899,
        image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&q=80&w=800",
        catName: "Pants"
    },
    {
        name: "Vintage Graphic Tee",
        desc: "Soft, pre-shrunk cotton t-shirt featuring a retro graphic print.",
        price: 699,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800",
        catName: "T-Shirts"
    },
    {
        name: "Wool Blend Overcoat",
        desc: "Elegant and warm camel-colored overcoat for a sophisticated winter look.",
        price: 4999,
        image: "https://images.unsplash.com/photo-1555069998-8d00344b1c28?auto=format&fit=crop&q=80&w=800",
        catName: "Outerwear"
    },
    {
        name: "Casual Chino Shorts",
        desc: "Lightweight and breathable khaki shorts for warm weather comfort.",
        price: 999,
        image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=800",
        catName: "Bottoms"
    },
    {
        name: "Linen Summer Dress",
        desc: "Flowy, breezy linen dress in a soft pastel tone. Ideal for weekend getaways.",
        price: 2199,
        image: "https://images.unsplash.com/photo-1515347619253-09b6cd8e7c10?auto=format&fit=crop&q=80&w=800",
        catName: "Dresses"
    },
    {
        name: "Athletic Running Tights",
        desc: "High-performance compression tights designed for running and intense workouts.",
        price: 1499,
        image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=800",
        catName: "Activewear"
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete old products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Get or create categories
        for (const item of sampleProducts) {
            let category = await Category.findOne({ name: item.catName });
            if (!category) {
                category = await Category.create({
                    name: item.catName,
                    description: `All kinds of ${item.catName}`,
                    isActive: true
                });
                console.log(`Created category: ${item.catName}`);
            }

            const sku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            await Product.create({
                name: item.name,
                sku: sku,
                description: item.desc,
                category: category._id,
                mrp: item.price + 500,
                sellingPrice: item.price,
                stock: Math.floor(Math.random() * 50) + 10, // 10 to 60
                lowStockThreshold: 5,
                unit: 'pcs',
                image: item.image,
                isActive: true,
                featured: true
            });
            console.log(`Created product: ${item.name}`);
        }

        console.log('Successfully seeded stunning products!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedProducts();
