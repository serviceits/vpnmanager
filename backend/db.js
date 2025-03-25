const sql = require('mssql');
require('dotenv').config();

// Конфигурация подключения к MSSQL
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

let pool;

// Создание пула соединений
const connectDb = async () => {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to MSSQL database');
    } catch (error) {
        console.error('Failed to connect to MSSQL database:', error);
        process.exit(1); // Выход из приложения при ошибке подключения
    }
};

// Функция для выполнения запросов
const executeQuery = async (query, params = {}) => {
    try {
        const request = pool.request();

        // Объявление параметров
        Object.keys(params).forEach((key, index) => {
            if (typeof params[key] === 'string') {
                request.input(key, sql.NVarChar(sql.MAX), params[key]); // Строковые значения
            } else if (params[key] === null) {
                request.input(key, sql.NVarChar(255), null); // NULL значения
            } else if (typeof params[key] === 'number') {
                request.input(key, sql.Int, params[key]); // Числовые значения
            } else if (key === 'data' && typeof params[key] === 'string') {
                request.input(key, sql.NVarChar(sql.MAX), params[key]);
            } else if (key === 'Image' && params[key] !== null) {
                request.input(key, sql.VarBinary(sql.MAX), params[key])
            } else {
                throw new Error(`Invalid data type for parameter ${key}: ${typeof params[key]}`);
            }
        });

        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
};

module.exports = { connectDb, executeQuery };