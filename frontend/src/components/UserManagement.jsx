import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import styles from './styles/UserManagement.module.css';

const UserManagement = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        userrole: 'user',
        permissions: {
            can_create_connections: false,
            can_edit_connections: false,
            can_delete_connections: false,
            can_create_users: false,
        },
    });
    const [editUser, setEditUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://10.10.5.16:5000/api/users', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            console.log('Fetched users:', response.data);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Ошибка загрузки пользователей');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData({
                ...formData,
                permissions: {
                    ...formData.permissions,
                    [name]: checked,
                },
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://10.10.5.16:5000/api/auth/register', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            alert('Пользователь зарегистрирован');
            setFormData({
                username: '',
                password: '',
                userrole: 'user',
                permissions: {
                    can_create_connections: false,
                    can_edit_connections: false,
                    can_delete_connections: false,
                    can_create_users: false,
                },
            });
            fetchUsers();
        } catch (error) {
            console.error('Registration error:', error.response?.data);
            alert('Ошибка регистрации: ' + error.response?.data?.error);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
            try {
                const response = await axios.delete(`http://10.10.5.16:5000/api/auth/users/${userId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                alert(response.data.message);
                fetchUsers();
            } catch (error) {
                console.error('Delete error:', error.response?.data);
                alert('Ошибка удаления: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
            }
        }
    };

    const handleEdit = (u) => {
        console.log('Editing user:', u);
        setEditUser(u);
        setFormData({
            username: u.username,
            password: '',
            userrole: u.userrole || 'user',
            permissions: u.permissions || {
                can_create_connections: false,
                can_edit_connections: false,
                can_delete_connections: false,
                can_create_users: false,
            },
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://10.10.5.16:5000/api/auth/users/${editUser.id}`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            alert('Пользователь обновлён');
            setEditUser(null);
            setFormData({
                username: '',
                password: '',
                userrole: 'user',
                permissions: {
                    can_create_connections: false,
                    can_edit_connections: false,
                    can_delete_connections: false,
                    can_create_users: false,
                },
            });
            fetchUsers();
        } catch (error) {
            console.error('Update error:', error.response?.data);
            alert('Ошибка обновления: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
        }
    };

    const cancelEdit = () => {
        setEditUser(null);
        setFormData({
            username: '',
            password: '',
            userrole: 'user',
            permissions: {
                can_create_connections: false,
                can_edit_connections: false,
                can_delete_connections: false,
                can_create_users: false,
            },
        });
    };

    if (!user || user.userrole !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>Управление пользователями</h2>
                <button
                    className={styles.dashboardButton}
                    onClick={() => navigate('/')}
                >
                    Дэшборд
                </button>
            </header>
            <section className={styles.formSection}>
                <h3>{editUser ? 'Редактировать пользователя' : 'Добавить пользователя'}</h3>
                <form onSubmit={editUser ? handleUpdate : handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Имя пользователя:</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            disabled={editUser}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Пароль:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder={editUser ? 'Оставьте пустым, чтобы не менять' : 'Введите пароль'}
                            required={!editUser}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Роль:</label>
                        <select
                            name="userrole"
                            value={formData.userrole}
                            onChange={handleInputChange}
                        >
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                            <option value="user">User</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Права:</label>
                        <div className={styles.checkboxGroup}>
                            <label>
                                <input
                                    type="checkbox"
                                    name="can_create_connections"
                                    checked={formData.permissions.can_create_connections}
                                    onChange={handleInputChange}
                                    disabled={formData.userrole === 'user'}
                                />
                                Создание подключений
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="can_edit_connections"
                                    checked={formData.permissions.can_edit_connections}
                                    onChange={handleInputChange}
                                    disabled={formData.userrole === 'user'}
                                />
                                Редактирование подключений
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="can_delete_connections"
                                    checked={formData.permissions.can_delete_connections}
                                    onChange={handleInputChange}
                                    disabled={formData.userrole === 'user'}
                                />
                                Удаление подключений
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="can_create_users"
                                    checked={formData.permissions.can_create_users}
                                    onChange={handleInputChange}
                                    disabled={formData.userrole === 'user'}
                                />
                                Создание пользователей
                            </label>
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button type="submit" className={styles.submitButton}>
                            {editUser ? 'Обновить' : 'Зарегистрировать'}
                        </button>
                        {editUser && (
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={cancelEdit}
                            >
                                Отмена
                            </button>
                        )}
                    </div>
                </form>
            </section>
            <section className={styles.userList}>
                <h3>Список пользователей</h3>
                <table className={styles.userTable}>
                    <thead>
                        <tr>
                            <th>Имя пользователя</th>
                            <th>Роль</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.username}</td>
                                <td>{u.userrole}</td>
                                <td>
                                    <button
                                        className={styles.editButton}
                                        onClick={() => handleEdit(u)}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleDelete(u.id)}
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default UserManagement;