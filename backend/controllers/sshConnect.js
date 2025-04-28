const { NodeSSH } = require('node-ssh'); 

require('dotenv').config();

const ssh = new NodeSSH();

const host = process.env.SSH_HOST
const username = process.env.SSH_USERNAME
const password = process.env.SSH_PASSWORD 

const connectAndExecuteCommands = async (host, username, password) => {
    try {
        // Подключаемся к серверу
        await ssh.connect({
            host: host,         
            username: username, 
            password: password, 
        });

        console.log('Подключение к серверу успешно установлено.');

        // Выполняем команду sudo su с использованием PTY
        const sudoSuCommand = `echo '${password}' | sudo -S su`;
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

        // Выполняем команду ip a
        const command = 'ip a';
        const output = await ssh.execCommand(command, { execOptions: { pty: true } });
        const regex = /\d+:\s(\w+)/g;

        // Массив для хранения найденных интерфейсов
        const interfaces = [];

        // Поиск всех совпадений
        let match;
        while ((match = regex.exec(output.stdout)) !== null) {
            interfaces.push(match[1]); // Добавляем найденное слово в массив
        }

        // Закрываем соединение
        ssh.dispose();   

        return interfaces;
    } catch (error) {
        console.error('Ошибка при подключении или выполнении команд:', error);
        throw error; 
    }
};
connectAndExecuteCommands(host, username, password)

const refresh = async (host, username, password) => {
    try {
        await ssh.connect({
            host: host,
            username: username,
            password: password,
        });

        console.log('Подключение к серверу успешно установлено.');

        // Выполнение ./routes.sh с правами root
        const routes = `sudo /home/rootuser/routes.sh`;
        const outputRoutes = await ssh.execCommand(routes, {
            execOptions: { pty: true },
            onStdout: (chunk) => {
                console.log('STDOUT:', chunk.toString());
            },
            onStderr: (chunk) => {
                console.error('STDERR:', chunk.toString());
            },
        });

        if (outputRoutes.stderr) {
            console.error('Ошибка при выполнении ./routes.sh:', outputRoutes.stderr);
        } else {
            console.log('Команда ./routes.sh выполнена успешно.');
            console.log('Результат:', outputRoutes.stdout);
        }

        // Задержка на 2 секунды перед выполнением ./firewall.sh
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2000 миллисекунд (2 секунды)

        // Выполнение ./firewall.sh с правами root
        const firewall = `sudo /home/rootuser/firewall.sh`;
        const outputFirewall = await ssh.execCommand(firewall, {
            execOptions: { pty: true },
            onStdout: (chunk) => {
                console.log('STDOUT:', chunk.toString());
            },
            onStderr: (chunk) => {
                console.error('STDERR:', chunk.toString());
            },
        });

        if (outputFirewall.stderr) {
            console.error('Ошибка при выполнении ./firewall.sh:', outputFirewall.stderr);
        } else {
            console.log('Команда ./firewall.sh выполнена успешно.');
            console.log('Результат:', outputFirewall.stdout);
        }

        // Закрываем соединение
        ssh.dispose();
    } catch (error) {
        console.error('Ошибка при подключении или выполнении команд:', error);
        throw error;
    }
};

module.exports = { connectAndExecuteCommands, refresh };