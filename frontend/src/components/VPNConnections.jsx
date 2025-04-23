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
    const [selectedProtocols, setSelectedProtocols] = useState([]); // Выбранные протоколы
    const [searchQuery, setSearchQuery] = useState(''); // Строка поиска

    const fetchConnections = async () => {
        try {
            const response = await axios.get('http://10.10.5.16:5000/api/vpn/list');
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

            await axios.delete(`http://10.10.5.16:5000/api/vpn/delete/${id}`);
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
                ? prev.filter((p) => p !== protocol)
                : [...prev, protocol]
        );
    };

    // Обработчик изменения строки поиска
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    // Извлекаем уникальные протоколы из списка подключений
    const uniqueProtocols = [...new Set(connections.map((conn) => conn.protocol_type))];

    // Фильтруем подключения на основе протоколов и поискового запроса
    const filteredConnections = connections
        .filter((conn) =>
            selectedProtocols.length > 0
                ? selectedProtocols.includes(conn.protocol_type)
                : true
        )
        .filter((conn) =>
            conn.company_name.toLowerCase().includes(searchQuery.toLowerCase())
        );

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className={styles.connectionsContainer}>
            <h3>Подключения клиентов</h3>

            {/* Фильтры и поиск */}
            <div className={styles.filtersContainer}>
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
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={styles.searchInput}
                    />
                </div>
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