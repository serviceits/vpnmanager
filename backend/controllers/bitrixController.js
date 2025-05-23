const axios = require('axios');
const { poolmysql } = require('../db'); // Явно импортируем poolmysql

exports.getBitrixUsers = async (req, res) => {
    try {
        let allUsers = [];
        let start = 0;

        // Сначала загружаем пользователей
        while (true) {
            const response = await axios.get('https://serve-it.bitrix24.ru/rest/1771/io33ordgzhi7piwr/user.get', {
                params: {
                    ADMIN_MODE: true,
                    start,
                    FILTER: { ACTIVE: true, "!=UF_DEPARTMENT": false },
                },
            });
            const usersList = response.data.result
                .filter(user => user.UF_DEPARTMENT && user.UF_DEPARTMENT.length > 0) // Фильтруем пользователей с пустым UF_DEPARTMENT
                .map(user => ({
                    id: user.ID,
                    first_name: user.NAME || null,
                    last_name: user.LAST_NAME || null,
                    middle_name: user.SECOND_NAME || null,
                    department_ids: user.UF_DEPARTMENT ? user.UF_DEPARTMENT.join(',') : null, // ID отделов через запятую
                    position: user.WORK_POSITION || null,
                    last_login: user.LAST_LOGIN ? new Date(user.LAST_LOGIN).toISOString().slice(0, 19).replace('T', ' ') : null,
                    date_register: user.DATE_REGISTER ? new Date(user.DATE_REGISTER).toISOString().slice(0, 19).replace('T', ' ') : null,
                }));
            allUsers = [...allUsers, ...usersList];

            for (const user of usersList) {
                // Сохранение пользователя в таблицу users
                await poolmysql.query(
                    `INSERT INTO users_bitrix (id, first_name, last_name, middle_name, position, department, last_login, date_register) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE 
                     first_name = VALUES(first_name), 
                     last_name = VALUES(last_name), 
                     middle_name = VALUES(middle_name), 
                     position = VALUES(position), 
                     department = VALUES(department), 
                     last_login = VALUES(last_login), 
                     date_register = VALUES(date_register)`,
                    [
                        user.id,
                        user.first_name,
                        user.last_name,
                        user.middle_name,
                        user.position,
                        user.department_ids, // Сохраняем ID отделов
                        user.last_login,
                        user.date_register
                    ]
                );
            }

            if (usersList.length < 50) break;
            start += 50;
        }

        // Загрузка подразделений из Bitrix24
        const departmentsResponse = await axios.get('https://serve-it.bitrix24.ru/rest/1771/io33ordgzhi7piwr/department.get', {
            params: { ADMIN_MODE: true }
        });
        const departmentsList = departmentsResponse.data.result;

        // Сохранение подразделений в таблицу departments
        for (const dept of departmentsList) {
            // Если head равен '0' или отсутствует, устанавливаем null
            const headValue = dept.UF_HEAD && dept.UF_HEAD !== '0' ? dept.UF_HEAD : null;

            await poolmysql.query(
                `INSERT INTO departments (id, name, parent, head) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 name = VALUES(name), 
                 parent = VALUES(parent), 
                 head = VALUES(head)`,
                [
                    dept.ID,
                    dept.NAME,
                    dept.PARENT || null,
                    headValue
                ]
            );
        }

        res.json(allUsers.map(user => ({
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.id.toString()
        })));
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};