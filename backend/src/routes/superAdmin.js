const express = require('express');
const { body, param } = require('express-validator');
const {
  getOverviewStats,
  getAllSchools,
  getSchoolStats,
  getPaymentAlerts,
  updateSchoolPlan,
  toggleSchoolFeature,
  toggleSchoolActive,
  createSuperAdmin
} = require('../controllers/superAdminController');
const { protect, authorizeSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', protect, authorizeSuperAdmin, getOverviewStats);

router.get('/payment-alerts', protect, authorizeSuperAdmin, getPaymentAlerts);

router.get('/schools', protect, authorizeSuperAdmin, getAllSchools);

router.get('/schools/:id', protect, authorizeSuperAdmin, param('id').isMongoId(), getSchoolStats);

router.patch(
  '/schools/:id/plan',
  protect,
  authorizeSuperAdmin,
  param('id').isMongoId(),
  body('newPlan').isIn(['free', 'basic', 'premium']).withMessage('Invalid plan'),
  updateSchoolPlan
);

router.patch(
  '/schools/:id/features',
  protect,
  authorizeSuperAdmin,
  param('id').isMongoId(),
  body('featureKey').notEmpty().withMessage('featureKey is required'),
  body('clear').optional().isBoolean(),
  body('value').optional().isBoolean(),
  toggleSchoolFeature
);

router.patch(
  '/schools/:id/active',
  protect,
  authorizeSuperAdmin,
  param('id').isMongoId(),
  body('isActive').isBoolean().withMessage('isActive must be boolean'),
  toggleSchoolActive
);

router.post(
  '/admins',
  protect,
  authorizeSuperAdmin,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().trim(),
  createSuperAdmin
);

module.exports = router;
