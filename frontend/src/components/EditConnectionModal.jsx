import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './styles/EditConnectionModal.module.css';

const EditConnectionModal = ({ isOpen, onClose, connection, onUpdate }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showRdpPassword, setShowRdpPassword] = useState(false);
    const [showL2tpPassword, setShowL2tpPassword] = useState(false);
    const [certificateFile, setCertificateFile] = useState(null);
    const [formData, setFormData] = useState({
        connection_name: '',
        protocol_type: 'pptp',
        vpn_server_address: '',
        username: '',
        password: '',
        secret_key: '',
        company_name: '',
        rdp_server_address: '',
        rdp_domain: '',
        rdp_username: '',
        rdp_password: '',
    });

    // Загрузка данных подключения при открытии модального окна
    useEffect(() => {
        if (isOpen && connection) {
            setFormData({
                connection_name: connection.connection_name || '',
                protocol_type: connection.protocol_type || 'pptp',
                vpn_server_address: connection.vpn_server_address || '',
                username: connection.username || '',
                password: connection.password || '',
                secret_key: connection.secret_key || '',
                company_name: connection.company_name || '',
                rdp_server_address: connection.rdp_server_address || '',
                rdp_domain: connection.rdp_domain || '',
                rdp_username: connection.rdp_username || '',
                rdp_password: connection.rdp_password || '',
            });
        }

        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, connection]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleCertificateChange = (e) => {
        setCertificateFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
            alert('Пожалуйста, войдите в систему');
            window.location.href = '/login';
            return;
        }

        // Проверяем обязательные поля
        if (!formData.connection_name) {
            alert('Название подключения обязательно');
            return;
        }
        if (!formData.company_name) {
            alert('Название компании обязательно');
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach((key) => {
            // Пропускаем undefined или null значения
            if (formData[key] !== undefined && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        if (certificateFile && (formData.protocol_type === 'sstp' || formData.protocol_type === 'openvpn')) {
            data.append('certificate', certificateFile);
        }

        // Логируем отправляемые данные
        console.log('FormData to send:');
        for (let [key, value] of data.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            const apiUrl = `${process.env.REACT_APP_SERVER}/api/vpn/update/${connection.id}`;
            console.log('Sending request to:', apiUrl);
            console.log('Authorization header:', `Bearer ${token}`);
            const response = await axios.put(apiUrl, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log('Успешно:', response.data);
            alert('Подключение обновлено');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Ошибка обновления:', error);
            if (error.response?.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                alert('Ошибка при обновлении: ' + error.message);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Редактирование подключения</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formRow}>
                        <label>Название подключения: (Eng)</label>
                        <input
                            type="text"
                            name="connection_name"
                            value={formData.connection_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Протокол:</label>
                        <select
                            name="protocol_type"
                            value={formData.protocol_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="pptp">PPTP</option>
                            <option value="l2tp">L2TP</option>
                            <option value="openvpn">OpenVPN</option>
                            <option value="sstp">SSTP</option>
                            <option value="none">Без VPN</option>
                        </select>
                    </div>

                    {formData.protocol_type === 'pptp' && (
                        <>
                            <div className={styles.formRow}>
                                <label>VPN адрес сервера:</label>
                                <input
                                    type="text"
                                    name="vpn_server_address"
                                    value={formData.vpn_server_address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formRow}>
                                <label>Имя пользователя:</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formRow}>
                                <label>Пароль:</label>
                                <div className={styles.passwordInputContainer}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={styles.showPasswordButton}
                                    >
                                        {showPassword ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {formData.protocol_type === 'l2tp' && (
                        <>
                            <div className={styles.formRow}>
                                <label>VPN адрес сервера:</label>
                                <input
                                    type="text"
                                    name="vpn_server_address"
                                    value={formData.vpn_server_address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formRow}>
                                <label>Имя пользователя:</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formRow}>
                                <label>Пароль:</label>
                                <div className={styles.passwordInputContainer}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={styles.showPasswordButton}
                                    >
                                        {showPassword ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <label>L2TP ключ:</label>
                                <div className={styles.passwordInputContainer}>
                                    <input
                                        type={showL2tpPassword ? 'text' : 'password'}
                                        name="secret_key"
                                        value={formData.secret_key}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowL2tpPassword(!showL2tpPassword)}
                                        className={styles.showPasswordButton}
                                    >
                                        {showL2tpPassword ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {formData.protocol_type === 'openvpn' && (
                        <>
                            <div className={styles.formRow}>
                                <label>Файл конфигурации OpenVPN:</label>
                                <input
                                    type="file"
                                    name="certificate"
                                    onChange={handleCertificateChange}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <label>Имя пользователя:</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <label>Пароль:</label>
                                <div className={styles.passwordInputContainer}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={styles.showPasswordButton}
                                    >
                                        {showPassword ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {formData.protocol_type === 'sstp' && (
                        <>
                            <div className={styles.formRow}>
                                <label>VPN адрес сервера:</label>
                                <input
                                    type="text"
                                    name="vpn_server_address"
                                    value={formData.vpn_server_address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formRow}>
                                <label>Имя пользователя:</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <label>Пароль:</label>
                                <div className={styles.passwordInputContainer}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={styles.showPasswordButton}
                                    >
                                        {showPassword ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <label>Сертификат SSTP:</label>
                                <input
                                    type="file"
                                    name="certificate"
                                    onChange={handleCertificateChange}
                                />
                            </div>
                        </>
                    )}

                    <div className={styles.formRow}>
                        <label>Название компании:</label>
                        <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>RDP адрес сервера:</label>
                        <input
                            type="text"
                            name="rdp_server_address"
                            value={formData.rdp_server_address}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>RDP домен:</label>
                        <input
                            type="text"
                            name="rdp_domain"
                            value={formData.rdp_domain}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>RDP имя пользователя:</label>
                        <input
                            type="text"
                            name="rdp_username"
                            value={formData.rdp_username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>RDP пароль:</label>
                        <div className={styles.passwordInputContainer}>
                            <input
                                type={showRdpPassword ? 'text' : 'password'}
                                name="rdp_password"
                                value={formData.rdp_password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowRdpPassword(!showRdpPassword)}
                                className={styles.showPasswordButton}
                            >
                                {showRdpPassword ? 'Скрыть' : 'Показать'}
                            </button>
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button type="submit" className={styles.button}>
                            Сохранить
                        </button>
                        <button type="button" onClick={onClose} className={styles.closeButton}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditConnectionModal;