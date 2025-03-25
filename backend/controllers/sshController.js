const { connectAndExecuteCommands, refresh } = require('./sshConnect'); 
require('dotenv').config();

// Эндпоинт для получения интерфейсов
exports.getInterfaces = async (req, res) => {
    try {
        const interfaces = await connectAndExecuteCommands(
            process.env.SSH_HOST,
            process.env.SSH_USERNAME,
            process.env.SSH_PASSWORD
        );
        res.json({ interfaces });
    } catch (error) {
        console.error('Ошибка при получении интерфейсов:', error);
        res.status(500).json({ error: 'Failed to fetch interfaces' }); 
        
    }
};

// Эндпоинт для обновления подключения
exports.refreshConnection = async (req, res) => {
    try {
        await refresh(
            process.env.SSH_HOST,
            process.env.SSH_USERNAME,
            process.env.SSH_PASSWORD
        );
        res.json({ message: 'Connection refreshed successfully' });
    } catch (error) {
        console.error('Ошибка при обновлении подключения:', error);
        res.status(500).json({ error: 'Failed to refresh connection' });
    }
};