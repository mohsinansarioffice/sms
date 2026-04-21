const express = require('express');
const { body } = require('express-validator');
const {
  getFeeCategories, createFeeCategory, updateFeeCategory, deleteFeeCategory,
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  assignFees, getStudentFees, getAllStudentFees, updateStudentFee,
  recordPayment, getStudentPayments, getPaymentReceipt,
  getCollectionReport, getDefaulters
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
const feesGate = checkFeature('fees');

// Fee Category routes
router.get('/categories', protect, feesGate, getFeeCategories);
router.post('/categories', protect, feesGate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Category name is required')
], createFeeCategory);
router.put('/categories/:id', protect, authorize('admin'), updateFeeCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteFeeCategory);

// Fee Structure routes
router.get('/structures', protect, getFeeStructures);
router.post('/structures', protect, authorize('admin'), [
  body('classId').notEmpty().withMessage('Class is required'),
  body('feeCategoryId').notEmpty().withMessage('Fee category is required'),
  body('academicYearId').notEmpty().withMessage('Academic year is required'),
  body('amount').isNumeric().withMessage('Amount must be a number')
], createFeeStructure);
router.put('/structures/:id', protect, feesGate, authorize('admin'), updateFeeStructure);
router.delete('/structures/:id', protect, feesGate, authorize('admin'), deleteFeeStructure);

// Student Fee routes
router.post('/assign', protect, feesGate, authorize('admin'), assignFees);
router.get('/student/:studentId', protect, feesGate, getStudentFees);
router.get('/students', protect, feesGate, getAllStudentFees);
router.put('/student-fee/:id', protect, feesGate, authorize('admin'), updateStudentFee);

// Payment routes
router.post('/payments', protect, feesGate, authorize('admin'), [
  body('studentFeeId').notEmpty().withMessage('Student fee is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentMethod').isIn(['cash', 'card', 'online', 'cheque', 'bank_transfer']).withMessage('Invalid payment method')
], recordPayment);
router.get('/payments/student/:studentId', protect, feesGate, getStudentPayments);
router.get('/payments/:id/receipt', protect, feesGate, getPaymentReceipt);

// Report routes
router.get('/reports/collection', protect, feesGate, authorize('admin'), getCollectionReport);
router.get('/reports/defaulters', protect, feesGate, authorize('admin'), getDefaulters);

module.exports = router;
