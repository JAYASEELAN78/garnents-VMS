import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

console.log('Testing .env load from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Dotenv error:', result.error);
} else {
    console.log('Dotenv loaded successfully');
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    if (process.env.STRIPE_SECRET_KEY) {
        console.log('STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY.substring(0, 7));
    }
}
