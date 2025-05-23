const axios = require('axios');
const { poolmysql } = require('../db');

// Функция для преобразования строки даты из формата DD.MM.YYYY HH:mm:ss в ISO 8601 с учётом смещения Asia/Krasnoyarsk (+7 часов)
const parseBitrixDate = (dateString) => {
    if (!dateString) return null;

    const [datePart, timePart] = dateString.split(' ');
    if (!datePart || !timePart) return null;

    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = timePart.split(':');

    if (!day || !month || !year || !hours || !minutes || !seconds) return null;

    // Создаём дату без явного смещения
    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    let date = new Date(isoString);

    // Корректируем на +7 часов (Asia/Krasnoyarsk, UTC+7)
    date.setHours(date.getHours() + 7);

    return !isNaN(date.getTime()) ? date.toISOString().split('.')[0] : null; // Убираем миллисекунды
};

// Функция для форматирования даты в ISO 8601 (YYYY-MM-DDThh:mm:ss) с учётом часового пояса
const formatDateToISO = (dateInput) => {
    if (!dateInput) return '';

    // Если dateInput — строка в формате DD.MM.YYYY HH:mm:ss, преобразуем её
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}\s\d{2}:\d{2}:\d{2}$/;
    if (typeof dateInput === 'string' && dateRegex.test(dateInput)) {
        const isoDate = parseBitrixDate(dateInput);
        return isoDate ? isoDate : ''; // Убираем миллисекунды
    }

    // Если dateInput — объект Date, форматируем его
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    return date.toISOString().split('.')[0]; // Убираем миллисекунды
};

exports.getCalendarEvents = async (req, res) => {
    const { userId } = req.params;

    try {
        const response = await axios.get('https://serve-it.bitrix24.ru/rest/1771/io33ordgzhi7piwr/calendar.event.get', {
            params: {
                ADMIN_MODE: true,
                type: 'user',
                ownerId: userId,
                from: new Date().toISOString().split('T')[0],
                to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
        });

        const events = response.data.result.map(event => {
            console.log('Raw event dates from Bitrix24:', { DATE_FROM: event.DATE_FROM, DATE_TO: event.DATE_TO });
            return {
                id: event.ID,
                subject: event.NAME || 'Без названия',
                start: parseBitrixDate(event.DATE_FROM),
                end: parseBitrixDate(event.DATE_TO),
                description: event.DESCRIPTION || '',
                meetingStatus: event.MEETING_STATUS || 'N/A',
            };
        });

        res.json(events);
    } catch (error) {
        console.error('Ошибка при загрузке событий календаря:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.addCalendarEvent = async (req, res) => {
    const { userId, subject, startDate, endDate, description, meetingStatus, attendees } = req.body;

    console.log('Received data:', { userId, subject, startDate, endDate, description, meetingStatus, attendees });

    try {
        // Преобразуем даты в ISO 8601
        const formattedStartDate = formatDateToISO(startDate);
        const formattedEndDate = formatDateToISO(endDate);

        console.log('Formatted dates:', { formattedStartDate, formattedEndDate });

        if (!formattedStartDate || !formattedEndDate) {
            return res.status(400).json({ error: 'Некорректный формат даты' });
        }

        // Подготовка данных для встречи
        const isMeeting = Array.isArray(attendees) && attendees.length > 0;
        const meetingData = isMeeting
            ? {
                is_meeting: 'Y',
                attendees: attendees.map(id => parseInt(id)), // Убедимся, что ID — числа
                host: parseInt(userId), // Организатор — текущий пользователь
                meeting: {
                    notify: true, // Уведомлять участников
                    reinvite: false, // Не запрашивать повторное подтверждение
                    allow_invite: false, // Не разрешать участникам приглашать других
                    hide_guests: false, // Не скрывать список участников
                },
            }
            : {};

        // Вызов Bitrix24 API для добавления события
        const response = await axios.post('https://serve-it.bitrix24.ru/rest/1771/io33ordgzhi7piwr/calendar.event.add', {
            type: 'user',
            ownerId: userId,
            name: subject,
            from: formattedStartDate,
            to: formattedEndDate,
            skip_time: 'N',
            description: description || '',
            meeting_status: meetingStatus || 'Q',
            timezone_from: 'Asia/Krasnoyarsk',
            timezone_to: 'Asia/Krasnoyarsk',
            ...meetingData, // Добавляем параметры встречи, если есть участники
        }, {
            params: {
                ADMIN_MODE: true,
            },
            headers: {
                'Content-Type': 'application/json',
            },
        });

        res.status(201).json({ message: 'Событие успешно добавлено', eventId: response.data.result });
    } catch (error) {
        console.error('Ошибка при добавлении события:', error.response?.data || error.message);
        res.status(400).json({ error: 'Ошибка при добавлении события', details: error.response?.data });
    }
};