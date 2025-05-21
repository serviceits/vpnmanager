// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '10.10.5.53',
    user: 'Neko',
    password: '3N9amNKAIz04',
    database: 'bitrixai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;