const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

// Маршрут для получения событий календаря сотрудника
router.get('/events/:userId', calendarController.getCalendarEvents);
// Маршрут для добавления события
router.post('/events', calendarController.addCalendarEvent);

module.exports = router;