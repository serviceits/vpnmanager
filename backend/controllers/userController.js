const { executeQuery } = require('../db');

exports.updatePermissions = async (req, res) => {
    const { userId } = req.params;
    const { can_create_connections, can_edit_connections, can_delete_connections, can_create_users } = req.body;

    try {
        const query = `
            MERGE INTO permissions AS target
            USING (SELECT @user_id AS user_id) AS source
            ON target.user_id = source.user_id
            WHEN MATCHED THEN
                UPDATE SET
                    can_create_connections = @can_create,
                    can_edit_connections = @can_edit,
                    can_delete_connections = @can_delete,
                    can_create_users = @can_create_users
            WHEN NOT MATCHED THEN
                INSERT (user_id, can_create_connections, can_edit_connections, can_delete_connections, can_create_users)
                VALUES (@user_id, @can_create, @can_edit, @can_delete, @can_create_users);
        `;
        await executeQuery(query, {
            user_id: userId,
            can_create: can_create_connections ? 1 : 0,
            can_edit: can_edit_connections ? 1 : 0,
            can_delete: can_delete_connections ? 1 : 0,
            can_create_users: can_create_users ? 1 : 0,
        });
        res.json({ message: 'Права обновлены' });
    } catch (error) {
        console.error('Ошибка обновления прав:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.username, u.userrole,
                   p.can_create_connections, p.can_edit_connections, p.can_delete_connections, p.can_create_users
            FROM users u
            LEFT JOIN permissions p ON u.id = p.user_id
        `;
        const users = await executeQuery(query);

        // Форматируем данные для фронтенда
        const formattedUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            userrole: user.userrole,
            permissions: {
                can_create_connections: !!user.can_create_connections,
                can_edit_connections: !!user.can_edit_connections,
                can_delete_connections: !!user.can_delete_connections,
                can_create_users: !!user.can_create_users,
            },
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};