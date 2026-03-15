
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

const MONGODB_URI = "mongodb+srv://dineshknight19_db_user:dinesh1910@cluster0.hepq0h5.mongodb.net/vms-garments";

async function checkUser() {
    console.log('Starting script...');
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('Connected to MongoDB');

        const email = 'dineshs.24mca@kongu.edu';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found:', user.email);

            // We don't know the exact password the user is trying, but let's see if we can guess common ones or just check if ANY password works
            // In a real scenario, we might want to check the password they ARE using, but we can't see it from the screenshot.
            // However, we can check if the password '123456' works (the default for the admin)

            const testPassword = '123'; // The dots in the screenshot look like 6 characters
            const isMatch = await bcrypt.compare(testPassword, user.password);
            console.log(`Password '${testPassword}' match:`, isMatch);

            const testPassword2 = '123456';
            const isMatch2 = await bcrypt.compare(testPassword2, user.password);
            console.log(`Password '${testPassword2}' match:`, isMatch2);

        } else {
            console.log('User not found');
        }

    } catch (error) {
        console.error('Error during execution:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
}

checkUser();
