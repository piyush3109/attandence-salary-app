const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTaskStatus, deleteTask, startTaskTimer, stopTaskTimer } = require('../controllers/taskController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, checkRole(['admin', 'ceo', 'manager']), createTask)
    .get(protect, getTasks);

router.route('/:id')
    .put(protect, updateTaskStatus)
    .delete(protect, checkRole(['admin', 'ceo', 'manager']), deleteTask);

router.put('/:id/start-timer', protect, startTaskTimer);
router.put('/:id/stop-timer', protect, stopTaskTimer);

module.exports = router;
