const express = require('express');
const multer = require('multer');
const { body, param, query, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  promoteStudents,
  importStudents,
} = require('../controllers/studentController');

const router = express.Router();
const studentMgmtGate = checkFeature('studentManagement');
const csvImportGate = checkFeature('csvImport');

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

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
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('search').optional().isString().trim(),
  query('class').optional().isString().trim(),
  query('section').optional().isString().trim(),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'all'])
    .withMessage('status must be active, inactive, or all'),
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid student ID')];

const createValidation = [
  body('personalInfo').isObject().withMessage('personalInfo object is required'),
  body('personalInfo.firstName').trim().notEmpty().withMessage('First name is required'),
  body('personalInfo.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('personalInfo.dateOfBirth').optional().isISO8601().toDate(),
  body('personalInfo.gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Invalid gender'),
  body('personalInfo.bloodGroup').optional().isString().trim(),
  body('personalInfo.photo').optional().isString().trim(),
  body('contactInfo').optional().isObject(),
  body('contactInfo.phone').optional().isString().trim(),
  body('contactInfo.email').optional().isEmail().withMessage('Invalid contact email'),
  body('contactInfo.address').optional().isString().trim(),
  body('guardianInfo').isObject().withMessage('guardianInfo object is required'),
  body('guardianInfo.name').trim().notEmpty().withMessage('Guardian name is required'),
  body('guardianInfo.relationship').optional().isString().trim(),
  body('guardianInfo.phone').trim().notEmpty().withMessage('Guardian phone is required'),
  body('guardianInfo.email').optional().isEmail().withMessage('Invalid guardian email'),
  body('academicInfo').isObject().withMessage('academicInfo object is required'),
  body('academicInfo.classId').optional().isMongoId().withMessage('Invalid class ID'),
  body('academicInfo.sectionId').optional().isMongoId().withMessage('Invalid section ID'),
  body('academicInfo.class')
    .if(body('academicInfo.classId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('Class is required'),
  body('academicInfo.section').optional().isString().trim(),
  body('academicInfo.rollNumber').optional().isString().trim(),
  body('academicInfo.admissionDate').optional().isISO8601().toDate(),
  body('isActive').optional().isBoolean(),
];

const updateValidation = [
  body('personalInfo').optional().isObject(),
  body('personalInfo.firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('personalInfo.lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('personalInfo.dateOfBirth').optional().isISO8601().toDate(),
  body('personalInfo.gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Invalid gender'),
  body('personalInfo.bloodGroup').optional().isString().trim(),
  body('personalInfo.photo').optional().isString().trim(),
  body('contactInfo').optional().isObject(),
  body('contactInfo.phone').optional().isString().trim(),
  body('contactInfo.email').optional().isEmail().withMessage('Invalid contact email'),
  body('contactInfo.address').optional().isString().trim(),
  body('guardianInfo').optional().isObject(),
  body('guardianInfo.name').optional().trim().notEmpty().withMessage('Guardian name cannot be empty'),
  body('guardianInfo.relationship').optional().isString().trim(),
  body('guardianInfo.phone').optional().trim().notEmpty().withMessage('Guardian phone cannot be empty'),
  body('guardianInfo.email').optional().isEmail().withMessage('Invalid guardian email'),
  body('academicInfo').optional().isObject(),
  body('academicInfo.classId').optional().isMongoId().withMessage('Invalid class ID'),
  body('academicInfo.sectionId').optional().isMongoId().withMessage('Invalid section ID'),
  body('academicInfo.class').optional().trim().notEmpty().withMessage('Class cannot be empty'),
  body('academicInfo.section').optional().isString().trim(),
  body('academicInfo.rollNumber').optional().isString().trim(),
  body('academicInfo.admissionDate').optional().isISO8601().toDate(),
  body('isActive').optional().isBoolean(),
  body().custom((_, { req }) => {
    const b = req.body || {};
    if (Object.prototype.hasOwnProperty.call(b, 'schoolId')) {
      throw new Error('Cannot change schoolId');
    }
    if (Object.prototype.hasOwnProperty.call(b, 'admissionNumber')) {
      throw new Error('Cannot change admissionNumber');
    }
    return true;
  }),
];

router.get(
  '/',
  protect,
  studentMgmtGate,
  authorize('admin', 'teacher'),
  listQueryValidation,
  runValidation,
  getStudents
);

router.post(
  '/promote',
  protect,
  studentMgmtGate,
  authorize('admin'),
  [
    body('fromClassId').isMongoId().withMessage('Valid fromClassId is required'),
    body('toClassId').isMongoId().withMessage('Valid toClassId is required'),
    body('studentIds').isArray({ min: 1 }).withMessage('At least one student is required'),
    body('toSectionId').optional().isMongoId().withMessage('Invalid toSectionId'),
    body('academicYearId').optional().isMongoId().withMessage('Invalid academicYearId'),
    body('keepSameSection').optional().isBoolean(),
  ],
  runValidation,
  promoteStudents
);

router.post(
  '/import',
  protect,
  studentMgmtGate,
  csvImportGate,
  authorize('admin'),
  uploadCsv.single('file'),
  importStudents
);

router.post(
  '/',
  protect,
  studentMgmtGate,
  authorize('admin'),
  createValidation,
  runValidation,
  createStudent
);

router.get(
  '/:id',
  protect,
  studentMgmtGate,
  authorize('admin', 'teacher'),
  idParamValidation,
  runValidation,
  getStudent
);

router.put(
  '/:id',
  protect,
  studentMgmtGate,
  authorize('admin'),
  idParamValidation,
  updateValidation,
  runValidation,
  updateStudent
);

router.delete(
  '/:id',
  protect,
  studentMgmtGate,
  authorize('admin'),
  idParamValidation,
  runValidation,
  deleteStudent
);

module.exports = router;
