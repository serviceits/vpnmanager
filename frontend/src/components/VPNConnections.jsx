import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import styles from './styles/VPNConnections.module.css';
import EditConnectionModal from './EditConnectionModal';

const VPNConnections = () => {
    const { user } = useContext(AuthContext);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [selectedProtocols, setSelectedProtocols] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_SERVER}/api/vpn/list`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setConnections(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Ошибка загрузки подключений:', error);
                setError('Не могу найти подключения');
                setLoading(false);
            }
        };
        fetchConnections();
    }, []);

    const handleEdit = (conn) => {
        setSelectedConnection(conn);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить это подключение?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_SERVER}/api/vpn/delete/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                alert('Успешно удалено');
                setConnections(connections.filter((conn) => conn.id !== id));
            } catch (error) {
                console.error('Ошибка удаления подключения:', error);
                alert('Ошибка удаления: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
            }
        }
    };

    const handleProtocolChange = (protocol) => {
        setSelectedProtocols((prev) =>
            prev.includes(protocol)
                ? prev.filter((p) => p !== protocol)
                : [...prev, protocol]
        );
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const uniqueProtocols = [...new Set(connections.map((conn) => conn.protocol_type))];

    const filteredConnections = connections
        .filter((conn) =>
            selectedProtocols.length > 0
                ? selectedProtocols.includes(conn.protocol_type)
                : true
        )
        .filter((conn) =>
            conn.company_name.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // Права пользователя
    const canEdit = user?.permissions?.can_edit_connections || false;
    const canDelete = user?.permissions?.can_delete_connections || false;

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className={styles.connectionsContainer}>
            <h3>Подключения клиентов</h3>

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
                                    disabled={!canEdit}
                                    title={canEdit ? '' : 'Нет прав'}
                                >
                                    Редактировать
                                </button>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(conn.id)}
                                    disabled={!canDelete}
                                    title={canDelete ? '' : 'Нет прав'}
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