const express = require('express');
const router = express.Router();
const bitrixController = require('../controllers/bitrixController');
const { authenticate, checkRole } = require('../middleware/auth');

// Маршрут для загрузки пользователей и отделов из Bitrix24
router.get('/users', bitrixController.getBitrixUsers);
// router.get('/users', authenticate, checkRole('admin'), bitrixController.getBitrixUsers);

module.exports = router;