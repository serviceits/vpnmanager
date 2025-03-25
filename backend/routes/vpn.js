const express = require('express');
const router = express.Router();
const vpnController = require('../controllers/vpnController'); 
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки сертификатов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/rootuser/vpnmanager/cert/sstp/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

// Маршруты
router.post('/add', upload.single('certificate'), vpnController.addConnection);
 
// router.post('/add', vpnController.addConnection); 
router.get('/list', vpnController.listConnections);
router.put('/update/:id', vpnController.updateConnection);
router.delete('/delete/:id', vpnController.deleteConnection); 

module.exports = router;