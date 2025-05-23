import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LuSearch, LuX } from 'react-icons/lu';
import { Tooltip } from 'react-tooltip';
import '../styles/DatePickerStyles.css';
import styles from './styles/CalendarPage.module.css';

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newEvent, setNewEvent] = useState({
        subject: '',
        startDate: null,
        endDate: null,
        description: '',
        meetingStatus: 'Q',
        attendees: [],
    });
    const [searchQueryUser, setSearchQueryUser] = useState('');
    const [searchQueryAttendees, setSearchQueryAttendees] = useState('');
    const [isDropdownUserOpen, setIsDropdownUserOpen] = useState(false);
    const [isDropdownAttendeesOpen, setIsDropdownAttendeesOpen] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filteredAttendees, setFilteredAttendees] = useState([]);

    const searchInputUserRef = useRef(null);
    const searchInputAttendeesRef = useRef(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://10.10.5.148:5000/api/bitrix/users');
                setUsers(response.data);
                setFilteredUsers(response.data);
                setFilteredAttendees(response.data);
            } catch (err) {
                setError('Ошибка загрузки пользователей');
                console.error(err);
            }
            setLoading(false);
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            setLoading(true);
            setError('');
            axios.get(`http://10.10.5.148:5000/api/calendar/events/${selectedUserId}`, { withCredentials: true })
                .then(response => {
                    setEvents(response.data);
                })
                .catch(err => {
                    setError('Ошибка загрузки событий календаря');
                    console.error(err);
                })
                .finally(() => setLoading(false));
        } else {
            setEvents([]);
        }
    }, [selectedUserId]);

    const getStatusText = (status) => {
        switch (status) {
            case 'Y': return 'Участвует';
            case 'N': return 'Отказался';
            case 'Q': return 'В ожидании';
            case 'H': return 'Организатор';
            default: return 'Неизвестно';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Y': return styles.statusConfirmed;
            case 'N': return styles.statusDeclined;
            case 'Q': return styles.statusPending;
            case 'H': return styles.statusHost;
            default: return '';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date, name) => {
        setNewEvent(prev => ({ ...prev, [name]: date }));
    };

    const handleSearchUserChange = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchQueryUser(term);
        if (term === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user =>
                user.name.toLowerCase().includes(term)
            );
            setFilteredUsers(filtered);
        }
    };

    const handleSearchAttendeesChange = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchQueryAttendees(term);
        if (term === '') {
            setFilteredAttendees(users);
        } else {
            const filtered = users.filter(user =>
                user.name.toLowerCase().includes(term)
            );
            setFilteredAttendees(filtered);
        }
    };

    const handleToggleUser = (value) => {
        setSelectedUserId(prev => (prev === value ? null : value));
        setSearchQueryUser('');
        setIsDropdownUserOpen(false);
    };

    const handleToggleAttendee = (value) => {
        setNewEvent(prev => {
            const attendees = prev.attendees.includes(value)
                ? prev.attendees.filter(id => id !== value)
                : [...prev.attendees, value];
            return { ...prev, attendees };
        });
    };

    const handleRemoveAttendee = (value) => {
        setNewEvent(prev => ({
            ...prev,
            attendees: prev.attendees.filter(id => id !== value),
        }));
    };

    const formatDateToBitrix = (date) => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';

        return date.toLocaleString('ru-RU', {
            timeZone: 'Asia/Krasnoyarsk',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!selectedUserId) {
            setError('Выберите сотрудника');
            return;
        }
        if (!newEvent.startDate || !newEvent.endDate) {
            setError('Укажите даты начала и окончания');
            return;
        }

        try {
            const eventData = {
                userId: selectedUserId,
                subject: newEvent.subject,
                startDate: formatDateToBitrix(newEvent.startDate),
                endDate: formatDateToBitrix(newEvent.endDate),
                description: newEvent.description,
                meetingStatus: newEvent.meetingStatus,
                attendees: newEvent.attendees,
            };
            console.log('Sending data:', eventData);

            await axios.post('http://10.10.5.148:5000/api/calendar/events', eventData, { withCredentials: true });

            setNewEvent({ subject: '', startDate: null, endDate: null, description: '', meetingStatus: 'Q', attendees: [] });
            setSearchQueryAttendees('');
            setSearchQueryUser('');
            setFilteredUsers(users);
            setFilteredAttendees(users);
            setError('');
            axios.get(`http://10.10.5.148:5000/api/calendar/events/${selectedUserId}`, { withCredentials: true })
                .then(response => setEvents(response.data));
        } catch (err) {
            setError('Ошибка при добавлении события');
            console.error(err);
        }
    };

    // Исправленная функция с проверкой на undefined
    const getEventTooltipContent = (event) => {
        const attendees = event.attendees || [];
        const attendeesNames = attendees
            .map(id => users.find(u => u.id === id)?.name)
            .filter(name => name)
            .join(', ');
        return attendeesNames ? `Участники: ${attendeesNames}` : 'Нет участников';
    };

    return (
        <div className={styles.container}>
            <h3>Календарь сотрудника</h3>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.formRow}>
                <label>Выберите сотрудника для календаря:</label>
                <div className={styles.multiselect}>
                    <div
                        className={styles.selectedOptions}
                        onClick={() => setIsDropdownUserOpen(!isDropdownUserOpen)}
                    >
                        {selectedUserId ? (
                            <div className={styles.selectedOption}>
                                {users.find(u => u.id === selectedUserId)?.name}
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUserId(null);
                                    }}
                                >
                                    <LuX />
                                </button>
                            </div>
                        ) : (
                            <span className={styles.placeholder}>Выберите...</span>
                        )}
                    </div>
                    {isDropdownUserOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.searchContainer}>
                                <LuSearch className={styles.searchIcon} />
                                <input
                                    ref={searchInputUserRef}
                                    type="text"
                                    value={searchQueryUser}
                                    onChange={handleSearchUserChange}
                                    placeholder="Поиск сотрудников..."
                                    className={styles.searchInput}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            {filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    className={styles.dropdownItem}
                                    onClick={() => handleToggleUser(user.id)}
                                >
                                    <input
                                        type="radio"
                                        checked={selectedUserId === user.id}
                                        readOnly
                                    />
                                    {user.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {loading && <div className={styles.loading}>Загрузка...</div>}
            {!loading && events.length === 0 && selectedUserId && <div className={styles.noEvents}>Нет событий</div>}
            {!loading && events.length > 0 && (
                <div className={styles.calendarTableContainer}>
                    <table className={styles.calendarTable}>
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Начало</th>
                                <th>Окончание</th>
                                <th>Описание</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr
                                    key={event.id}
                                    data-tooltip-id={`tooltip-${event.id}`}
                                    data-tooltip-content={getEventTooltipContent(event)}
                                    data-tooltip-place="top"
                                >
                                    <td>{event.subject}</td>
                                    <td>{formatDateForDisplay(event.start)}</td>
                                    <td>{formatDateForDisplay(event.end)}</td>
                                    <td>{event.description}</td>
                                    <td className={getStatusClass(event.meetingStatus)}>
                                        {getStatusText(event.meetingStatus)}
                                    </td>
                                    <Tooltip id={`tooltip-${event.id}`} className={styles.tooltip} />
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className={styles.addEventForm}>
                <h4>Добавить новое событие</h4>
                <form onSubmit={handleAddEvent} className={styles.form}>
                    <div className={styles.formRow}>
                        <label>Название:</label>
                        <input
                            type="text"
                            name="subject"
                            value={newEvent.subject}
                            onChange={handleInputChange}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Дата начала:</label>
                        <DatePicker
                            selected={newEvent.startDate}
                            onChange={(date) => handleDateChange(date, 'startDate')}
                            showTimeSelect
                            dateFormat="dd.MM.yyyy HH:mm"
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            placeholderText="Выберите дату и время"
                            required
                            className={styles.customDatePicker}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Дата окончания:</label>
                        <DatePicker
                            selected={newEvent.endDate}
                            onChange={(date) => handleDateChange(date, 'endDate')}
                            showTimeSelect
                            dateFormat="dd.MM.yyyy HH:mm"
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            placeholderText="Выберите дату и время"
                            required
                            className={styles.customDatePicker}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Описание:</label>
                        <textarea
                            name="description"
                            value={newEvent.description}
                            onChange={handleInputChange}
                            className={styles.textarea}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Статус:</label>
                        <select
                            name="meetingStatus"
                            value={newEvent.meetingStatus}
                            onChange={handleInputChange}
                            className={styles.select}
                        >
                            <option value="Y">Участвует</option>
                            <option value="N">Отказался</option>
                            <option value="Q">В ожидании</option>
                        </select>
                    </div>
                    <div className={styles.formRow}>
                        <label>Участники встречи:</label>
                        <div className={styles.multiselect}>
                            <div
                                className={styles.selectedOptions}
                                onClick={() => setIsDropdownAttendeesOpen(!isDropdownAttendeesOpen)}
                            >
                                {newEvent.attendees.map(id => {
                                    const user = users.find(u => u.id === id);
                                    return (
                                        <div key={id} className={styles.selectedOption}>
                                            {user?.name}
                                            <button
                                                type="button"
                                                className={styles.removeButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveAttendee(id);
                                                }}
                                            >
                                                <LuX />
                                            </button>
                                        </div>
                                    );
                                })}
                                {isDropdownAttendeesOpen ? (
                                    <div className={styles.searchContainer}>
                                        <LuSearch className={styles.searchIcon} />
                                        <input
                                            ref={searchInputAttendeesRef}
                                            type="text"
                                            value={searchQueryAttendees}
                                            onChange={handleSearchAttendeesChange}
                                            placeholder="Поиск сотрудников..."
                                            className={styles.searchInput}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ) : newEvent.attendees.length === 0 ? (
                                    <span className={styles.placeholder}>Выберите...</span>
                                ) : null}
                            </div>
                            {isDropdownAttendeesOpen && (
                                <div className={styles.dropdown}>
                                    {filteredAttendees.map(user => (
                                        <div
                                            key={user.id}
                                            className={styles.dropdownItem}
                                            onClick={() => handleToggleAttendee(user.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={newEvent.attendees.includes(user.id)}
                                                readOnly
                                            />
                                            {user.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className={styles.submitButton}>
                        Добавить
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CalendarPage;