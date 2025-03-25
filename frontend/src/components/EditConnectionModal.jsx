import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './styles/EditConnectionModal.module.css';

const EditConnectionModal = ({ isOpen, onClose, connection }) => {

    
    const [certificateFile, setCertificateFile] = useState(null);
    
    const [formData, setFormData] = useState({
        connection_name: '',
        protocol_type: '',
        vpn_server_address: '',
        username: '',
        password: '',
        connection_number: '',
        secret_key: '',
        certificate: '',
        config_file: '',
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
                protocol_type: connection.protocol_type || '',
                vpn_server_address: connection.vpn_server_address || '',
                username: connection.username || '',
                password: connection.password || '',
                connection_number: connection.connection_number || '',
                secret_key: connection.secret_key || '',
                certificate: connection.certificate || '',
                config_file: connection.config_file || '',
                company_name: connection.company_name || '',
                rdp_server_address: connection.rdp_server_address || '',
                rdp_domain: connection.rdp_domain || '',
                rdp_username: connection.rdp_username || '',
                rdp_password: connection.rdp_password || '',
            });
        }
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

        let certificatePath = formData.certificate;
        if (certificateFile) {
            const formDataCert = new FormData();
            formDataCert.append('certificate', certificateFile);

            try {
                const response = await axios.post(
                    'http://localhost:5000/api/vpn/upload-certificate',
                    formDataCert,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
                certificatePath = response.data.path;
            } catch (error) {
                console.error('Ошибка загрузки сертификата:', error);
                alert('Ошибка загрузки сертификата');
                return;
            }
        }

        const updatedFormData = {
            ...formData,
            certificate: certificatePath,
        };

        try {
            await axios.put(
                `http://localhost:5000/api/vpn/update/${connection.id}`,
                formData
            );
            alert('Подключение обновлено');
            onClose();
        } catch (error) {
            console.error('Ошибка обновления:', error);
            alert('Ошибка обновления');
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
                    <div className={styles.formRow}>
                        <label>VPN адрес сервера:</label>
                        <input
                            type="text"
                            name="vpn_server_address"
                            value={formData.vpn_server_address}
                            onChange={handleChange}
                            required={formData.protocol_type !== 'none'}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Имя пользователя:</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required={formData.protocol_type === 'pptp'}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Пароль:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={formData.protocol_type === 'pptp'}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Номер соединения:</label>
                        <input
                            type="text"
                            name="connection_number"
                            value={formData.connection_number}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>L2TP ключ:</label>
                        <input
                            type="text"
                            name="secret_key"
                            value={formData.secret_key}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Сертификат SSTP:</label>
                        <input
                            type="file"
                            name="certificate" 
                            onChange={handleCertificateChange}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Файл конфигурации OpenVPN:</label>
                        <input
                            type="text"
                            name="config_file"
                            value={formData.config_file}
                            onChange={handleChange}
                        />
                    </div>
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
                        <input
                            type="password"
                            name="rdp_password"
                            value={formData.rdp_password}
                            onChange={handleChange}
                            required
                        />
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