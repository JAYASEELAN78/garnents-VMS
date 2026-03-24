import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { sendPasswordResetEmail, isEmailConfigured } from '../services/emailService.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'vms-garments-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '670522390868-j16615o0n8s8s43cj4hkfcs4rv96nmp8.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/login', async (req, res) => {
    console.log("LOGIN ATTEMPT REACHED FOR", req.body.email);
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        let user = await User.findOne({ email }).populate('company');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Only enforce password check for admin accounts elsewhere, 
        // but here we check for ALL roles now.
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin accounts must use the admin portal.' });
        }

        const isMatch = await bcrypt.compare(password || '', user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                company: user.company
            }
        });
    } catch (error) {
        console.error("LOGIN ERROR TRACE:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin Login Route
router.post('/admin/login', async (req, res) => {
    console.log("ADMIN LOGIN ATTEMPT FOR", req.body.email);
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email, role: 'admin' });
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Admin account is deactivated' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("ADMIN LOGIN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Google OAuth Login
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        // Check if user exists
        let user = await User.findOne({ email }).populate('company');

        if (!user) {
            // Create new user from Google account
            user = new User({
                name,
                email,
                password: await bcrypt.hash(googleId + Math.random().toString(), 10),
                phone: '',
                role: 'staff',
                avatar: picture,
                googleId,
                isActive: true
            });
            await user.save();
        } else {
            // Update Google ID and avatar if not set
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = picture || user.avatar;
                await user.save();
            }
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                company: user.company
            }
        });
    } catch (error) {
        console.error('Google auth error:', error.message);
        console.error('Full error:', error);
        // Return more specific error message for debugging
        let errorMessage = 'Google authentication failed';
        if (error.message.includes('Token used too late')) {
            errorMessage = 'Token expired. Please try again.';
        } else if (error.message.includes('Invalid token')) {
            errorMessage = 'Invalid token. Please try again.';
        } else if (error.message.includes('audience')) {
            errorMessage = 'Client ID mismatch. Check Google Cloud Console configuration.';
        }
        res.status(401).json({ success: false, message: errorMessage, debug: error.message });
    }
});

// Login with Phone OTP (mock implementation)
router.post('/login-phone', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        // In production, verify OTP from SMS service
        if (otp !== '123456') {
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }

        let user = await User.findOne({ phone, isActive: true });
        if (!user) {
            // Create new user for phone login
            user = new User({
                name: 'Phone User',
                email: `${phone}@phone.local`,
                password: await bcrypt.hash(Math.random().toString(), 10),
                phone,
                role: 'staff'
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send OTP (mock implementation)
router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        // In production, integrate with SMS service
        console.log(`OTP sent to ${phone}: 123456`);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// In-memory storage for password reset codes (in production, use Redis or database)
const resetCodes = new Map();

// Forgot Password - Request reset code
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            // Don't reveal if email exists for security
            return res.json({ success: true, message: 'If the email exists, a reset code has been sent' });
        }

        // Generate 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store with 10-minute expiry
        resetCodes.set(email, {
            code: resetCode,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // Send reset code via email
        if (isEmailConfigured()) {
            const emailResult = await sendPasswordResetEmail(email, resetCode);
            if (!emailResult.success) {
                console.warn('⚠️ Failed to send reset email:', emailResult.message);
            }
        } else {
            // Fallback: log to console when email is not configured
            console.log(`\n========================================`);
            console.log(`Password Reset Code for ${email}: ${resetCode}`);
            console.log(`This code expires in 10 minutes.`);
            console.log(`========================================\n`);
        }

        res.json({ success: true, message: 'Reset code sent to your email' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reset Password - Verify code and set new password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        // Check if reset code exists and is valid
        const storedData = resetCodes.get(email);
        if (!storedData) {
            return res.status(400).json({ success: false, message: 'No reset code found. Please request a new one.' });
        }

        if (Date.now() > storedData.expiresAt) {
            resetCodes.delete(email);
            return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
        }

        if (storedData.code !== code) {
            return res.status(400).json({ success: false, message: 'Invalid reset code' });
        }

        // Find user and update password
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Hash new password and save
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        // Clear the reset code
        resetCodes.delete(email);

        console.log(`Password successfully reset for ${email}`);

        res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, companyName, companyAddress, gstNumber } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let companyId = null;
        if (companyName) {
            const company = new Company({
                name: companyName,
                email: email,
                phone: phone || '',
                address: companyAddress || '',
                gstNumber: gstNumber || ''
            });
            await company.save();
            companyId = company._id;
        }

        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role: companyId ? 'client' : 'staff',
            company: companyId
        });

        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        const populatedUser = await User.findById(user._id).populate('company');

        res.status(201).json({
            success: true,
            token,
            user: {
                id: populatedUser._id,
                name: populatedUser.name,
                email: populatedUser.email,
                phone: populatedUser.phone,
                role: populatedUser.role,
                company: populatedUser.company
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Profile (protected)
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Update Profile (protected)
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user fields
        if (req.body.name) user.name = req.body.name;
        if (req.body.phone !== undefined) user.phone = req.body.phone;
        if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);

        // Update or create company details
        const { companyName, companyAddress, gstNumber, phone } = req.body;
        if (companyName) {
            // Upgrade role to client if they were staff/default
            if (user.role === 'staff' || !user.role) {
                user.role = 'client';
            }

            if (user.company) {
                // Update existing company
                await Company.findByIdAndUpdate(user.company, {
                    name: companyName,
                    address: companyAddress,
                    gstNumber,
                    phone: phone || user.phone
                });
            } else {
                // Create new company and link to user
                const newCompany = new Company({
                    name: companyName,
                    address: companyAddress,
                    gstNumber,
                    phone: phone || user.phone,
                    email: user.email
                });
                await newCompany.save();
                user.company = newCompany._id;
                user.role = 'client'; // Ensure role is client for new company
            }
        }

        await user.save();

        const updated = await User.findById(user._id).populate('company').select('-password');

        res.json({
            success: true,
            id: updated._id,
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            role: updated.role,
            company: updated.company,
            token  // Return same token so client keeps session
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
