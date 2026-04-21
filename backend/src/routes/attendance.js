const express = require('express');
const { body, param, query } = require('express-validator');
const {
  markAttendance,
  getAttendance,
  updateAttendance,
  getStudentAttendance,
  getAttendanceReport,
  deleteAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const attendanceGate = checkFeature('attendance');

// Validation rules
const markAttendanceValidation = [
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isMongoId()
    .withMessage('Invalid Class ID'),
  body('sectionId')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid Section ID'),
  body('records')
    .isArray({ min: 1 })
    .withMessage('At least one student record required'),
  body('records.*.studentId')
    .notEmpty()
    .withMessage('Student ID required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('records.*.status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status')
];

const updateAttendanceValidation = [
  body('records')
    .isArray({ min: 1 })
    .withMessage('At least one student record required'),
  body('records.*.studentId')
    .notEmpty()
    .withMessage('Student ID required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('records.*.status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status'),
];

const reportValidation = [
  query('startDate').optional().isISO8601().withMessage('Invalid startDate'),
  query('endDate').optional().isISO8601().withMessage('Invalid endDate'),
];

// Routes
router.post('/', protect, attendanceGate, authorize('admin', 'teacher'), markAttendanceValidation, markAttendance);
router.get('/', protect, attendanceGate, authorize('admin', 'teacher'), getAttendance);
router.put('/:id', protect, attendanceGate, authorize('admin', 'teacher'), param('id').isMongoId(), updateAttendanceValidation, updateAttendance);
router.get('/student/:studentId', protect, attendanceGate, authorize('admin', 'teacher'), getStudentAttendance);
router.get('/report', protect, attendanceGate, authorize('admin', 'teacher'), reportValidation, getAttendanceReport);
router.delete('/:id', protect, attendanceGate, authorize('admin'), deleteAttendance);

module.exports = router;
