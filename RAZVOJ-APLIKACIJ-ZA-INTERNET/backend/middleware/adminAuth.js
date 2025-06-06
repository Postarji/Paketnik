const User = require('../models/userModel');

const requireAdmin = async (req, res, next) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized: Please log in' });
        }

        // Get user from database to check role
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        // User is admin, proceed to next middleware
        req.user = user;
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { requireAdmin };