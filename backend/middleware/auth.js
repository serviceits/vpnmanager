const jwt = require('jsonwebtoken');
require('dotenv').config();
const { executeQuery } = require('../db');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided in Authorization header');
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Received token:', token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const checkRole = (requiredRole) => (req, res, next) => {
    if (!req.user) {
        console.log('User not authenticated in checkRole');
        return res.status(401).json({ error: 'User not authenticated' });
    }

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
    if (!req.user) {
        console.log('User not authenticated in checkPermission');
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const query = `SELECT ${permission} FROM permissions WHERE user_id = @user_id`;
    try {
        const result = await executeQuery(query, { user_id: userId });
        console.log('Permission check:', { permission, result });
        if (!result[0] || !result[0][permission]) {
            return res.status(403).json({ error: `Доступ запрещён: недостаточно прав (${permission})` });
        }
        // Добавляем права в req.user.permissions
        req.user.permissions = req.user.permissions || {};
        req.user.permissions[permission] = result[0][permission];
        console.log('Updated req.user:', req.user);
        next();
    } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({ error: 'Ошибка проверки прав' });
    }
};

module.exports = { authenticate, checkRole, checkPermission };