const { executeQuery } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const { username, password, userrole = 'user', permissions = {} } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (!['admin', 'moderator', 'user'].includes(userrole)) {
            return res.status(400).json({ error: 'Invalid user role' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userQuery = `
            INSERT INTO users (username, password_hash, userrole, created_at)
            OUTPUT INSERTED.id, INSERTED.username, INSERTED.userrole
            VALUES (@username, @password_hash, @userrole, GETDATE())
        `;
        const userParams = {
            username: username.trim(),
            password_hash: hashedPassword,
            userrole,
        };
        const userResult = await executeQuery(userQuery, userParams);

        const userId = userResult[0].id;

        const permQuery = `
            INSERT INTO permissions (user_id, can_create_connections, can_edit_connections, can_delete_connections, can_create_users)
            VALUES (@user_id, @can_create, @can_edit, @can_delete, @can_create_users)
        `;
        await executeQuery(permQuery, {
            user_id: userId,
            can_create: permissions.can_create_connections ? 1 : 0,
            can_edit: permissions.can_edit_connections ? 1 : 0,
            can_delete: permissions.can_delete_connections ? 1 : 0,
            can_create_users: permissions.can_create_users ? 1 : 0,
        });

        res.json({ message: 'User registered successfully', user: { id: userId, username, userrole } });
    } catch (error) {
        console.error('Error during registration:', error);
        if (error.number === 2627) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const query = `
            SELECT id, username, password_hash, userrole
            FROM users
            WHERE username = @username
        `;
        const params = { username: username.trim() };
        const users = await executeQuery(query, params);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        console.log('User in login:', user);
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, userrole: user.userrole }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        res.json({ token, user: { id: user.id, username: user.username, userrole: user.userrole } });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Server error');
    }
};

exports.me = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token in /me:', decoded);

        const userQuery = `
            SELECT id, username, userrole
            FROM users
            WHERE id = @id
        `;
        const userParams = { id: decoded.id };
        const users = await executeQuery(userQuery, userParams);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const permQuery = `
            SELECT can_create_connections, can_edit_connections, can_delete_connections, can_create_users
            FROM permissions
            WHERE user_id = @user_id
        `;
        const permResult = await executeQuery(permQuery, { user_id: decoded.id });

        const user = {
            id: users[0].id,
            username: users[0].username,
            userrole: users[0].userrole,
            permissions: permResult[0] ? {
                can_create_connections: !!permResult[0].can_create_connections,
                can_edit_connections: !!permResult[0].can_edit_connections,
                can_delete_connections: !!permResult[0].can_delete_connections,
                can_create_users: !!permResult[0].can_create_users,
            } : {
                can_create_connections: false,
                can_edit_connections: false,
                can_delete_connections: false,
                can_create_users: false,
            },
        };

        console.log('User returned from /me:', user);
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Нельзя удалить самого себя
        if (userId == req.user.id) {
            return res.status(403).json({ error: 'Нельзя удалить самого себя' });
        }

        // Удаляем права пользователя
        const permQuery = `
            DELETE FROM permissions
            WHERE user_id = @user_id
        `;
        await executeQuery(permQuery, { user_id: userId });

        // Удаляем пользователя
        const userQuery = `
            DELETE FROM users
            OUTPUT DELETED.id
            WHERE id = @id
        `;
        const result = await executeQuery(userQuery, { id: userId });

        // Проверяем, был ли удалён пользователь
        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ message: 'Пользователь успешно удалён' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { userrole, password, permissions } = req.body;

        // Проверяем роль
        if (userrole && !['admin', 'moderator', 'user'].includes(userrole)) {
            return res.status(400).json({ error: 'Недопустимая роль' });
        }

        // Обновляем пользователя
        let updates = [];
        let params = { id: userId };

        if (userrole) {
            updates.push('userrole = @userrole');
            params.userrole = userrole;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password_hash = @password_hash');
            params.password_hash = hashedPassword;
        }

        if (updates.length > 0) {
            const userQuery = `
                UPDATE users
                SET ${updates.join(', ')}
                WHERE id = @id
            `;
            await executeQuery(userQuery, params);
        }

        // Обновляем права, если переданы
        if (permissions) {
            const permQuery = `
                UPDATE permissions
                SET 
                    can_create_connections = @can_create,
                    can_edit_connections = @can_edit,
                    can_delete_connections = @can_delete,
                    can_create_users = @can_create_users
                WHERE user_id = @user_id
            `;
            await executeQuery(permQuery, {
                user_id: userId,
                can_create: permissions.can_create_connections ? 1 : 0,
                can_edit: permissions.can_edit_connections ? 1 : 0,
                can_delete: permissions.can_delete_connections ? 1 : 0,
                can_create_users: permissions.can_create_users ? 1 : 0,
            });
        }

        res.json({ message: 'Пользователь успешно обновлён' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Ошибка обновления пользователя' });
    }
};