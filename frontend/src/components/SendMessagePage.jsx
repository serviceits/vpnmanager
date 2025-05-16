import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LuInfo } from 'react-icons/lu';
import styles from './styles/SendMessagePage.module.css';

const SendMessagePage = () => {
    const [message, setMessage] = useState('');
    const [dialogId, setDialogId] = useState('chat94805');
    const [status, setStatus] = useState('');
    const [preview, setPreview] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);

    const textareaRef = useRef(null);
    const previewRef = useRef(null);

    // Преобразование BB-кода в HTML для предварительного просмотра
    const convertBbCodeToHtml = (text) => {
        let html = text
            .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
            .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
            .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
        return html;
    };

    const handleMessageChange = (e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        setPreview(convertBbCodeToHtml(newMessage));
    };

    // Автоматическое изменение высоты textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto'; // Сбрасываем высоту
        textarea.style.height = `${textarea.scrollHeight}px`; // Устанавливаем новую высоту
    }, [message]);

    // Автоматическое изменение высоты предпросмотра
    useEffect(() => {
        const preview = previewRef.current;
        preview.style.height = 'auto'; // Сбрасываем высоту
        preview.style.height = `${preview.scrollHeight}px`; // Устанавливаем новую высоту
    }, [preview]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            BOT_ID: 3109,
            DIALOG_ID: dialogId,
            CLIENT_ID: 'pl3mnftivgsf2ellmu9qm2jx1qawn4p6',
            MESSAGE: message, // Отправляем сырой текст с BB-кодом
        };

        try {
            const response = await axios.post('https://serve-it.bitrix24.ru/rest/1771/io33ordgzhi7piwr/imbot.message.add.json', payload);
            setStatus('Сообщение успешно отправлено!');
            setMessage(''); // Очищаем поле после успешной отправки
            setPreview(''); // Очищаем предпросмотр
            setShowTooltip(false); // Скрываем подсказку после отправки
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            setStatus('Ошибка при отправке: ' + (error.response?.data?.error_description || 'Неизвестная ошибка'));
        }
    };

    return (
        <div className={styles.container}>
            <h3>Отправка сообщения</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                    <label>Выберите диалог:</label>
                    <select
                        value={dialogId}
                        onChange={(e) => setDialogId(e.target.value)}
                        className={styles.select}
                    >
                        <option value="chat96">Общий чат</option>
                        <option value="chat94805">Тестовый ИИ чат Игорь</option>
                        <option value="chat94747">Тестовый ИИ чат Сергей</option>
                    </select>
                </div>
                <div className={styles.formRow}>
                    <label>Сообщение:</label>
                    <div className={styles.textareaWrapper}>
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleMessageChange}
                            placeholder="Введите текст сообщения с BB-кодом..."
                            className={styles.textarea}
                            required
                        />
                        <span
                            className={styles.infoIcon}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            <LuInfo size={20} />
                            {showTooltip && (
                                <div className={styles.tooltip}>
                                    <p>Поддерживаемые BB-коды:</p>
                                    <ul>
                                        <li><code>[b]текст[/b]</code> — жирный текст</li>
                                        <li><code>[i]текст[/i]</code> — курсив</li>
                                        <li><code>[u]текст[/u]</code> — подчёркнутый</li>
                                        <li><code>[url=https://www.site.ru]Ссылка[/url]</code> — ссылка</li>
                                    </ul>
                                </div>
                            )}
                        </span>
                    </div>
                </div>
                <div className={styles.formRow}>
                    <label>Предпросмотр:</label>
                    <div
                        ref={previewRef}
                        className={styles.preview}
                        dangerouslySetInnerHTML={{ __html: preview }}
                    />
                </div>
                <div className={styles.formActions}>
                    <button type="submit" className={styles.button}>
                        Отправить
                    </button>
                </div>
                {status && <div className={styles.status}>{status}</div>}
            </form>
        </div>
    );
};

export default SendMessagePage;