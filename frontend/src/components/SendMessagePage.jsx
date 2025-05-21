import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LuInfo, LuSearch, LuX } from 'react-icons/lu';
import styles from './styles/SendMessagePage.module.css';

const SendMessagePage = () => {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const [preview, setPreview] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);
    const [isGroupSelected, setIsGroupSelected] = useState(true);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const textareaRef = useRef(null);
    const previewRef = useRef(null);
    const searchInputRef = useRef(null);

    // Преобразование BB-кода в HTML для предварительного просмотра
    const convertBbCodeToHtml = (text) => {
        let html = text
            .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
            .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
            .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
        return html;
    };

    // Загрузка пользователей через API бэкенда
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const response = await axios.get('http://10.10.5.148:5000/api/bitrix/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Ошибка при загрузке пользователей с бэкенда:', error);
            }
            setLoadingUsers(false);
        };
        fetchUsers();
    }, []);

    const handleMessageChange = (e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        setPreview(convertBbCodeToHtml(newMessage));
    };

    // Автоматическое изменение высоты textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [message]);

    // Автоматическое изменение высоты предпросмотра
    useEffect(() => {
        const preview = previewRef.current;
        preview.style.height = 'auto';
        preview.style.height = `${preview.scrollHeight}px`;
    }, [preview]);

    // Фокусировка на поле поиска при открытии выпадающего списка
    useEffect(() => {
        if (isDropdownOpen && !isGroupSelected && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isDropdownOpen, isGroupSelected]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = selectedOptions.map(option => ({
            BOT_ID: 3109,
            DIALOG_ID: isGroupSelected ? option : option,
            CLIENT_ID: 'pl3mnftivgsf2ellmu9qm2jx1qawn4p6',
            MESSAGE: message,
        }));

        try {
            for (const data of payload) {
                await axios.post('https://serve-it.bitrix24.ru/rest/1771/io33ordgzhi7piwr/imbot.message.add.json', data);
            }
            setStatus('Сообщение успешно отправлено!');
            setMessage('');
            setPreview('');
            setShowTooltip(false);
            setIsDropdownOpen(false);
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            setStatus('Ошибка при отправке: ' + (error.response?.data?.error_description || 'Неизвестная ошибка'));
        }
    };

    const handleToggleOption = (value) => {
        setSelectedOptions(prev =>
            prev.includes(value)
                ? prev.filter(item => item !== value)
                : [...prev, value]
        );
    };

    const handleRemoveOption = (value) => {
        setSelectedOptions(prev => prev.filter(item => item !== value));
    };

    const groupOptions = [
        { value: 'chat96', label: 'Общий чат' },
        { value: 'chat94805', label: 'Тестовый ИИ чат Игорь' },
        { value: 'chat94747', label: 'Тестовый ИИ чат Сергей' },
    ];

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <h3>Отправка сообщения</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                    <div className={styles.checkboxRow}>
                        <label>
                            <input
                                type="checkbox"
                                checked={isGroupSelected}
                                onChange={(e) => {
                                    setIsGroupSelected(e.target.checked);
                                    setSelectedOptions(isGroupSelected ? [] : ['chat94805']);
                                    setSearchQuery('');
                                    setIsDropdownOpen(false);
                                }}
                            /> Группа
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={!isGroupSelected}
                                onChange={(e) => {
                                    setIsGroupSelected(!e.target.checked);
                                    setSelectedOptions(!isGroupSelected ? [] : ['chat94805']);
                                    setSearchQuery('');
                                    setIsDropdownOpen(false);
                                }}
                            /> Пользователи
                        </label>
                    </div>
                </div>
                <div className={styles.formRow}>
                    <label>Выберите получателя(ей):</label>
                    <div className={styles.multiselect}>
                        <div
                            className={styles.selectedOptions}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {selectedOptions.map(option => {
                                const label = isGroupSelected
                                    ? groupOptions.find(g => g.value === option)?.label
                                    : users.find(u => u.id === option)?.name;
                                return (
                                    <div key={option} className={styles.selectedOption}>
                                        {label}
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveOption(option);
                                            }}
                                        >
                                            <LuX />
                                        </button>
                                    </div>
                                );
                            })}
                            {isDropdownOpen && !isGroupSelected ? (
                                <div className={styles.searchContainer}>
                                    <LuSearch className={styles.searchIcon} />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Поиск пользователей..."
                                        className={styles.searchInput}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            ) : selectedOptions.length === 0 ? (
                                <span className={styles.placeholder}>Выберите...</span>
                            ) : null}
                        </div>
                        {isDropdownOpen && (
                            <div className={styles.dropdown}>
                                {(isGroupSelected ? groupOptions : filteredUsers).map(option => (
                                    <div
                                        key={option.value || option.id}
                                        className={styles.dropdownItem}
                                        onClick={() => handleToggleOption(option.value || option.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedOptions.includes(option.value || option.id)}
                                            readOnly
                                        />
                                        {option.label || option.name}
                                    </div>
                                ))}
                                {loadingUsers && <div className={styles.status}>Загрузка пользователей...</div>}
                            </div>
                        )}
                    </div>
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
                                        <li><code>[u]текст[/u]</code> — подчёркнутый текст</li>
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