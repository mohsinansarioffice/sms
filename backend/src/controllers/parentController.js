const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const ExamResult = require('../models/ExamResult');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const StudentFee = require('../models/StudentFee');

async function buildDashboardPayload(schoolId, student) {
  const examResults = await ExamResult.find({
    schoolId,
    studentId: student._id,
  })
    .populate({
      path: 'examId',
      populate: [{ path: 'subjectId', select: 'name' }, { path: 'examTypeId', select: 'name' }],
    })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const attendanceRows = await Attendance.find({
    schoolId,
    'records.studentId': student._id,
  }).lean();

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  attendanceRows.forEach((row) => {
    const record = row.records.find((entry) => String(entry.studentId) === String(student._id));
    if (!record) return;
    if (record.status === 'present') present += 1;
    if (record.status === 'absent') absent += 1;
    if (record.status === 'late') late += 1;
    if (record.status === 'excused') excused += 1;
  });
  const attendanceTotal = present + absent + late + excused;
  const attendancePercentage = attendanceTotal
    ? (((present + late) / attendanceTotal) * 100).toFixed(2)
    : '0.00';

  const studentFees = await StudentFee.find({
    schoolId,
    studentId: student._id,
  }).lean();
  const totalFees = studentFees.reduce((sum, fee) => sum + Number(fee.totalAmount || 0), 0);
  const totalPaid = studentFees.reduce((sum, fee) => sum + Number(fee.paidAmount || 0), 0);
  const totalDiscount = studentFees.reduce((sum, fee) => sum + Number(fee.discount || 0), 0);
  const outstanding = totalFees - totalPaid - totalDiscount;

  const recentPayments = await FeePayment.find({
    schoolId,
    studentId: student._id,
  })
    .sort({ paymentDate: -1 })
    .limit(5)
    .lean();

  const announcements = await Announcement.find({
    schoolId,
    isActive: true,
    targetAudience: { $in: ['all', 'parents'] },
  })
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(8)
    .lean();

  return {
    student: {
      _id: student._id,
      name: `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim(),
      admissionNumber: student.admissionNumber,
      className: student.academicInfo?.classId?.name || student.academicInfo?.class,
      sectionName: student.academicInfo?.sectionId?.name || student.academicInfo?.section,
    },
    attendance: {
      totalDays: attendanceTotal,
      present,
      absent,
      late,
      excused,
      percentage: Number(attendancePercentage),
    },
    academics: {
      results: examResults,
      averagePercentage: examResults.length
        ? Number(
            (
              examResults.reduce((sum, row) => sum + Number(row.percentage || 0), 0) / examResults.length
            ).toFixed(2)
          )
        : 0,
    },
    fees: {
      totalFees,
      totalPaid,
      totalDiscount,
      outstanding,
      recentPayments,
    },
    announcements,
  };
}

// @desc    List students linked to this parent
// @route   GET /api/parent/children
// @access  Private (parent)
exports.getParentChildren = async (req, res) => {
  try {
    const parentId = req.user._id || req.user.id;
    const students = await Student.find({
      schoolId: req.user.schoolId,
      parentId,
      isActive: true,
    })
      .populate('academicInfo.classId', 'name')
      .populate('academicInfo.sectionId', 'name')
      .sort({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1, admissionNumber: 1 })
      .lean();

    const list = students.map((s) => ({
      _id: s._id,
      name: `${s.personalInfo?.firstName || ''} ${s.personalInfo?.lastName || ''}`.trim(),
      admissionNumber: s.admissionNumber,
      className: s.academicInfo?.classId?.name || s.academicInfo?.class,
      sectionName: s.academicInfo?.sectionId?.name || s.academicInfo?.section,
    }));

    res.status(200).json({
      success: true,
      data: { students: list },
    });
  } catch (error) {
    console.error('Get Parent Children Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching linked students',
    });
  }
};

// @desc    Get parent dashboard summary for one linked student
// @route   GET /api/parent/dashboard?studentId=
// @access  Private (parent)
exports.getParentDashboard = async (req, res) => {
  try {
    const parentId = req.user._id || req.user.id;
    let { studentId } = req.query;

    const children = await Student.find({
      schoolId: req.user.schoolId,
      parentId,
      isActive: true,
    })
      .select('_id')
      .lean();

    if (!children.length) {
      return res.status(404).json({
        success: false,
        message: 'No student is linked to this parent account',
      });
    }

    if (!studentId) {
      if (children.length === 1) {
        studentId = String(children[0]._id);
      } else {
        return res.status(400).json({
          success: false,
          message: 'studentId is required when multiple children are linked',
        });
      }
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId',
      });
    }

    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId,
      parentId,
      isActive: true,
    })
      .populate('academicInfo.classId', 'name')
      .populate('academicInfo.sectionId', 'name')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or not linked to this parent',
      });
    }

    const data = await buildDashboardPayload(req.user.schoolId, student);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get Parent Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching parent dashboard',
    });
  }
};
