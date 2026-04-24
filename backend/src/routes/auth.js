const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  changeMyPassword,
  createParent,
  createTeacherAccount,
  createStudentAccount,
  checkEmailAvailability,
  resetParentPassword,
  resetTeacherPassword,
  resetStudentPassword,
  unlinkParentAccount,
  unlinkTeacherAccount,
  unlinkStudentAccount,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('schoolName').trim().notEmpty().withMessage('School name is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('subscriptionPlan')
    .optional()
    .isIn(['free', 'basic', 'premium'])
    .withMessage('Invalid subscription plan')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const createParentValidation = [
  body('studentId').isMongoId().withMessage('Valid studentId is required'),
  body('name').trim().notEmpty().withMessage('Parent name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters when provided'),
  body('phone').optional().isString().trim(),
];

const createTeacherValidation = [
  body('teacherId').isMongoId().withMessage('Valid teacherId is required'),
  body('name').optional().isString().trim(),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isString().trim(),
];

const createStudentValidation = [
  body('studentId').isMongoId().withMessage('Valid studentId is required'),
  body('name').optional().isString().trim(),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isString().trim(),
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put(
  '/me/password',
  protect,
  authorize('admin'),
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  changeMyPassword
);
router.post('/create-parent', protect, authorize('admin'), createParentValidation, createParent);
router.post('/create-teacher-account', protect, authorize('admin'), createTeacherValidation, createTeacherAccount);
router.post('/create-student-account', protect, authorize('admin'), createStudentValidation, createStudentAccount);
router.get('/check-email', protect, authorize('admin'), checkEmailAvailability);
router.put(
  '/parents/:studentId/password',
  protect,
  authorize('admin'),
  [body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  resetParentPassword
);
router.delete('/parents/:studentId', protect, authorize('admin'), unlinkParentAccount);
router.put(
  '/teachers/:teacherId/password',
  protect,
  authorize('admin'),
  [body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  resetTeacherPassword
);
router.delete('/teachers/:teacherId', protect, authorize('admin'), unlinkTeacherAccount);
router.put(
  '/students/:studentId/password',
  protect,
  authorize('admin'),
  [body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  resetStudentPassword
);
router.delete('/students/:studentId', protect, authorize('admin'), unlinkStudentAccount);

module.exports = router;
