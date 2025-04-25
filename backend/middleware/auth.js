const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

const checkRole = (requiredRole) => (req, res, next) => {
    const userRole = req.user.userrole?.trim();
    console.log('Checking role:', { userRole, requiredRole });
    if (requiredRole === 'admin' && userRole !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён: требуется роль admin' });
    }
    if (requiredRole === 'moderator' && !['admin', 'moderator'].includes(userRole)) {
        return res.status(403).json({ error: 'Доступ запрещён: требуется роль moderator или выше' });
    }
    next();
};

const checkPermission = (permission) => async (req, res, next) => {
    const userId = req.user.id;
    const query = `SELECT ${permission} FROM permissions WHERE user_id = @user_id`;
    try {
        const result = await require('../db').executeQuery(query, { user_id: userId });
        console.log('Permission check:', { permission, result });
        if (!result[0] || !result[0][permission]) {
            return res.status(403).json({ error: `Доступ запрещён: недостаточно прав (${permission})` });
        }
        next();
    } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({ error: 'Ошибка проверки прав' });
    }
};

module.exports = { authenticate, checkRole, checkPermission };