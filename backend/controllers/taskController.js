const Task = require('../models/Task');
const Employee = require('../models/Employee');

// @desc    Assign work/task to employee
// @route   POST /api/tasks
const createTask = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const { title, description, assignedTo, priority, dueDate } = req.body;
        const task = await Task.create({
            title,
            description,
            assignedTo,
            assignedBy: req.user._id,
            priority,
            dueDate,
            orgId
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all tasks (for admin) or assigned tasks (for employee)
// @route   GET /api/tasks
const getTasks = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        let query = { orgId };
        if (req.user.role === 'employee') {
            query.assignedTo = req.user._id;
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name employeeId position profilePhoto')
            .populate('assignedBy', 'username role')
            .sort('-createdAt');

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id
const updateTaskStatus = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const { status } = req.body;
        const task = await Task.findOne({ _id: req.params.id, orgId });

        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Check if user is authorized to update status
        // Employee can only update status of their own task
        if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        task.status = status;
        await task.save();
        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const task = await Task.findOneAndDelete({ _id: req.params.id, orgId });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Start timer for task
// @route   PUT /api/tasks/:id/start-timer
const startTaskTimer = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const task = await Task.findOne({ _id: req.params.id, orgId });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if there is an open entry
        const hasOpenEntry = task.timeEntries.some(e => !e.endTime);
        if (hasOpenEntry) return res.status(400).json({ message: 'Timer is already running' });

        task.timeEntries.push({ startTime: new Date() });
        task.status = 'in-progress';
        await task.save();
        res.json(task);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// @desc    Stop timer for task
// @route   PUT /api/tasks/:id/stop-timer
const stopTaskTimer = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const task = await Task.findOne({ _id: req.params.id, orgId });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const openEntry = task.timeEntries.find(e => !e.endTime);
        if (!openEntry) return res.status(400).json({ message: 'No running timer found' });

        openEntry.endTime = new Date();
        const diffMs = openEntry.endTime - openEntry.startTime;
        openEntry.duration = Math.round(diffMs / 60000); // converting ms to minutes
        task.timeLogged += openEntry.duration;

        await task.save();
        res.json(task);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = { createTask, getTasks, updateTaskStatus, deleteTask, startTaskTimer, stopTaskTimer };
