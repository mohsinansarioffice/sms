const express = require('express');
const { body } = require('express-validator');
const {
  // Exam Types
  getExamTypes,
  createExamType,
  updateExamType,
  deleteExamType,
  
  // Exams
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  
  // Results
  getExamResults,
  enterMarks,
  getStudentResults,
  publishResults,
  getExamAnalytics
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const examsGate = checkFeature('exams');

// Exam Type routes
router.get('/types', protect, examsGate, getExamTypes);
router.post('/types', protect, examsGate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Exam type name is required')
], createExamType);
router.put('/types/:id', protect, examsGate, authorize('admin'), updateExamType);
router.delete('/types/:id', protect, examsGate, authorize('admin'), deleteExamType);

// Exam routes
router.get('/', protect, examsGate, getExams);
router.post('/', protect, examsGate, authorize('admin', 'teacher'), [
  body('name').trim().notEmpty().withMessage('Exam name is required'),
  body('classId').notEmpty().withMessage('Class is required'),
  body('subjectId').notEmpty().withMessage('Subject is required'),
  body('totalMarks').isNumeric().withMessage('Total marks must be a number'),
  body('passingMarks').isNumeric().withMessage('Passing marks must be a number'),
  body('examDate').isISO8601().withMessage('Valid exam date is required')
], createExam);
router.get('/:id', protect, examsGate, getExam);
router.put('/:id', protect, examsGate, authorize('admin', 'teacher'), updateExam);
router.delete('/:id', protect, examsGate, authorize('admin'), deleteExam);

// Results routes
router.get('/:examId/results', protect, examsGate, getExamResults);
router.post('/:examId/results', protect, examsGate, authorize('admin', 'teacher'), enterMarks);
router.get('/student/:studentId/results', protect, examsGate, getStudentResults);
router.put('/:examId/publish', protect, examsGate, authorize('admin', 'teacher'), publishResults);
router.get('/:examId/analytics', protect, examsGate, getExamAnalytics);

module.exports = router;
