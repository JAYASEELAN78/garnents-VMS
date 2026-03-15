import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;
    const JWT_SECRET = process.env.JWT_SECRET || 'vms-garments-secret-key';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Check both userId and id for compatibility
            const userId = decoded.userId || decoded.id;
            req.user = await User.findById(userId).select('-password');
            
            if (!req.user) {
                console.error(`❌ User not found for ID: ${userId}`);
                return res.status(401).json({ message: 'User not found' });
            }
            return next();
        } catch (error) {
            console.error('❌ JWT Verification Error (Header):', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Session expired, please login again' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else if (req.query.token) {
        try {
            token = req.query.token;
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const userId = decoded.userId || decoded.id;
            req.user = await User.findById(userId).select('-password');
            
            if (!req.user) {
                console.error(`❌ User (Query) not found for ID: ${userId}`);
                return res.status(401).json({ message: 'User not found' });
            }
            return next();
        } catch (error) {
            console.error('❌ JWT Verification Error (Query):', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Download link expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.warn('⚠️ No token provided in headers or query');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
