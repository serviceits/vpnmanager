const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticate, checkRole } = require('../middleware/auth');

router.post('/register', authenticate, checkRole('admin'), authController.register);
router.post('/login', authController.login);
router.get('/me', authController.me);
router.delete('/users/:userId', authenticate, checkRole('admin'), authController.deleteUser);
router.put('/users/:userId', authenticate, checkRole('admin'), authController.updateUser);
router.get('/users', authenticate, checkRole('admin'), userController.getUsers);

module.exports = router;