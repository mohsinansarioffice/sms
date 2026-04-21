const express = require('express');
const { body } = require('express-validator');
const {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const academicGate = checkFeature('academicSettings');

// Academic Year routes
router.get('/years', protect, academicGate, getAcademicYears);
router.post('/years', protect, academicGate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Academic year name is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
], createAcademicYear);
router.put('/years/:id', protect, academicGate, authorize('admin'), updateAcademicYear);
router.delete('/years/:id', protect, academicGate, authorize('admin'), deleteAcademicYear);

// Class routes
router.get('/classes', protect, academicGate, getClasses);
router.post('/classes', protect, academicGate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Class name is required')
], createClass);
router.put('/classes/:id', protect, academicGate, authorize('admin'), updateClass);
router.delete('/classes/:id', protect, academicGate, authorize('admin'), deleteClass);

// Section routes
router.get('/sections', protect, academicGate, getSections);
router.post('/sections', protect, academicGate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Section name is required'),
  body('classId').notEmpty().withMessage('Class is required')
], createSection);
router.put('/sections/:id', protect, academicGate, authorize('admin'), updateSection);
router.delete('/sections/:id', protect, academicGate, authorize('admin'), deleteSection);

// Subject routes
router.get('/subjects', protect, academicGate, getSubjects);
router.post('/subjects', protect, academicGate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Subject name is required')
], createSubject);
router.put('/subjects/:id', protect, academicGate, authorize('admin'), updateSubject);
router.delete('/subjects/:id', protect, academicGate, authorize('admin'), deleteSubject);

module.exports = router;
