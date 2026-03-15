const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, phone, companyName, companyAddress, gstNumber } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({ name, email, password, phone, role: 'client' });

        const company = await Company.create({
            name: companyName || `${name}'s Company`,
            email,
            phone,
            address: companyAddress || '',
            gstNumber: gstNumber || '',
            contactPerson: name,
            owner: user._id
        });

        user.company = company._id;
        await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            company: company,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email }).populate('company');
        
        // Universal Login Logic
        if (!user) {
            // Auto-register new emails as clients
            const name = email.split('@')[0];
            user = await User.create({ 
                name, 
                email, 
                password: 'defaultPassword123!', // Placeholder, bypass will handle future logins
                role: 'client' 
            });

            const company = await Company.create({
                name: `${name}'s Company`,
                email,
                contactPerson: name,
                owner: user._id
            });

            user.company = company._id;
            await user.save();
            user = await User.findById(user._id).populate('company');
        } else {
            // Existing user: Bypass password if role is client
            if (user.role === 'client') {
                // Pass through to login success
            } else if (!(await user.matchPassword(password))) {
                // Strict check for non-client roles (e.g., admin if they accidentally use this route)
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            company: user.company,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('company');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;
        if (req.body.password) user.password = req.body.password;

        const updatedUser = await user.save();

        if (req.body.companyName && user.company) {
            await Company.findByIdAndUpdate(user.company, {
                name: req.body.companyName,
                address: req.body.companyAddress,
                gstNumber: req.body.gstNumber,
                phone: req.body.phone
            });
        }

        const populated = await User.findById(updatedUser._id).populate('company');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
};

// POST /api/auth/admin/login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'admin' });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Admin login failed', error: error.message });
    }
};

// Seed admin user if none exists
const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                name: 'Admin',
                email: 'jayaseelanjaya67@gmail.com',
                password: '123456',
                role: 'admin',
                phone: '9999999999'
            });
            console.log('✅ Default admin created: jayaseelanjaya67@gmail.com / 123456');
        }
    } catch (error) {
        console.error('Admin seeding error:', error.message);
    }
};

module.exports = { register, login, getProfile, updateProfile, adminLogin, seedAdmin };
