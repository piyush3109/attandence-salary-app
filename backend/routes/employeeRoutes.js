const express = require('express');
const router = express.Router();
const { getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeById, promoteToAdmin, uploadDocument } = require('../controllers/employeeController');
const { protect, checkRole } = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(null, `${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/', protect, checkRole(['admin', 'manager', 'ceo']), createEmployee);
router.get('/', protect, checkRole(['admin', 'manager', 'accountant', 'employee', 'ceo']), getEmployees);
router.get('/:id', protect, getEmployeeById);
// Allow employees to update their own profile (controller handles field restrictions)
router.put('/:id', protect, updateEmployee);
// Admin/CEO can promote users
router.put('/:id/promote', protect, checkRole(['admin', 'ceo']), promoteToAdmin);
router.delete('/:id', protect, checkRole(['admin', 'ceo']), deleteEmployee);

router.post('/:id/documents', protect, upload.single('document'), uploadDocument);

module.exports = router;
