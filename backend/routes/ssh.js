const express = require('express');
const router = express.Router();
const sshController = require('../controllers/sshController');

// Получение интерфейсов
router.get('/interfaces', sshController.getInterfaces);

// Обновление подключения
router.post('/refresh', sshController.refreshConnection);

module.exports = router;