
import mongoose from 'mongoose';
import User from './src/models/User.js';

const MONGODB_URI = "mongodb+srv://vmsgarments:vmsgarments@vms.p3uttc8.mongodb.net/?appName=VMS";

async function checkUser() {
    console.log('Starting script for .env database...');
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('Connected to MongoDB (.env)');

        const email = 'dineshs.24mca@kongu.edu';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found in .env database:', user.email);
        } else {
            console.log('User NOT found in .env database');
        }

    } catch (error) {
        console.error('Error during execution:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
}

checkUser();
