const express = require('express');
const { body } = require('express-validator');
const { getPlans, getUsage, changePlan } = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/plans', protect, getPlans);
router.get('/usage', protect, getUsage);
router.post(
  '/change-plan',
  protect,
  authorize('admin'),
  [body('newPlan').isIn(['free', 'basic', 'premium']).withMessage('Invalid plan')],
  changePlan
);

module.exports = router;
