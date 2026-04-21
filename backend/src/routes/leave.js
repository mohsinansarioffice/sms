const express = require('express');
const { body } = require('express-validator');
const { getLeaves, createLeave, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const leavesGate = checkFeature('leaves');

router.get('/', protect, leavesGate, getLeaves);
router.post(
  '/',
  protect,
  leavesGate,
  [
    body('applicantId').notEmpty().withMessage('Applicant is required'),
    body('applicantType').isIn(['student', 'teacher']).withMessage('Invalid applicant type'),
    body('leaveType').isIn(['sick', 'casual', 'medical', 'other']).withMessage('Invalid leave type'),
    body('fromDate').isISO8601().withMessage('Valid from date is required'),
    body('toDate').isISO8601().withMessage('Valid to date is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
  ],
  createLeave
);
router.put('/:id/status', protect, leavesGate, authorize('admin'), updateLeaveStatus);

module.exports = router;
