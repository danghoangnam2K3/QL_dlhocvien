const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getSchedules, createSchedule, updateSchedule, cancelSchedule } = require('../controllers/scheduleController');

router.use(authMiddleware);

router.get('/', getSchedules);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', cancelSchedule);

module.exports = router;
