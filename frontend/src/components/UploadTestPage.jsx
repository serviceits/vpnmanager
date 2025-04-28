import React, { useState } from 'react';
import axios from 'axios';
import styles from './styles/UploadTestPage.module.css';

const UploadTestPage = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage('Пожалуйста, выберите файл');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER}/api/vpn/upload-test`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage(response.data.message);
            console.log('Ответ сервера:', response.data);
            setFile(null); // Очищаем поле после успеха
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            setMessage(`Ошибка: ${error.response?.data || error.message}`);
        }
    };

    return (
        <div className={styles.container}>
            <h2>Тестовая загрузка файла на Linux VM</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                    <label>Выберите файл:</label>
                    <input type="file" onChange={handleFileChange} />
                </div>
                <button type="submit" className={styles.button}>
                    Загрузить
                </button>
            </form>
            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
};

export default UploadTestPage;