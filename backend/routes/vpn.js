const express = require('express');
const router = express.Router();
const vpnController = require('../controllers/vpnController'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join('C:', 'home', 'rootuser', 'vpnmanager', 'cert');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Используем оригинальное имя файла без изменений
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage }); 
// Маршруты
router.post('/add', upload.single('certificate'), vpnController.addConnection); 
router.get('/list', vpnController.listConnections);
router.put('/update/:id', vpnController.updateConnection);
router.delete('/delete/:id', vpnController.deleteConnection);  

module.exports = router;