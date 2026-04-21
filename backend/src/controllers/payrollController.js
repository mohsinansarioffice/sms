const { validationResult } = require('express-validator');
const SalaryPayment = require('../models/SalaryPayment');
const Teacher = require('../models/Teacher');

// @desc    Get payroll records
// @route   GET /api/payroll
// @access  Private
exports.getPayroll = async (req, res) => {
  try {
    const { month, year, teacherId } = req.query;
    const query = { schoolId: req.user.schoolId, isActive: true };
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (teacherId) query.teacherId = teacherId;

    const records = await SalaryPayment.find(query)
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ year: -1, month: -1 })
      .lean();

    const totalPaid = records.reduce((sum, row) => sum + Number(row.netSalary || 0), 0);
    res.status(200).json({
      success: true,
      data: { records, totalPaid },
    });
  } catch (error) {
    console.error('Get Payroll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll records',
    });
  }
};

// @desc    Create payroll payment
// @route   POST /api/payroll
// @access  Private (admin)
exports.createPayroll = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { teacherId, month, year, allowances = 0, deductions = 0, paymentMethod, remarks, paymentDate } = req.body;

    const teacher = await Teacher.findOne({
      _id: teacherId,
      schoolId: req.user.schoolId,
      isActive: true,
    }).lean();
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const basicSalary = Number(teacher.salary || 0);
    const netSalary = Math.max(0, basicSalary + Number(allowances || 0) - Number(deductions || 0));

    const record = await SalaryPayment.create({
      schoolId: req.user.schoolId,
      teacherId,
      month: Number(month),
      year: Number(year),
      basicSalary,
      allowances: Number(allowances),
      deductions: Number(deductions),
      netSalary,
      paymentMethod: paymentMethod || 'bank_transfer',
      remarks: remarks || '',
      paymentDate: paymentDate || new Date(),
      createdBy: req.user._id,
    });

    const populated = await SalaryPayment.findById(record._id).populate(
      'teacherId',
      'personalInfo.firstName personalInfo.lastName employeeId'
    );

    res.status(201).json({
      success: true,
      message: 'Salary payment recorded successfully',
      data: { record: populated },
    });
  } catch (error) {
    console.error('Create Payroll Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Salary already recorded for this teacher and month',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error recording salary payment',
    });
  }
};

// @desc    Get salary slip
// @route   GET /api/payroll/:id/slip
// @access  Private
exports.getSalarySlip = async (req, res) => {
  try {
    const record = await SalaryPayment.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId,
      isActive: true,
    })
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName employeeId contactInfo professionalInfo')
      .populate('createdBy', 'profile.name')
      .lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { slip: record },
    });
  } catch (error) {
    console.error('Get Salary Slip Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary slip',
    });
  }
};
