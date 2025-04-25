require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sshRoutes = require('./routes/ssh');
const vpnRoutes = require('./routes/vpn');  
const userRoutes = require('./routes/users');
const app = express();
const { connectDb } = require('./db'); // Импортируем функцию подключения

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ssh', sshRoutes);
app.use('/api/vpn', vpnRoutes); 
app.use('/api/users', userRoutes);
// Подключение к базе данных
connectDb();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});