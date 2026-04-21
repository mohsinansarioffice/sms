const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Section = require('../models/Section');
const Student = require('../models/Student');

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// @desc    Get consolidated report card for a student
// @route   GET /api/reports/report-card?studentId=xxx&academicYearId=xxx&examTypeId=xxx
// @access  Private
exports.getReportCard = async (req, res) => {
  try {
    const { studentId, academicYearId, examTypeId } = req.query;

    if (!studentId || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Academic Year ID are required',
      });
    }

    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId,
      isActive: true,
    })
      .populate('academicInfo.classId', 'name')
      .populate('academicInfo.sectionId', 'name')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    let classId = student.academicInfo?.classId?._id || student.academicInfo?.classId || null;
    let sectionId = student.academicInfo?.sectionId?._id || student.academicInfo?.sectionId || null;

    // Backward compatibility for legacy students stored with class/section names only.
    if (!classId && student.academicInfo?.class) {
      const classDoc = await Class.findOne({
        schoolId: req.user.schoolId,
        name: student.academicInfo.class,
        isActive: true,
      }).lean();
      classId = classDoc?._id || null;
    }
    if (!sectionId && classId && student.academicInfo?.section) {
      const sectionDoc = await Section.findOne({
        schoolId: req.user.schoolId,
        classId,
        name: student.academicInfo.section,
        isActive: true,
      }).lean();
      sectionId = sectionDoc?._id || null;
    }

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Student does not have a mapped classId. Update student academic class mapping first.',
      });
    }

    // Student-first strategy:
    // Pull student's real entered results first, then filter by exam metadata.
    // This avoids class/section mapping mismatches causing zeroed report cards.
    const rawResults = await ExamResult.find({
      schoolId: req.user.schoolId,
      studentId,
    })
      .populate({
        path: 'examId',
        match: {
          schoolId: req.user.schoolId,
          academicYearId,
          isActive: true,
          ...(examTypeId ? { examTypeId } : {}),
        },
        populate: [
          { path: 'subjectId', select: 'name' },
          { path: 'examTypeId', select: 'name' },
          { path: 'classId', select: 'name' },
          { path: 'sectionId', select: 'name' },
        ],
      })
      .sort({ createdAt: 1 })
      .lean();

    const results = rawResults.filter((result) => result.examId);
    const examIds = results.map((result) => result.examId._id);

    const subjectResults = results.map((result) => {
      const exam = result.examId;
      return {
        examId: exam._id,
        examName: exam.name,
        examType: exam.examTypeId?.name || '',
        subject: exam.subjectId?.name || '',
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        marksObtained: result?.marksObtained ?? 0,
        percentage: result?.percentage ?? 0,
        grade: result?.grade || '-',
        isAbsent: result?.isAbsent || false,
        remarks: result?.remarks || '',
      };
    });

    const validResults = subjectResults.filter((item) => !item.isAbsent);
    const totalMarks = subjectResults.reduce((sum, item) => sum + (item.totalMarks || 0), 0);
    const marksObtained = validResults.reduce((sum, item) => sum + (item.marksObtained || 0), 0);
    const overallPercentage = totalMarks ? round2((marksObtained / totalMarks) * 100) : 0;
    const passedSubjects = validResults.filter(
      (item) => !item.isAbsent && item.marksObtained >= item.passingMarks
    ).length;

    const attendanceRows = await Attendance.find({
      schoolId: req.user.schoolId,
      classId,
      ...(sectionId && {
        sectionId,
      }),
      date: {
        $gte: new Date(new Date().getFullYear(), 0, 1),
        $lte: new Date(),
      },
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

    const totalAttendance = present + absent + late + excused;
    const attendancePercentage = totalAttendance ? round2(((present + late) / totalAttendance) * 100) : 0;

    // Rank inside same class/section + examType/year based on average percentage.
    let classRank = null;
    let classStrength = 0;
    if (examIds.length) {
      const rankings = await ExamResult.aggregate([
        {
          $match: {
            schoolId: student.schoolId,
            examId: { $in: examIds },
          },
        },
        {
          $group: {
            _id: '$studentId',
            avgPercentage: { $avg: '$percentage' },
          },
        },
        { $sort: { avgPercentage: -1 } },
      ]);
      classStrength = rankings.length;
      const index = rankings.findIndex((item) => String(item._id) === String(student._id));
      classRank = index >= 0 ? index + 1 : null;
    }

    res.status(200).json({
      success: true,
      data: {
        reportCard: {
          student: {
            _id: student._id,
            name: `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim(),
            admissionNumber: student.admissionNumber,
            className: student.academicInfo?.classId?.name || student.academicInfo?.class || '',
            sectionName: student.academicInfo?.sectionId?.name || student.academicInfo?.section || '',
          },
          summary: {
            totalSubjects: subjectResults.length,
            passedSubjects,
            failedSubjects: subjectResults.length - passedSubjects,
            totalMarks,
            marksObtained,
            overallPercentage,
            classRank,
            classStrength,
          },
          attendance: {
            present,
            absent,
            late,
            excused,
            totalDays: totalAttendance,
            attendancePercentage,
          },
          subjectResults,
        },
      },
    });
  } catch (error) {
    console.error('Get Report Card Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report card',
    });
  }
};
