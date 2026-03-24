
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://dineshknight19_db_user:dinesh1910@cluster0.hepq0h5.mongodb.net/vms-garments";

async function resetPassword() {
    console.log('Starting password reset script...');
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('Connected to MongoDB');

        const email = 'jayaseelans.24mca@kongu.edu';
        const newPassword = '123456';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await User.updateOne(
            { email },
            { $set: { password: hashedPassword, isActive: true } }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully updated password for ${email}`);
        } else {
            console.log(`User ${email} not found, creating user...`);
            await User.create({
                email,
                password: hashedPassword,
                name: 'Jayaseelan S',
                role: 'client',
                isActive: true
            });
            console.log(`Created user ${email} with password ${newPassword}`);
        }

    } catch (error) {
        console.error('Error during execution:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
}

resetPassword();
