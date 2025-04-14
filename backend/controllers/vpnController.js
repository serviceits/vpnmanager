const { executeQuery } = require('../db');
const { NodeSSH } = require('node-ssh'); // Импортируем node-ssh
const multer = require('multer');
const path = require('path');
const uuid = require('uuid');
const { encrypt } = require('../encode/encode');
const crypto = require('crypto');
const { getNextFreeInterfaceAndPort } = require('../utils/findFreeInterface');

const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const protocolType = req.body.protocol_type;
        let uploadDir;
        if (protocolType === 'sstp') {
            uploadDir = '/home/rootuser/vpnmanager/cert/sstp/';
        } else if (protocolType === 'openvpn') {
            uploadDir = '/home/rootuser/vpnmanager/cert/openvpn/';
        } else {
            uploadDir = '/home/rootuser/vpnmanager/cert/';
        }
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const protocolType = req.body.protocol_type;
        if (protocolType === 'openvpn') {
            // Переименовываем файл в <connection_name>.conf для OpenVPN
            cb(null, `${req.body.connection_name}.conf`);
        } else {
            // Для других протоколов оставляем оригинальное имя
            cb(null, file.originalname);
        }
    },
});

const upload = multer({ storage: storage });

// Функция для создания PPTP-подключения
const createVPNConnection = async (connectionData) => {
    const ssh = new NodeSSH();
    try {
        const { newInterface, rdmPort, interfacePrefix } = await getNextFreeInterfaceAndPort(connectionData.protocol_type);
        const fullInterface = `${interfacePrefix}${newInterface}`; // Полное имя для БД
        console.log('Новый интерфейс (число):', newInterface, 'Полный интерфейс:', fullInterface, 'Свободный порт:', rdmPort);
        // Подключаемся к серверу
        await ssh.connect({
            host: process.env.SSH_HOST,
            username: process.env.SSH_USERNAME,
            password: process.env.SSH_PASSWORD,
        });

        console.log('Connected to server.');

        const sudoSuCommand = `echo '${process.env.SSH_PASSWORD}' | sudo -S su`;
        const result = await ssh.execCommand(sudoSuCommand, {
            execOptions: { pty: true }, // Включаем PTY
            onStdout: (chunk) => {
                console.log('STDOUT:', chunk.toString());
            },
            onStderr: (chunk) => {
                console.error('STDERR:', chunk.toString());
            },
        });

        if (result.stderr) {
            console.error('Ошибка при выполнении sudo su:', result.stderr);
        } else {
            console.log('Команда sudo su выполнена успешно.');
            console.log('Результат:', result.stdout);
        }

        console.log('sudo доступ предоставлен.');

        // Вызываем скрипт на сервере
        let scriptPath;
        let scriptCommand;

        // Определяем путь к скрипту и формируем команду в зависимости от протокола
        if (connectionData.protocol_type === 'pptp') {
            scriptPath = '/home/rootuser/vpnmanager/vpncreators/create_pptp.sh';
            scriptCommand = `
                echo '${process.env.SSH_PASSWORD}' | sudo -S bash ${scriptPath} \
                "${connectionData.connection_name}" \
                "${connectionData.vpn_server_address}" \
                "${connectionData.username}" \
                "${connectionData.password}" \
                "${newInterface}" \
                "${connectionData.rdp_server_address}" \
                "${rdmPort}"
            `;
        } else if (connectionData.protocol_type === 'l2tp') {
            scriptPath = '/home/rootuser/vpnmanager/vpncreators/create_l2tp.sh';
            scriptCommand = `
                echo '${process.env.SSH_PASSWORD}' | sudo -S bash ${scriptPath} \
                "${connectionData.connection_name}" \
                "${connectionData.vpn_server_address}" \
                "${connectionData.username}" \
                "${connectionData.password}" \
                "${newInterface}" \
                "${connectionData.secret_key}" \
                "${connectionData.rdp_server_address}" \
                "${rdmPort}"
            `;
        } else if (connectionData.protocol_type === 'sstp') {
            scriptPath = '/home/rootuser/vpnmanager/vpncreators/create_sstp.sh';
            scriptCommand = `
                echo '${process.env.SSH_PASSWORD}' | sudo -S bash ${scriptPath} \
                "${connectionData.connection_name}" \
                "${connectionData.vpn_server_address}" \
                "${connectionData.username}" \
                "${connectionData.password}" \
                "${newInterface}" \
                "${connectionData.rdp_server_address}" \
                "${rdmPort}"
            `;
        } else if (connectionData.protocol_type === 'openvpn') {
            scriptPath = '/home/rootuser/vpnmanager/vpncreators/create_openvpn.sh';
            scriptCommand = `
                echo '${process.env.SSH_PASSWORD}' | sudo -S bash ${scriptPath} \
                "${connectionData.connection_name}" \
                "${connectionData.username}" \
                "${connectionData.password}" \
                "${newInterface}" \
                "${connectionData.rdp_server_address}" \
                "${rdmPort}" \
                "${`/home/rootuser/vpnmanager/cert/openvpn/${connectionData.connection_name}.conf`}" \
                2>&1 | tee /tmp/openvpn.log
            `;
            console.log('------------------------------------');
            console.log('openvpn script');
            console.log(scriptCommand);
            console.log('------------------------------------');



        } else if (connectionData.protocol_type === 'none') {
            scriptPath = '';
            scriptCommand = '';
        } else {
            throw new Error('Unsupported protocol type');
        }

        await ssh.execCommand(scriptCommand);
        console.log(`${connectionData.protocol_type.toUpperCase()} connection created.`);
        return { newInterface: fullInterface, rdmPort };
    } catch (error) {
        console.error('Error creating VPN connection:', error);
        throw error;
    } finally {
        ssh.dispose(); // Закрываем соединение
    }
};

const addRDPConnection = async (connectionData, rdmHost, rdmPort) => {
    const UID = uuid.v4();
    // const nonce = crypto.randomBytes(24); // 192 бит

    const key = crypto.randomBytes(32); // 256 бит
    const iv = crypto.randomBytes(16); // 128 бит

    const encryptedRdpPassword = encrypt(connectionData.rdp_password, key, iv);;
    // const encryptedRdpPassword = encrypt(connectionData.rdp_password, key, nonce);
    console.log(encryptedRdpPassword);

    const createGroupQuery = `
        INSERT INTO GroupInfo (
            ID, Name, Description, CreationDate, CreatedByLoggedUserName,
            CreatedByUserName, ModifiedDate, ModifiedUserName, ModifiedLoggedUserName, Data
        )
        VALUES (
            @ID, @Name, @Description, @CreationDate, @CreatedByLoggedUserName,
            @CreatedByUserName, @ModifiedDate, @ModifiedUserName, @ModifiedLoggedUserName, @Data
        )
    `;

    const groupParams = {
        ID: UID,
        Name: connectionData.company_name,
        Description: 'Description for group',
        CreationDate: new Date().toISOString(),
        CreatedByLoggedUserName: 'root',
        CreatedByUserName: 'root',
        ModifiedDate: new Date().toISOString(),
        ModifiedUserName: 'root',
        ModifiedLoggedUserName: 'root',
        Data: `<?xml version="1.0"?>
        <Group>
        <Name>${connectionData.company_name}</Name>
        <Description>Description for group</Description>
        </Group>`
    };

    try {
        await executeQuery(createGroupQuery, groupParams);
        console.log('GroupInfo создана в БД.');
    } catch (error) {
        console.error('Ошибка создания GroupInfo:', error);
        throw error;
    }


    const query = ` 
        INSERT INTO Connections (
            ID, Data, SecurityGroup, CustomerID, ConnectionType, ConnectionSubType,
            GroupName, Name, UnsafePassword, MetaData, CreationDate, Description,
            ModifiedDate, ModifiedUsername, ModifiedLoggedUserName, AttachmentCount,
            AttachmentPrivateCount, Version, TodoOpenCount, Image, IsSubConnection,
            IsTemplate, Groups, ConnectionMasterSubType, UrlLink, Status, StatusMessage,
            SortPriority, Keywords, Expiration, RepositoryID, HandbookCount,
            InventoryReportCount, PermissionCacheID, RecordingCount, ParentID
        ) 
        VALUES (
            @ID, @Data, @SecurityGroup, @CustomerID, @ConnectionType, @ConnectionSubType,
            @GroupName, @Name, @UnsafePassword, @MetaData, DEFAULT, @Description,
            DEFAULT, @ModifiedUsername, @ModifiedLoggedUserName, @AttachmentCount,
            @AttachmentPrivateCount, DEFAULT, @TodoOpenCount, CONVERT(VARBINARY(MAX), @Image), @IsSubConnection,
            @IsTemplate, @Groups, @ConnectionMasterSubType, @UrlLink, @Status, @StatusMessage,
            @SortPriority, @Keywords, @Expiration, @RepositoryID, @HandbookCount,
            @InventoryReportCount, @PermissionCacheID, @RecordingCount, @ParentID
        )  
    `;
    const url = connectionData.protocol_type !== 'none'
        ? `${rdmHost}:${rdmPort}`
        : connectionData.rdp_server_address;
    const params = {
        ID: UID,
        Data: `<?xml version="1.0"?>
<Connection>
  <Url>${url}</Url> 
  <Group>${connectionData.company_name}</Group>
  <ID>${UID}</ID>
  <Name>${connectionData.company_name} - ${connectionData.rdp_username}</Name>   
  <RDP>
    <SafePassword>${encryptedRdpPassword}</SafePassword>
    <UserName>${connectionData.rdp_username}</UserName>
    <Domain>${connectionData.rdp_domain}</Domain>
  </RDP>
</Connection>`,
        SecurityGroup: UID,
        CustomerID: UID,
        ConnectionType: 1,
        ConnectionSubType: '',
        GroupName: connectionData.company_name,
        Name: connectionData.connection_name,
        UnsafePassword: encryptedRdpPassword,
        MetaData: `<?xml version="1.0"?>
<RDMOConnectionMetaData>
  <ConnectionType>RDPConfigured</ConnectionType>
  <Group>${connectionData.company_name}</Group>
  <Host>${url}</Host>
  <Name>${connectionData.connection_name}</Name>
</RDMOConnectionMetaData>`,
        CreationDate: new Date().toISOString(),
        Description: '',
        ModifiedDate: new Date().toISOString(),
        ModifiedUsername: 'root',
        ModifiedLoggedUserName: 'root',
        AttachmentCount: 0,
        AttachmentPrivateCount: 0,
        Version: new Date().toISOString(),
        TodoOpenCount: 0,
        Image: null,
        IsSubConnection: 0,
        IsTemplate: 0,
        Groups: '',
        ConnectionMasterSubType: '',
        UrlLink: '',
        Status: '',
        StatusMessage: '',
        SortPriority: 0,
        Keywords: '',
        Expiration: null,
        RepositoryID: '1855D483-F05F-40F9-9DC1-A50879F299DA',
        HandbookCount: 0,
        InventoryReportCount: 0,
        PermissionCacheID: UID,
        RecordingCount: 0,
        ParentID: UID,
    };
    try {
        await executeQuery(query, params);
        console.log('Подключение добавлено в БД.');
        console.log(encryptedRdpPassword);

    } catch (error) {
        console.error('Ошибка добавления: ', error);
        throw error;
    }
};

// Добавление нового подключения
exports.addConnection = async (req, res) => {
    const ssh = new NodeSSH();
    try {
        console.log('Получен запрос на /api/vpn/add', req.body, req.file);

        const {
            connection_name,
            protocol_type,
            vpn_server_address,
            username,
            password,
            secret_key,
            certificate,
            config_file,
            company_name,
            rdp_server_address,
            rdp_domain,
            rdp_username,
            rdp_password,
        } = req.body;


        console.log('Извлечённые данные из req.body:', {
            connection_name,
            protocol_type,
            vpn_server_address,
            username,
            password,
            secret_key,
            certificate,
            config_file,
            company_name,
            rdp_server_address,
            rdp_domain,
            rdp_username,
            rdp_password,
        });

        let certificatePath = null;
        if (protocol_type === 'sstp') {
            if (req.file) {
                const localCertPath = req.file.path;
                const fileExt = path.extname(req.file.originalname).toLowerCase();
        
                if (fileExt !== '.crt') {
                    throw new Error('Для SSTP требуется сертификат в формате .crt');
                }
        
                const renamedCertPath = `${req.file.destination}/${connection_name}.crt`;
                console.log('Локальный путь сертификата:', localCertPath);
                console.log('Переименованный локальный путь:', renamedCertPath);
        
                fs.renameSync(localCertPath, renamedCertPath);
                console.log(`Сертификат переименован из ${localCertPath} в ${renamedCertPath}`);
        
                certificatePath = `/home/rootuser/vpnmanager/cert/sstp/${connection_name}.crt`;
                console.log('Удалённый путь сертификата:', certificatePath);
        
                if (!fs.existsSync(renamedCertPath)) {
                    throw new Error(`Переименованный файл сертификата не найден: ${renamedCertPath}`);
                }
        
                await ssh.connect({
                    host: process.env.SSH_HOST,
                    username: process.env.SSH_USERNAME,
                    password: process.env.SSH_PASSWORD,
                });
                console.log('SSH-соединение установлено');
        
                const remoteDir = '/home/rootuser/vpnmanager/cert/sstp';
                await ssh.execCommand(`mkdir -p ${remoteDir}`);
                console.log(`Директория ${remoteDir} проверена/создана`);
                await ssh.execCommand(`chmod 777 ${remoteDir}`);
                console.log(`Права на ${remoteDir} установлены`);
                await ssh.putFile(renamedCertPath, certificatePath);
                console.log('Сертификат загружен на виртуалку:', certificatePath);
        
                ssh.dispose();
            } else {
                console.log('Сертификат для SSTP не предоставлен, настройка без сертификата');
                certificatePath = null; // Указываем, что сертификата нет
            }
        } else if (protocol_type === 'openvpn' && req.file) {
            const localCertPath = req.file.path; // Путь, куда Multer сохранил файл локально
            certificatePath = `/home/rootuser/vpnmanager/cert/openvpn/${connection_name}.conf`; // Путь на виртуалке
            console.log('Локальный путь сертификата:', localCertPath);
            console.log('Удалённый путь сертификата:', certificatePath);

            // Проверяем, существует ли файл локально
            if (!fs.existsSync(localCertPath)) {
                throw new Error(`Локальный файл сертификата не найден: ${localCertPath}`);
            }

            // Подключаемся к виртуалке
            await ssh.connect({
                host: process.env.SSH_HOST,
                username: process.env.SSH_USERNAME,
                password: process.env.SSH_PASSWORD,
            });
            console.log('SSH-соединение установлено'); 

            // Загружаем сертификат
            await ssh.putFile(localCertPath, certificatePath);
            console.log('Сертификат загружен на виртуалку:', certificatePath);

            ssh.dispose();
        }
        let newInterface, rdmPort;
        if (protocol_type !== 'none') {
            console.log('Запуск createVPNConnection с данными:', {
                connection_name,
                protocol_type,
                vpn_server_address,
                username,
                password,
                secret_key,
                rdp_server_address,
            });
            ({ newInterface, rdmPort } = await createVPNConnection({
                connection_name,
                protocol_type,
                vpn_server_address,
                username,
                password,
                secret_key: protocol_type === 'l2tp' ? secret_key : '',
                rdp_server_address,
            }));
            console.log('Подключение создано:', { newInterface, rdmPort });
        } else {  
            console.log('Протокол none, подключение создано');
        }
        console.log('Подключение создано:', { newInterface, rdmPort });

        const query = `
            INSERT INTO vpn_connections (
                connection_name, protocol_type, vpn_server_address, username, password,
                connection_number, secret_key, certificate, config_file, company_name,
                rdp_server_address, rdp_domain, rdp_username, rdp_password, status, 
                rdm_port 
            )
            OUTPUT INSERTED.*
            VALUES (
                @connection_name, @protocol_type, @vpn_server_address, @username, @password,
                @connection_number, @secret_key, @certificate, @config_file, @company_name,
                @rdp_server_address, @rdp_domain, @rdp_username, @rdp_password, @status,
                @rdm_port 
            )
        `;

        const params = {
            connection_name,
            protocol_type,
            vpn_server_address: protocol_type !== 'none' ? vpn_server_address : '',
            username,
            password,
            connection_number: protocol_type !== 'none' ? newInterface : 0,
            secret_key: protocol_type === 'l2tp' ? secret_key : null,
            certificate: protocol_type === 'sstp' ? certificatePath : (protocol_type === 'openvpn' ? certificatePath : null),
            config_file,
            company_name,
            rdp_server_address,
            rdp_domain,
            rdp_username,
            rdp_password,
            status: 'active',
            rdm_port: protocol_type !== 'none' ? rdmPort : 0
        };

        console.log('Выполнение SQL-запроса с параметрами:', params);
        const vpnResult = await executeQuery(query, params);
        console.log('Connection added to database:', vpnResult);

        const rdmHost = process.env.SSH_HOST;
        console.log('Запуск addRDPConnection с данными:', {
            connection_name,
            company_name,
            rdp_server_address,
            rdp_domain,
            rdp_username,
            rdp_password,
            rdmHost,
            rdmPort,
        });
        const rdpResult = await addRDPConnection({
            connection_name,
            company_name,
            rdp_server_address,
            rdp_domain,
            rdp_username,
            rdp_password,
            protocol_type,
        }, protocol_type !== 'none' ? rdmHost : rdp_server_address, rdmPort);
        console.log('RDP подключение добавлено в БД:', rdpResult);

        res.json({ vpnResult: vpnResult[0], rdpResult: 'RDP added', rdmPort });
    } catch (err) {
        console.error('Ошибка в addConnection:', err);
        ssh.dispose();
        res.status(500).send(`Server error: ${err.message}`);
    }
};
// Получение списка всех подключений
exports.listConnections = async (req, res) => {
    try {
        const query = 'SELECT * FROM vpn_connections';
        const connections = await executeQuery(query);
        res.json(connections);
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).send('Server error');
    }
};

exports.uploadCert = async (req, res) => {
    const ssh = new NodeSSH();
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const localPath = req.file.path; // Путь, куда Multer сохранил файл
        const remotePath = `/home/rootuser/vpnmanager/cert/sstp/${req.file.originalname}`; // Путь на Linux-виртуалке

        console.log('Локальный путь (из req.file.path):', localPath);
        console.log('Удалённый путь:', remotePath);

        // Проверяем, существует ли файл локально
        if (!fs.existsSync(localPath)) {
            console.error('Файл не найден на локальном сервере:', localPath);
            return res.status(500).send(`Local file not found: ${localPath}`);
        }

        // Подключаемся к виртуалке
        await ssh.connect({
            host: process.env.SSH_HOST,
            username: process.env.SSH_USERNAME,
            password: process.env.SSH_PASSWORD,
        });
        console.log('SSH-соединение установлено');

        // Передаём файл
        await ssh.putFile(localPath, remotePath);
        console.log('Файл успешно загружен на виртуалку:', remotePath);

        ssh.dispose();
        res.json({ message: 'File uploaded to Linux VM successfully', remotePath });
    } catch (error) {
        console.error('Ошибка загрузки файла на виртуалку:', error);
        ssh.dispose();
        res.status(500).send(`Server error: ${error.message}`);
    }
};

// Обновление подключения
exports.updateConnection = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            connection_name,
            protocol_type,
            vpn_server_address,
            username,
            password,
            connection_number,
        } = req.body;

        const query = `
            UPDATE vpn_connections
            SET connection_name = @connection_name,
                protocol_type = @protocol_type,
                vpn_server_address = @vpn_server_address,
                username = @username,
                password = @password,
                connection_number = @connection_number
            OUTPUT INSERTED.*
            WHERE id = @id
        `;

        const params = {
            id: parseInt(id),
            connection_name,
            protocol_type,
            vpn_server_address,
            username,
            password,
            connection_number
        };

        const result = await executeQuery(query, params);
        console.log('Connection updated successfully.');

        if (result.length === 0) {
            return res.status(404).send('Connection not found');
        }

        res.json(result[0]); // Вернуть обновленные данные
    } catch (error) {
        console.error('Error updating connection:', error);
        res.status(500).send('Server error');
    }
};
// Удаление подключения
exports.deleteConnection = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            DELETE FROM vpn_connections
            OUTPUT DELETED.*
            WHERE id = @id
        `;

        const params = {
            id: parseInt(id)
        };

        const result = await executeQuery(query, params);
        console.log('Подключение удалено.');

        if (result.length === 0) {
            return res.status(404).send('Подключение не найдено');
        }

        res.json({ message: 'Подключение удалено', deleted: result[0] });
    } catch (error) {
        console.error('Ошибка удаления:', error);
        res.status(500).send('Server error');
    }
}; 