const { executeQuery } = require('../db');
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
        const query = 'SELECT connection_number, company_name FROM vpn_connections WHERE connection_number IS NOT NULL';
        const connections = await executeQuery(query);
        const interfacesWithNames = interfaces.map((iface) => {
            const connection = connections.find((conn) => conn.connection_number === iface);
            return {
                interface: iface,
                company_name: connection ? connection.company_name : null,
            };
        });

        res.json({ interfaces: interfacesWithNames });
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