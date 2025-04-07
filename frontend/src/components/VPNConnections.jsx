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
    const [selectedProtocols, setSelectedProtocols] = useState([]); // Состояние для выбранных протоколов

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

    // Обработчик изменения состояния чекбокса
    const handleProtocolChange = (protocol) => {
        setSelectedProtocols((prev) =>
            prev.includes(protocol)
                ? prev.filter((p) => p !== protocol) // Убираем, если уже выбран
                : [...prev, protocol] // Добавляем, если не выбран
        );
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    // Извлекаем уникальные протоколы из списка подключений
    const uniqueProtocols = [...new Set(connections.map((conn) => conn.protocol_type))];

    // Фильтруем подключения на основе выбранных протоколов
    const filteredConnections =
        selectedProtocols.length > 0
            ? connections.filter((conn) => selectedProtocols.includes(conn.protocol_type))
            : connections;

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className={styles.connectionsContainer}>
            <h3>Подключения клиентов</h3>

            {/* Чекбоксы для протоколов */}
            <div className={styles.protocolFilters}>
                {uniqueProtocols.map((protocol) => (
                    <label key={protocol} className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={selectedProtocols.includes(protocol)}
                            onChange={() => handleProtocolChange(protocol)}
                        />
                        {protocol}
                    </label>
                ))}
            </div>

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
                    {filteredConnections.map((conn) => (
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