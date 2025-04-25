const express = require('express');
const router = express.Router();
const vpnController = require('../controllers/vpnController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, checkPermission } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join('C:', 'home', 'rootuser', 'vpnmanager', 'cert');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });

router.post('/add', authenticate, checkPermission('can_create_connections'), upload.single('certificate'), vpnController.addConnection);
router.get('/list', authenticate, vpnController.listConnections);
router.put('/update/:id', authenticate, checkPermission('can_edit_connections'), vpnController.updateConnection);
router.delete('/delete/:id', authenticate, checkPermission('can_delete_connections'), vpnController.deleteConnection);

module.exports = router;