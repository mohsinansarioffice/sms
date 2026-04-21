const mongoose = require('mongoose');
const FeeCategory = require('../models/FeeCategory');
const FeeStructure = require('../models/FeeStructure');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// ============ FEE CATEGORIES ============

exports.getFeeCategories = async (req, res) => {
  try {
    const categories = await FeeCategory.find({ schoolId: req.user.schoolId, isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: { categories } });
  } catch (error) {
    console.error('Get Fee Categories Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching fee categories' });
  }
};

exports.createFeeCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const category = await FeeCategory.create({ ...req.body, schoolId: req.user.schoolId });
    res.status(201).json({ success: true, message: 'Fee category created successfully', data: { category } });
  } catch (error) {
    console.error('Create Fee Category Error:', error);
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Fee category with this name already exists' });
    res.status(500).json({ success: false, message: 'Error creating fee category' });
  }
};

exports.updateFeeCategory = async (req, res) => {
  try {
    const category = await FeeCategory.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Fee category not found' });
    res.status(200).json({ success: true, message: 'Fee category updated successfully', data: { category } });
  } catch (error) {
    console.error('Update Fee Category Error:', error);
    res.status(500).json({ success: false, message: 'Error updating fee category' });
  }
};

exports.deleteFeeCategory = async (req, res) => {
  try {
    const category = await FeeCategory.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Fee category not found' });
    res.status(200).json({ success: true, message: 'Fee category deleted successfully' });
  } catch (error) {
    console.error('Delete Fee Category Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting fee category' });
  }
};

// ============ FEE STRUCTURES ============

exports.getFeeStructures = async (req, res) => {
  try {
    const { classId, academicYearId } = req.query;
    const query = { schoolId: req.user.schoolId, isActive: true };
    if (classId) query.classId = classId;
    if (academicYearId) query.academicYearId = academicYearId;

    const structures = await FeeStructure.find(query)
      .populate('classId', 'name')
      .populate('feeCategoryId', 'name')
      .populate('academicYearId', 'name')
      .sort({ classId: 1 });

    res.status(200).json({ success: true, data: { structures } });
  } catch (error) {
    console.error('Get Fee Structures Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching fee structures' });
  }
};

exports.createFeeStructure = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const structure = await FeeStructure.create({ ...req.body, schoolId: req.user.schoolId });
    const populated = await FeeStructure.findById(structure._id)
      .populate('classId', 'name')
      .populate('feeCategoryId', 'name')
      .populate('academicYearId', 'name');

    res.status(201).json({ success: true, message: 'Fee structure created successfully', data: { structure: populated } });
  } catch (error) {
    console.error('Create Fee Structure Error:', error);
    res.status(500).json({ success: false, message: 'Error creating fee structure' });
  }
};

exports.updateFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    ).populate('classId', 'name').populate('feeCategoryId', 'name').populate('academicYearId', 'name');

    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });
    res.status(200).json({ success: true, message: 'Fee structure updated successfully', data: { structure } });
  } catch (error) {
    console.error('Update Fee Structure Error:', error);
    res.status(500).json({ success: false, message: 'Error updating fee structure' });
  }
};

exports.deleteFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });
    res.status(200).json({ success: true, message: 'Fee structure deleted successfully' });
  } catch (error) {
    console.error('Delete Fee Structure Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting fee structure' });
  }
};

// ============ STUDENT FEES ============

exports.assignFees = async (req, res) => {
  try {
    const { classId, academicYearId, studentIds } = req.body;

    if (!classId || !academicYearId || !studentIds || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Class, academic year, and student IDs are required' });
    }

    const schoolIdRaw = req.user.schoolId?._id ?? req.user.schoolId;
    if (!schoolIdRaw || !mongoose.isValidObjectId(String(schoolIdRaw))) {
      return res.status(403).json({ success: false, message: 'Your account is not linked to a valid school' });
    }
    const schoolId = new mongoose.Types.ObjectId(String(schoolIdRaw));

    if (!mongoose.isValidObjectId(String(classId)) || !mongoose.isValidObjectId(String(academicYearId))) {
      return res.status(400).json({ success: false, message: 'Invalid class or academic year id' });
    }
    const classObjId = new mongoose.Types.ObjectId(String(classId));
    const yearObjId = new mongoose.Types.ObjectId(String(academicYearId));

    const rawList = Array.isArray(studentIds) ? studentIds : [];
    const normalizedStudentIds = rawList
      .filter((id) => id != null && id !== '')
      .map((id) => (typeof id === 'object' && id !== null && id._id ? id._id : id))
      .filter((id) => mongoose.isValidObjectId(String(id)))
      .map((id) => new mongoose.Types.ObjectId(String(id)));

    if (normalizedStudentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid student IDs were provided' });
    }

    const structures = await FeeStructure.find({
      schoolId,
      classId: classObjId,
      academicYearId: yearObjId,
      isActive: true,
    });

    if (structures.length === 0) {
      return res.status(404).json({ success: false, message: 'No fee structures found for this class and academic year' });
    }

    const enrolledIds = await Student.distinct('_id', {
      schoolId,
      _id: { $in: normalizedStudentIds },
      isActive: true,
    });
    const enrolledSet = new Set(enrolledIds.map((id) => String(id)));
    const allowedStudentIds = normalizedStudentIds.filter((id) => enrolledSet.has(String(id)));

    if (allowedStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'None of the selected students belong to your school or are active',
      });
    }

    const assignedFees = [];

    for (const studentId of allowedStudentIds) {
      for (const structure of structures) {
        const existing = await StudentFee.findOne({
          schoolId,
          studentId,
          feeStructureId: structure._id,
        });

        if (!existing) {
          const totalAmount = Number(structure.amount);
          if (!Number.isFinite(totalAmount) || totalAmount < 0) {
            return res.status(400).json({
              success: false,
              message: 'Invalid fee structure amount; please fix the fee structure and try again',
            });
          }
          const studentFee = await StudentFee.create({
            schoolId,
            studentId,
            academicYearId: yearObjId,
            feeStructureId: structure._id,
            totalAmount,
            dueDate: structure.dueDate || undefined,
          });
          assignedFees.push(studentFee);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Fees assigned successfully (${assignedFees.length} new assignments)`,
      data: { count: assignedFees.length },
    });
  } catch (error) {
    console.error('Assign Fees Error:', error);
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)
        .map((e) => e.message)
        .join('; ');
      return res.status(400).json({ success: false, message: msg || 'Validation failed' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid id${error.path ? ` (${error.path})` : ''}`,
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This fee assignment already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error assigning fees',
    });
  }
};

exports.getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId })
      .populate('academicInfo.classId', 'name');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const fees = await StudentFee.find({ schoolId: req.user.schoolId, studentId })
      .populate({ path: 'feeStructureId', populate: { path: 'feeCategoryId', select: 'name' } })
      .populate('academicYearId', 'name')
      .sort({ createdAt: -1 });

    const totalFees = fees.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalDiscount = fees.reduce((sum, f) => sum + f.discount, 0);
    const totalOutstanding = totalFees - totalPaid - totalDiscount;

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
          admissionNumber: student.admissionNumber,
          class: student.academicInfo.classId?.name
        },
        fees,
        summary: { totalFees, totalPaid, totalDiscount, totalOutstanding }
      }
    });
  } catch (error) {
    console.error('Get Student Fees Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching student fees' });
  }
};

exports.getAllStudentFees = async (req, res) => {
  try {
    const { status, classId, academicYearId, page = 1, limit = 50 } = req.query;

    const query = { schoolId: req.user.schoolId };
    if (status) query.status = status;
    if (academicYearId) query.academicYearId = academicYearId;

    if (classId) {
      const studentIds = await Student.find({
        schoolId: req.user.schoolId,
        'academicInfo.classId': classId,
      }).distinct('_id');
      query.studentId = { $in: studentIds };
    }

    const total = await StudentFee.countDocuments(query);

    const studentFees = await StudentFee.find(query)
      .populate({
        path: 'studentId',
        select: 'personalInfo admissionNumber academicInfo',
        populate: { path: 'academicInfo.classId', select: 'name' }
      })
      .populate({ path: 'feeStructureId', populate: { path: 'feeCategoryId', select: 'name' } })
      .populate('academicYearId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        fees: studentFees,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get All Student Fees Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching student fees' });
  }
};

exports.updateStudentFee = async (req, res) => {
  try {
    const allowed = ['discount', 'dueDate', 'remarks', 'totalAmount'];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No allowed fields to update' });
    }

    const existing = await StudentFee.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!existing) return res.status(404).json({ success: false, message: 'Student fee not found' });

    if (updates.totalAmount !== undefined) {
      const nextTotal = Number(updates.totalAmount);
      if (!Number.isFinite(nextTotal) || nextTotal < 0) {
        return res.status(400).json({ success: false, message: 'totalAmount must be a non-negative number' });
      }
      const minTotal = existing.paidAmount + existing.discount;
      if (nextTotal < minTotal) {
        return res.status(400).json({
          success: false,
          message: `totalAmount cannot be less than paid plus discount (${minTotal})`,
        });
      }
    }

    const studentFee = await StudentFee.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate({ path: 'feeStructureId', populate: { path: 'feeCategoryId', select: 'name' } });

    if (!studentFee) return res.status(404).json({ success: false, message: 'Student fee not found' });
    res.status(200).json({ success: true, message: 'Student fee updated successfully', data: { studentFee } });
  } catch (error) {
    console.error('Update Student Fee Error:', error);
    res.status(500).json({ success: false, message: 'Error updating student fee' });
  }
};

// ============ PAYMENTS ============

exports.recordPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { studentFeeId, amount, paymentMethod, transactionId, remarks } = req.body;

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be a positive number' });
    }

    const studentFee = await StudentFee.findOne({ _id: studentFeeId, schoolId: req.user.schoolId });
    if (!studentFee) return res.status(404).json({ success: false, message: 'Student fee not found' });

    const outstanding = studentFee.totalAmount - studentFee.discount - studentFee.paidAmount;
    if (amt > outstanding) {
      return res.status(400).json({ success: false, message: `Payment amount exceeds outstanding balance of ${outstanding}` });
    }

    const payment = await FeePayment.create({
      schoolId: req.user.schoolId,
      studentFeeId,
      studentId: studentFee.studentId,
      amount: amt,
      paymentMethod,
      transactionId,
      remarks,
      receivedBy: req.user._id
    });

    studentFee.paidAmount += amt;
    await studentFee.save();

    const populated = await FeePayment.findById(payment._id)
      .populate('studentId', 'personalInfo admissionNumber')
      .populate('receivedBy', 'profile.name');

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: { payment: populated } });
  } catch (error) {
    console.error('Record Payment Error:', error);
    res.status(500).json({ success: false, message: 'Error recording payment' });
  }
};

exports.getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await FeePayment.find({ schoolId: req.user.schoolId, studentId })
      .populate({
        path: 'studentFeeId',
        populate: { path: 'feeStructureId', populate: { path: 'feeCategoryId', select: 'name' } }
      })
      .populate('receivedBy', 'profile.name')
      .sort({ paymentDate: -1 });

    res.status(200).json({ success: true, data: { payments } });
  } catch (error) {
    console.error('Get Student Payments Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment history' });
  }
};

exports.getPaymentReceipt = async (req, res) => {
  try {
    const payment = await FeePayment.findOne({ _id: req.params.id, schoolId: req.user.schoolId })
      .populate({
        path: 'studentId',
        select: 'personalInfo admissionNumber academicInfo guardianInfo',
        populate: { path: 'academicInfo.classId academicInfo.sectionId', select: 'name' }
      })
      .populate({
        path: 'studentFeeId',
        populate: { path: 'feeStructureId', populate: { path: 'feeCategoryId', select: 'name' } }
      })
      .populate('receivedBy', 'profile.name');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.status(200).json({ success: true, data: { payment } });
  } catch (error) {
    console.error('Get Payment Receipt Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment receipt' });
  }
};

// ============ REPORTS ============

exports.getCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate, classId } = req.query;

    const query = { schoolId: req.user.schoolId };
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.paymentDate = { $gte: start, $lte: end };
    }

    let payments = await FeePayment.find(query)
      .populate({
        path: 'studentId',
        select: 'personalInfo academicInfo',
        populate: { path: 'academicInfo.classId', select: 'name' }
      })
      .populate('studentFeeId')
      .sort({ paymentDate: -1 });

    if (classId) {
      payments = payments.filter(p => p.studentId?.academicInfo?.classId?._id?.toString() === classId);
    }

    const totalCollection = payments.reduce((sum, p) => sum + p.amount, 0);
    const paymentMethodBreakdown = ['cash', 'card', 'online', 'cheque', 'bank_transfer'].reduce((acc, method) => {
      acc[method] = payments.filter(p => p.paymentMethod === method).reduce((sum, p) => sum + p.amount, 0);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        payments,
        summary: { totalPayments: payments.length, totalCollection, paymentMethodBreakdown }
      }
    });
  } catch (error) {
    console.error('Get Collection Report Error:', error);
    res.status(500).json({ success: false, message: 'Error generating collection report' });
  }
};

exports.getDefaulters = async (req, res) => {
  try {
    const defaulters = await StudentFee.find({
      schoolId: req.user.schoolId,
      status: { $in: ['pending', 'partial', 'overdue'] }
    })
      .populate({
        path: 'studentId',
        select: 'personalInfo admissionNumber academicInfo guardianInfo',
        populate: { path: 'academicInfo.classId academicInfo.sectionId', select: 'name' }
      })
      .populate({ path: 'feeStructureId', populate: { path: 'feeCategoryId', select: 'name' } })
      .sort({ dueDate: 1 });

    res.status(200).json({ success: true, data: { defaulters } });
  } catch (error) {
    console.error('Get Defaulters Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching defaulters list' });
  }
};
