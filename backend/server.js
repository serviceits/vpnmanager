require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sshRoutes = require('./routes/ssh');
const vpnRoutes = require('./routes/vpn');  
const userRoutes = require('./routes/users');
const bitrixRoutes = require('./routes/bitrix');
const calendarRoutes = require('./routes/calendar');
const app = express();
const { connectDb,connectDbMySQL } = require('./db'); // Импортируем функцию подключения

// Middleware 
app.use(cors({
    origin: 'http://10.10.5.148:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} from ${req.headers.origin}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ssh', sshRoutes);
app.use('/api/vpn', vpnRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/bitrix', bitrixRoutes); 
app.use('/api/calendar', calendarRoutes);
// Подключение к базе данных
connectDb();
connectDbMySQL();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});