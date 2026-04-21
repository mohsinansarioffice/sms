const express = require('express');
const { body } = require('express-validator');
const { getPayroll, createPayroll, getSalarySlip } = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const payrollGate = checkFeature('payroll');

router.get('/', protect, payrollGate, getPayroll);
router.post(
  '/',
  protect,
  payrollGate,
  authorize('admin'),
  [
    body('teacherId').isMongoId().withMessage('Teacher is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
    body('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
    body('allowances').optional().isNumeric().withMessage('Allowances must be numeric'),
    body('deductions').optional().isNumeric().withMessage('Deductions must be numeric'),
    body('paymentMethod')
      .optional()
      .isIn(['cash', 'bank_transfer', 'cheque', 'online'])
      .withMessage('Invalid payment method'),
  ],
  createPayroll
);
router.get('/:id/slip', protect, payrollGate, getSalarySlip);

module.exports = router;
