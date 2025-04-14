import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './styles/SSHStatus.module.css';

const SSHStatus = () => {
    const [interfaces, setInterfaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Функция для получения интерфейсов
    const fetchInterfaces = async () => {
        try {
            const response = await axios.get('http://10.10.5.148:5000/api/ssh/interfaces');
            setInterfaces(response.data.interfaces);
            setLoading(false);
        } catch (err) {
            setError('Ошибка получения интерфейсов');
            setLoading(false);
        }
    }; 
    

    // Функция для обновления подключения
    const handleRefresh = async () => {
        try {
            await axios.post('http://10.10.5.148:5000/api/ssh/refresh');
            alert('Подключения успешно обновлены');
            fetchInterfaces(); // После обновления заново загружаем интерфейсы
        } catch (err) {
            alert('Ошибка обновления');
        }
    };

    // Загрузка данных при монтировании компонента
    useEffect(() => {
        fetchInterfaces();
    }, []);

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className={styles.sshStatus}>
            <header className={styles.header}>
                <h3>Активные интерфейсы</h3>
                <button className={styles.refreshButton} onClick={handleRefresh}>
                    Перезагрузить интерфейсы
                </button>
            </header>
            <div className={styles.interfacesGrid}>
                {interfaces.map((iface, index) => (
                    <div
                        key={index}
                        className={styles.interfaceItem}
                        title={iface.company_name || 'Нет имени'} // Показываем connection_name при наведении
                    >
                        {iface.interface}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SSHStatus;