const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, checkRole } = require('../middleware/auth');

router.get('/', authenticate, checkRole('admin'), userController.getUsers);
router.put('/permissions/:userId', authenticate, checkRole('admin'), userController.updatePermissions);

module.exports = router;