const express = require('express');
const { body } = require('express-validator');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const eventsGate = checkFeature('events');

router.get('/', protect, eventsGate, getEvents);
router.post(
  '/',
  protect,
  eventsGate,
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('eventDate').isISO8601().withMessage('Valid event date is required'),
    body('type').optional().isIn(['holiday', 'exam', 'event', 'other']).withMessage('Invalid event type'),
  ],
  createEvent
);
router.put('/:id', protect, eventsGate, authorize('admin'), updateEvent);
router.delete('/:id', protect, eventsGate, authorize('admin'), deleteEvent);

module.exports = router;
