import React, { useContext, useState } from 'react';
import styles from './styles/Dashboard.module.css';
import { AuthContext } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import SSHStatus from './SSHStatus';
import AddConnectionModal from './AddConnectionModal';
import VPNConnections from './VPNConnections';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    console.log('User in Dashboard:', user);

    if (user === undefined) {
        return <div>Загрузка...</div>;
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const permissions = user.permissions || {
        can_create_connections: false,
        can_edit_connections: false,
        can_delete_connections: false,
        can_create_users: false,
    };

    const canCreate = user.userrole === 'admin' || permissions.can_create_connections === true || permissions.can_create_connections === 1;
    const canEdit = user.userrole === 'admin' || permissions.can_edit_connections === true || permissions.can_edit_connections === 1;
    const canDelete = user.userrole === 'admin' || permissions.can_delete_connections === true || permissions.can_delete_connections === 1;

    const canViewVPNConnections = ['admin', 'moderator'].includes(user.userrole);

    console.log('Permissions:', { canCreate, canEdit, canDelete, canViewVPNConnections });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>Дэшборд</h2>
                <div className={styles.headerActions}>
                    {canCreate && (
                        <button
                            className={styles.addButton}
                            onClick={() => setIsModalOpen(true)}
                        >
                            Добавить подключение
                        </button>
                    )}
                    {user.userrole === 'admin' && (
                        <button
                            className={styles.addButton}
                            onClick={() => navigate('/user-management')}
                        >
                            Управление пользователями
                        </button>
                    )}
                    <button className={styles.logoutButton} onClick={logout}>
                        Выход
                    </button>
                    <div className={styles.userInfo}>
                        <span>Логин: {user.username}</span>
                        <span>Роль: {user.userrole}</span>
                    </div>
                </div>
            </header>
            <main className={styles.content}>
                <div className={styles.section}>
                    <SSHStatus />
                </div>
                {canViewVPNConnections ? (
                    <div className={styles.section}>
                        <VPNConnections canEdit={canEdit} canDelete={canDelete} />
                    </div>
                ) : (
                    <div className={styles.section}>
                        <p>Доступ к списку подключений ограничен. Обратитесь к администратору.</p>
                    </div>
                )}
            </main>
            {canCreate && (
                <AddConnectionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;