import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './styles/VPNConnections.module.css';
import EditConnectionModal from './EditConnectionModal';

const VPNConnections = () => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState(null);

    const fetchConnections = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/vpn/list');
            setConnections(response.data);
            setLoading(false);
        } catch (err) {
            setError('Не могу найти подключения');
            setLoading(false);
        }
    };
    const handleEdit = (conn) => {
        setSelectedConnection(conn);
        setIsEditModalOpen(true);
    };
    const handleDelete = async (id) => {
        try {
            if (!window.confirm('Вы точно хотите удалить подключение?')) return;

            await axios.delete(`http://localhost:5000/api/vpn/delete/${id}`);
            alert('Успешно удалено');
            fetchConnections(); // Обновляем список после удаления
        } catch (error) {
            console.error('Ошибка удаления подключения:', error);
            alert('Ошибка удаления подключения');
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>; 
    

    return (
        <div className={styles.connectionsContainer}>
            <h3>Подключения клиентов</h3>
            <table className={styles.connectionsTable}>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Протокол</th>
                        <th>Адрес VPN сервера</th> 
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {connections.map((conn) => (
                        <tr key={conn.id}>
                            <td>{conn.company_name}</td>
                            <td>{conn.protocol_type}</td>
                            <td>{conn.vpn_server_address}</td> 
                            <td>
                                <button
                                    className={styles.editButton}
                                    onClick={() => handleEdit(conn)}
                                >
                                    Редактировать
                                </button>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(conn.id)}
                                >
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <EditConnectionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                connection={selectedConnection}
            />
        </div>
    );
};

export default VPNConnections;