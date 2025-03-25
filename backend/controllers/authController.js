const  { executeQuery }  = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Регистрация пользователя
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body; // Убираем email из обязательных полей

        // Проверка обязательных полей
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL-запрос
        const query = `
            INSERT INTO users (username, password_hash, userrole, created_at)
            VALUES (@username, @password_hash, @userrole, GETDATE())
        `;

        // Параметры для запроса
        const params = {
            username: username.trim(),
            password_hash: hashedPassword,
            userrole: 'user',
        };

        // Логирование запроса
        console.log('Executing query:', query);
        console.log('Query parameters:', params);

        const result = await executeQuery(query, params);

        res.json({ message: 'User registered successfully', user: { username } });
    } catch (error) {
        console.error('Error during registration:', error);

        // Отправляем понятное сообщение клиенту
        if (error.number === 2627) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).send('Server error');
    }
};

// Вход пользователя
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // SQL-запрос
        const query = `
            SELECT id, username, password_hash
            FROM users
            WHERE username = @username
        `;

        // Параметры для запроса
        const params = {
            username: username.trim()
        };

        // Выполнение запроса
        const users = await executeQuery(query, params);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Генерация токена
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Server error');
    }
};

// Проверка токена
exports.me = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Получение данных пользователя
        const query = `
            SELECT id, username
            FROM users
            WHERE id = @id
        `;

        const params = { id: decoded.id }; // <- Используйте объект с именованными параметрами
        const users = await executeQuery(query, params);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
};