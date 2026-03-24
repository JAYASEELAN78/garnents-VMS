
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://dineshknight19_db_user:dinesh1910@cluster0.hepq0h5.mongodb.net/vms-garments";

async function checkUser() {
    console.log('Starting verification script...');
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('Connected to MongoDB');

        const email = 'jayaseelans.24mca@kongu.edu';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found:', user.email);
            console.log('User Role:', user.role);

            const testPassword = '123456';
            const isMatch = await bcrypt.compare(testPassword, user.password);
            console.log(`Password '${testPassword}' match:`, isMatch);
        } else {
            console.log(`User '${email}' not found`);
            
            // List some users to see what's available
            const users = await User.find({}).limit(5);
            console.log('Available users in DB (first 5):');
            users.forEach(u => console.log(`- ${u.email} (${u.role})`));
        }

    } catch (error) {
        console.error('Error during execution:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
}

checkUser();
