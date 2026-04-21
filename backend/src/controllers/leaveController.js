const { validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// @desc    List leaves
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res) => {
  try {
    const { status, applicantType } = req.query;
    const query = {
      schoolId: req.user.schoolId,
      isActive: true,
    };
    if (status) query.status = status;
    if (applicantType) query.applicantType = applicantType;

    const leaves = await Leave.find(query).populate('approvedBy', 'profile.name').sort({ createdAt: -1 }).lean();

    // Hydrate applicant name in a lightweight way.
    const studentIds = leaves.filter((leave) => leave.applicantType === 'student').map((leave) => leave.applicantId);
    const teacherIds = leaves.filter((leave) => leave.applicantType === 'teacher').map((leave) => leave.applicantId);
    const [students, teachers] = await Promise.all([
      Student.find({ _id: { $in: studentIds } }).select('personalInfo.firstName personalInfo.lastName').lean(),
      Teacher.find({ _id: { $in: teacherIds } }).select('personalInfo.firstName personalInfo.lastName').lean(),
    ]);
    const studentMap = new Map(
      students.map((student) => [
        String(student._id),
        `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim(),
      ])
    );
    const teacherMap = new Map(
      teachers.map((teacher) => [
        String(teacher._id),
        `${teacher.personalInfo?.firstName || ''} ${teacher.personalInfo?.lastName || ''}`.trim(),
      ])
    );

    const data = leaves.map((leave) => ({
      ...leave,
      applicantName:
        leave.applicantType === 'student'
          ? studentMap.get(String(leave.applicantId)) || 'Student'
          : teacherMap.get(String(leave.applicantId)) || 'Teacher',
    }));

    res.status(200).json({
      success: true,
      data: { leaves: data },
    });
  } catch (error) {
    console.error('Get Leaves Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves',
    });
  }
};

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Private
exports.createLeave = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const payload = {
      ...req.body,
      schoolId: req.user.schoolId,
      status: 'pending',
    };

    const leave = await Leave.create(payload);
    res.status(201).json({
      success: true,
      message: 'Leave request submitted',
      data: { leave },
    });
  } catch (error) {
    console.error('Create Leave Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leave request',
    });
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/status
// @access  Private (admin)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, approvalNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected',
      });
    }

    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId, isActive: true },
      {
        status,
        approvalNote: approvalNote || '',
        approvedBy: req.user._id,
      },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: { leave },
    });
  } catch (error) {
    console.error('Update Leave Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave status',
    });
  }
};
