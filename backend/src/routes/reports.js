const express = require('express');
const { query } = require('express-validator');
const { getReportCard } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();

router.get(
  '/report-card',
  protect,
  checkFeature('reportsExport'),
  [
    query('studentId').notEmpty().withMessage('Student ID is required'),
    query('academicYearId').notEmpty().withMessage('Academic Year ID is required'),
  ],
  getReportCard
);

module.exports = router;
