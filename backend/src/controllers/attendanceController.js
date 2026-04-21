const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Section = require('../models/Section');
const { validationResult } = require('express-validator');

function toStartOfDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

// @desc    Mark attendance for a class
// @route   POST /api/attendance
// @access  Private (admin, teacher)
exports.markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date, classId, sectionId, records } = req.body;
    let { class: className, section } = req.body;

    const targetDate = toStartOfDay(date);
    if (!targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date',
      });
    }
    const today = toStartOfDay(new Date());
    if (targetDate > today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for a future date',
      });
    }

    // Auto-populate names if missing but IDs are present
    if (classId && !className) {
      const cls = await Class.findOne({ _id: classId, schoolId: req.user.schoolId });
      if (cls) className = cls.name;
    }
    if (sectionId && !section) {
      const sec = await Section.findOne({ _id: sectionId, schoolId: req.user.schoolId });
      if (sec) section = sec.name;
    }

    // Check if attendance already marked for this date/class/section
    const normalizedSectionId = sectionId || null;
    const existingAttendance = await Attendance.findOne({
      schoolId: req.user.schoolId,
      date: targetDate,
      classId: classId,
      sectionId: normalizedSectionId
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this class on this date. Use update endpoint to modify.',
        existingAttendanceId: existingAttendance._id
      });
    }

    // Verify all students belong to the school
    const studentIds = records.map(r => r.studentId);
    const students = await Student.find({
      _id: { $in: studentIds },
      schoolId: req.user.schoolId,
      isActive: true
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some students not found or inactive'
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      schoolId: req.user.schoolId,
      date: targetDate,
      class: className,
      classId,
      section: section || '',
      sectionId: normalizedSectionId,
      records,
      markedBy: req.user.id
    });

    // Populate student details
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('records.studentId', 'personalInfo admissionNumber')
      .populate('markedBy', 'profile.name');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance: populatedAttendance }
    });
  } catch (error) {
    console.error('Mark Attendance Error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this date and class'
      });
    }

    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? `Error marking attendance: ${error.message}` 
        : 'Error marking attendance'
    });
  }
};

// @desc    Get attendance by date and class
// @route   GET /api/attendance
// @access  Private (admin, teacher)
exports.getAttendance = async (req, res) => {
  try {
    const { date, classId, sectionId, class: className, section, startDate, endDate } = req.query;

    const query = { schoolId: req.user.schoolId };

    // Filter by specific date or date range
    if (date) {
      const targetDate = toStartOfDay(date);
      if (!targetDate) {
        return res.status(400).json({ success: false, message: 'Invalid date' });
      }
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = { $gte: targetDate, $lt: nextDay };
    } else if (startDate && endDate) {
      const s = toStartOfDay(startDate);
      const e = toStartOfDay(endDate);
      if (!s || !e) {
        return res.status(400).json({ success: false, message: 'Invalid date range' });
      }
      query.date = {
        $gte: s,
        $lte: e
      };
    }

    // Filter by class
    if (classId) {
      query.classId = classId;
    } else if (className) {
      query.class = className;
    }

    // Filter by section
    if (sectionId) {
      query.sectionId = sectionId;
    } else if (section) {
      query.section = section;
    }

    const attendance = await Attendance.find(query)
      .populate('records.studentId', 'personalInfo admissionNumber academicInfo')
      .populate('markedBy', 'profile.name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: { attendance }
    });
  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance'
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (admin, teacher)
exports.updateAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { records } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      {
        _id: req.params.id,
        schoolId: req.user.schoolId
      },
      {
        records,
        markedBy: req.user.id,
        markedAt: Date.now()
      },
      { new: true, runValidators: true }
    )
    .populate('records.studentId', 'personalInfo admissionNumber')
    .populate('markedBy', 'profile.name');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: { attendance }
    });
  } catch (error) {
    console.error('Update Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendance'
    });
  }
};

// @desc    Get student attendance history
// @route   GET /api/attendance/student/:studentId
// @access  Private (admin, teacher)
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify student belongs to school
    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Build query
    const query = {
      schoolId: req.user.schoolId,
      'records.studentId': studentId
    };

    // Date range filter
    if (startDate && endDate) {
      const s = toStartOfDay(startDate);
      const e = toStartOfDay(endDate);
      if (!s || !e) {
        return res.status(400).json({ success: false, message: 'Invalid date range' });
      }
      query.date = {
        $gte: s,
        $lte: e
      };
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();

    // Extract student-specific records
    const studentAttendance = attendanceRecords.map(record => {
      const studentRecord = record.records.find(
        r => r.studentId.toString() === studentId
      );
      return {
        date: record.date,
        class: record.class,
        section: record.section,
        status: studentRecord?.status,
        remarks: studentRecord?.remarks
      };
    });

    // Calculate statistics
    const stats = {
      totalDays: studentAttendance.length,
      present: studentAttendance.filter(r => r.status === 'present').length,
      absent: studentAttendance.filter(r => r.status === 'absent').length,
      late: studentAttendance.filter(r => r.status === 'late').length,
      excused: studentAttendance.filter(r => r.status === 'excused').length
    };

    const attendedDays = stats.present + stats.late;
    stats.percentage = stats.totalDays > 0 
      ? parseFloat(((attendedDays / stats.totalDays) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
          admissionNumber: student.admissionNumber,
          class: student.academicInfo.class,
          section: student.academicInfo.section
        },
        attendance: studentAttendance,
        stats
      }
    });
  } catch (error) {
    console.error('Get Student Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student attendance'
    });
  }
};

// @desc    Get attendance summary/report
// @route   GET /api/attendance/report
// @access  Private (admin, teacher)
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, class: className, section } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const s = toStartOfDay(startDate);
    const e = toStartOfDay(endDate);
    if (!s || !e) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const matchQuery = {
      schoolId: req.user.schoolId,
      date: {
        $gte: s,
        $lte: e
      }
    };

    if (className) matchQuery.class = className;
    if (section) matchQuery.section = section;

    // Aggregate attendance data
    const report = await Attendance.aggregate([
      { $match: matchQuery },
      { $unwind: '$records' },
      {
        $group: {
          _id: '$records.studentId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [
                { $in: ['$records.status', ['present', 'late']] },
                1,
                0
              ]
            }
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$records.status', 'absent'] }, 1, 0]
            }
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$records.status', 'late'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: '$_id',
          studentName: {
            $concat: [
              '$student.personalInfo.firstName',
              ' ',
              '$student.personalInfo.lastName'
            ]
          },
          admissionNumber: '$student.admissionNumber',
          class: '$student.academicInfo.class',
          section: '$student.academicInfo.section',
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          percentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { percentage: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        report,
        summary: {
          totalStudents: report.length,
          dateRange: { startDate, endDate }
        }
      }
    });
  } catch (error) {
    console.error('Get Attendance Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating attendance report'
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (admin only)
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findOneAndDelete({
      _id: req.params.id,
      schoolId: req.user.schoolId
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Delete Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance'
    });
  }
};
