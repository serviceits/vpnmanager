import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './styles/AddConnectionModal.module.css';

const AddConnectionModal = ({ isOpen, onClose }) => {
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

    // Блокировка прокрутки при открытии модалки
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Очистка при размонтировании
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

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

        const data = new FormData();
        Object.keys(formData).forEach((key) => {
            data.append(key, formData[key]);
        });

        if (certificateFile && (formData.protocol_type === 'sstp' || formData.protocol_type === 'openvpn')) {
            data.append('certificate', certificateFile);
        }

        try {
            const response = await axios.post('http://10.10.5.16:5000/api/vpn/add', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Успешно:', response.data);
            alert('Подключение добавлено');
            setFormData({
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
            setCertificateFile(null);
            onClose();
        } catch (error) {
            console.error('Ошибка добавления:', error);
            alert('Ошибка при добавлении: ' + error.message);
        }
    }; 

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} >
            <div className={styles.modal}>
                <h2>Добавление подключения</h2>
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
                            Добавить
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

export default AddConnectionModal;