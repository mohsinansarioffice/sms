const express = require('express');
const { body } = require('express-validator');
const {
  getTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  getTimetable,
  getTeacherTimetable,
  upsertTimetableEntry,
  deleteTimetableEntry,
  bulkCopyTimetable,
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const timetableGate = checkFeature('timetable');

router.get('/slots', protect, timetableGate, getTimeSlots);
router.post(
  '/slots',
  protect,
  timetableGate,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Slot name is required'),
    body('startTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid start time format (HH:MM)'),
    body('endTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid end time format (HH:MM)'),
    body('displayOrder').isNumeric().withMessage('Display order must be a number'),
    body('endTime').custom((value, { req }) => {
      if (value <= req.body.startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  ],
  createTimeSlot
);
router.put('/slots/:id', protect, timetableGate, authorize('admin'), updateTimeSlot);
router.delete('/slots/:id', protect, timetableGate, authorize('admin'), deleteTimeSlot);

router.get('/', protect, timetableGate, getTimetable);
router.get('/teacher/:teacherId', protect, timetableGate, getTeacherTimetable);
router.post(
  '/',
  protect,
  timetableGate,
  authorize('admin'),
  [
    body('classId').notEmpty().withMessage('Class is required'),
    body('academicYearId').notEmpty().withMessage('Academic year is required'),
    body('dayOfWeek')
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Invalid day'),
    body('timeSlotId').notEmpty().withMessage('Time slot is required'),
  ],
  upsertTimetableEntry
);
router.delete('/:id', protect, timetableGate, authorize('admin'), deleteTimetableEntry);
router.post('/bulk-copy', protect, timetableGate, authorize('admin'), bulkCopyTimetable);

module.exports = router;
