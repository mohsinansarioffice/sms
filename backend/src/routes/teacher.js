const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');

const router = express.Router();
const teacherMgmtGate = checkFeature('teacherManagement');

function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
}

const listQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().isString().trim(),
  query('department').optional().isString().trim(),
  query('status').optional().isIn(['active', 'inactive', 'all']).withMessage('status must be active, inactive, or all'),
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid teacher ID')];

const createValidation = [
  body('personalInfo').isObject().withMessage('personalInfo object is required'),
  body('personalInfo.firstName').trim().notEmpty().withMessage('First name is required'),
  body('personalInfo.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('personalInfo.dateOfBirth').optional().isISO8601().toDate(),
  body('personalInfo.gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('contactInfo').optional().isObject(),
  body('contactInfo.phone').optional().isString().trim(),
  body('contactInfo.email').optional().isEmail().withMessage('Invalid contact email'),
  body('contactInfo.address').optional().isString().trim(),
  body('professionalInfo').optional().isObject(),
  body('professionalInfo.designation').optional().isString().trim(),
  body('professionalInfo.department').optional().isString().trim(),
  body('professionalInfo.joiningDate').optional().isISO8601().toDate(),
  body('professionalInfo.qualification').optional().isString().trim(),
  body('professionalInfo.experience').optional().isNumeric().withMessage('Experience must be a number'),
  body('professionalInfo.subjects').optional().isArray(),
  body('professionalInfo.classes').optional().isArray(),
  body('salary').optional().isNumeric().withMessage('Salary must be a number'),
  body('isActive').optional().isBoolean(),
];

const updateValidation = [
  body('personalInfo').optional().isObject(),
  body('personalInfo.firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('personalInfo.lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('personalInfo.dateOfBirth').optional().isISO8601().toDate(),
  body('personalInfo.gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('contactInfo').optional().isObject(),
  body('contactInfo.phone').optional().isString().trim(),
  body('contactInfo.email').optional().isEmail().withMessage('Invalid contact email'),
  body('contactInfo.address').optional().isString().trim(),
  body('professionalInfo').optional().isObject(),
  body('professionalInfo.designation').optional().isString().trim(),
  body('professionalInfo.department').optional().isString().trim(),
  body('professionalInfo.joiningDate').optional().isISO8601().toDate(),
  body('professionalInfo.qualification').optional().isString().trim(),
  body('professionalInfo.experience').optional().isNumeric().withMessage('Experience must be a number'),
  body('professionalInfo.subjects').optional().isArray(),
  body('professionalInfo.classes').optional().isArray(),
  body('salary').optional().isNumeric().withMessage('Salary must be a number'),
  body('isActive').optional().isBoolean(),
  body().custom((_, { req }) => {
    const b = req.body || {};
    if (Object.prototype.hasOwnProperty.call(b, 'schoolId')) throw new Error('Cannot change schoolId');
    if (Object.prototype.hasOwnProperty.call(b, 'employeeId')) throw new Error('Cannot change employeeId');
    return true;
  }),
];

router.get('/', protect, teacherMgmtGate, authorize('admin', 'teacher'), listQueryValidation, runValidation, getTeachers);
router.post('/', protect, teacherMgmtGate, authorize('admin'), createValidation, runValidation, createTeacher);
router.get('/:id', protect, teacherMgmtGate, authorize('admin', 'teacher'), idParamValidation, runValidation, getTeacher);
router.put('/:id', protect, teacherMgmtGate, authorize('admin'), idParamValidation, updateValidation, runValidation, updateTeacher);
router.delete('/:id', protect, teacherMgmtGate, authorize('admin'), idParamValidation, runValidation, deleteTeacher);

module.exports = router;
