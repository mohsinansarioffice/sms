const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getDiaryEntries,
  getClassDiary,
  getDiaryEntry,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry
} = require('../controllers/diaryController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const diaryGate = checkFeature('diary');

const entryValidation = [
  body('classId')
    .notEmpty().withMessage('Class is required')
    .isMongoId().withMessage('Invalid class ID'),
  body('sectionId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid section ID'),
  body('subjectId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid subject ID'),
  body('academicYearId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid academic year ID'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('type')
    .isIn(['homework', 'classwork', 'notice', 'remark'])
    .withMessage('Type must be one of: homework, classwork, notice, remark'),
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .notEmpty().withMessage('Description is required'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Invalid due date format'),
  body('status')
    .optional()
    .isIn(['draft', 'published']).withMessage('Status must be draft or published')
];

const updateValidation = [
  body('classId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid class ID'),
  body('sectionId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid section ID'),
  body('subjectId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid subject ID'),
  body('date')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Invalid date format'),
  body('type')
    .optional()
    .isIn(['homework', 'classwork', 'notice', 'remark'])
    .withMessage('Invalid type'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Invalid due date format'),
  body('status')
    .optional()
    .isIn(['draft', 'published']).withMessage('Status must be draft or published')
];

// List all entries — admin/teacher full access; parent/student scoped to child/self
router.get('/', protect, diaryGate, authorize('admin', 'teacher', 'parent', 'student'), getDiaryEntries);

// Class diary view — for parent portal and timetable-style view
router.get('/class', protect, diaryGate, authorize('admin', 'teacher', 'parent', 'student'), getClassDiary);

// Single entry
router.get('/:id', protect, diaryGate, authorize('admin', 'teacher', 'parent', 'student'), param('id').isMongoId(), getDiaryEntry);

// Create
router.post('/', protect, diaryGate, authorize('admin', 'teacher'), entryValidation, createDiaryEntry);

// Update
router.put('/:id', protect, diaryGate, authorize('admin', 'teacher'), param('id').isMongoId(), updateValidation, updateDiaryEntry);

// Delete
router.delete('/:id', protect, diaryGate, authorize('admin', 'teacher'), param('id').isMongoId(), deleteDiaryEntry);

module.exports = router;
