import React, { useContext, useState } from 'react';
import styles from './styles/Dashboard.module.css';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SSHStatus from './SSHStatus';
import AddConnectionModal from './AddConnectionModal';
import VPNConnections from './VPNConnections';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    console.log('User in Dashboard:', user);
    if (user === undefined) {
        return <div>Загрузка...</div>;  
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }




    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>Дэшборд</h2>
                <div className={styles.headerActions}>
                    <button
                        className={styles.addButton}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Добавить подключение
                    </button>
                    <button className={styles.logoutButton} onClick={logout}>
                        Выход
                    </button>
                </div>
            </header>
            <main className={styles.content}>
                <div className={styles.section}>
                    <SSHStatus />
                </div>
                <div className={styles.section}>
                    <VPNConnections />
                </div>
            </main>
            <AddConnectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default Dashboard;