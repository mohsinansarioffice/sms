const Exam = require('../models/Exam');
const ExamType = require('../models/ExamType');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// ============ EXAM TYPES ============

// @desc    Get all exam types
// @route   GET /api/exams/types
// @access  Private
exports.getExamTypes = async (req, res) => {
  try {
    const examTypes = await ExamType.find({
      schoolId: req.user.schoolId,
      isActive: true
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { examTypes }
    });
  } catch (error) {
    console.error('Get Exam Types Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam types'
    });
  }
};

// @desc    Create exam type
// @route   POST /api/exams/types
// @access  Private (admin)
exports.createExamType = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const examType = await ExamType.create({
      ...req.body,
      schoolId: req.user.schoolId
    });

    res.status(201).json({
      success: true,
      message: 'Exam type created successfully',
      data: { examType }
    });
  } catch (error) {
    console.error('Create Exam Type Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Exam type with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating exam type'
    });
  }
};

// @desc    Update exam type
// @route   PUT /api/exams/types/:id
// @access  Private (admin)
exports.updateExamType = async (req, res) => {
  try {
    const examType = await ExamType.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!examType) {
      return res.status(404).json({
        success: false,
        message: 'Exam type not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exam type updated successfully',
      data: { examType }
    });
  } catch (error) {
    console.error('Update Exam Type Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exam type'
    });
  }
};

// @desc    Delete exam type
// @route   DELETE /api/exams/types/:id
// @access  Private (admin)
exports.deleteExamType = async (req, res) => {
  try {
    const examType = await ExamType.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!examType) {
      return res.status(404).json({
        success: false,
        message: 'Exam type not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exam type deleted successfully'
    });
  } catch (error) {
    console.error('Delete Exam Type Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting exam type'
    });
  }
};

// ============ EXAMS ============

// @desc    Get all exams with filters
// @route   GET /api/exams?classId=xxx&subjectId=xxx&academicYearId=xxx
// @access  Private
exports.getExams = async (req, res) => {
  try {
    const { classId, subjectId, academicYearId, sectionId } = req.query;
    
    const query = {
      schoolId: req.user.schoolId,
      isActive: true
    };
    
    if (classId) query.classId = classId;
    if (subjectId) query.subjectId = subjectId;
    if (academicYearId) query.academicYearId = academicYearId;
    if (sectionId) query.sectionId = sectionId;

    const exams = await Exam.find(query)
      .populate('examTypeId', 'name weightage')
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name')
      .populate('academicYearId', 'name')
      .sort({ examDate: -1 });

    res.status(200).json({
      success: true,
      data: { exams }
    });
  } catch (error) {
    console.error('Get Exams Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exams'
    });
  }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId
    })
      .populate('examTypeId', 'name weightage')
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name')
      .populate('academicYearId', 'name');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { exam }
    });
  } catch (error) {
    console.error('Get Exam Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam'
    });
  }
};

// @desc    Create exam
// @route   POST /api/exams
// @access  Private (admin, teacher)
exports.createExam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const exam = await Exam.create({
      ...req.body,
      schoolId: req.user.schoolId
    });

    const populatedExam = await Exam.findById(exam._id)
      .populate('examTypeId', 'name weightage')
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name')
      .populate('academicYearId', 'name');

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { exam: populatedExam }
    });
  } catch (error) {
    console.error('Create Exam Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating exam'
    });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (admin, teacher)
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('examTypeId', 'name weightage')
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name')
      .populate('academicYearId', 'name');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: { exam }
    });
  } catch (error) {
    console.error('Update Exam Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exam'
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (admin)
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Delete Exam Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting exam'
    });
  }
};

// ============ EXAM RESULTS ============

// @desc    Get results for an exam
// @route   GET /api/exams/:examId/results
// @access  Private
exports.getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    // Verify exam exists and belongs to school
    const exam = await Exam.findOne({
      _id: examId,
      schoolId: req.user.schoolId
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const results = await ExamResult.find({ examId })
      .populate('studentId', 'personalInfo admissionNumber academicInfo')
      .populate('enteredBy', 'profile.name')
      .sort({ marksObtained: -1 });

    res.status(200).json({
      success: true,
      data: { results, exam }
    });
  } catch (error) {
    console.error('Get Exam Results Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam results'
    });
  }
};

// @desc    Enter/Update marks for students
// @route   POST /api/exams/:examId/results
// @access  Private (admin, teacher)
exports.enterMarks = async (req, res) => {
  try {
    const { examId } = req.params;
    const { results } = req.body; // Array of { studentId, marksObtained, isAbsent, remarks }

    // Verify exam
    const exam = await Exam.findOne({
      _id: examId,
      schoolId: req.user.schoolId
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const savedResults = [];

    for (const result of results) {
      const existingResult = await ExamResult.findOne({
        examId,
        studentId: result.studentId
      });

      if (existingResult) {
        // Update existing result
        existingResult.marksObtained = result.marksObtained;
        existingResult.isAbsent = result.isAbsent || false;
        existingResult.remarks = result.remarks || '';
        existingResult.enteredBy = req.user._id;
        await existingResult.save();
        savedResults.push(existingResult);
      } else {
        // Create new result
        const newResult = await ExamResult.create({
          schoolId: req.user.schoolId,
          examId,
          studentId: result.studentId,
          marksObtained: result.marksObtained,
          isAbsent: result.isAbsent || false,
          remarks: result.remarks || '',
          enteredBy: req.user._id
        });
        savedResults.push(newResult);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Marks entered successfully',
      data: { results: savedResults }
    });
  } catch (error) {
    console.error('Enter Marks Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error entering marks'
    });
  }
};

// @desc    Get student's all exam results
// @route   GET /api/exams/student/:studentId/results
// @access  Private
exports.getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

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

    const results = await ExamResult.find({ studentId })
      .populate({
        path: 'examId',
        populate: [
          { path: 'subjectId', select: 'name' },
          { path: 'examTypeId', select: 'name' },
          { path: 'classId', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    // Calculate overall statistics
    const totalExams = results.length;
    const passedExams = results.filter(r => !r.isAbsent && r.percentage >= 33).length;
    const avgPercentage = results.length > 0
      ? results.filter(r => !r.isAbsent).reduce((sum, r) => sum + r.percentage, 0) / results.filter(r => !r.isAbsent).length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
          admissionNumber: student.admissionNumber
        },
        results,
        stats: {
          totalExams,
          passedExams,
          failedExams: totalExams - passedExams,
          avgPercentage: parseFloat(avgPercentage.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Get Student Results Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student results'
    });
  }
};

// @desc    Publish/unpublish exam results
// @route   PUT /api/exams/:examId/publish
// @access  Private (admin, teacher)
exports.publishResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const { isPublished } = req.body;

    const exam = await Exam.findOneAndUpdate(
      { _id: examId, schoolId: req.user.schoolId },
      { isPublished },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Results ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: { exam }
    });
  } catch (error) {
    console.error('Publish Results Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing results'
    });
  }
};

// @desc    Get exam analytics (class performance)
// @route   GET /api/exams/:examId/analytics
// @access  Private
exports.getExamAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findOne({
      _id: examId,
      schoolId: req.user.schoolId
    })
      .populate('subjectId', 'name')
      .populate('classId', 'name');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const results = await ExamResult.find({ examId });

    const totalStudents = results.length;
    const present = results.filter(r => !r.isAbsent).length;
    const absent = results.filter(r => r.isAbsent).length;
    const passed = results.filter(r => !r.isAbsent && r.percentage >= exam.passingMarks).length;
    const failed = present - passed;

    const avgMarks = present > 0
      ? results.filter(r => !r.isAbsent).reduce((sum, r) => sum + r.marksObtained, 0) / present
      : 0;

    const avgPercentage = present > 0
      ? results.filter(r => !r.isAbsent).reduce((sum, r) => sum + r.percentage, 0) / present
      : 0;

    const highest = present > 0
      ? Math.max(...results.filter(r => !r.isAbsent).map(r => r.marksObtained))
      : 0;

    const lowest = present > 0
      ? Math.min(...results.filter(r => !r.isAbsent).map(r => r.marksObtained))
      : 0;

    // Grade distribution
    const gradeDistribution = {
      'A+': results.filter(r => r.grade === 'A+').length,
      'A': results.filter(r => r.grade === 'A').length,
      'B+': results.filter(r => r.grade === 'B+').length,
      'B': results.filter(r => r.grade === 'B').length,
      'C+': results.filter(r => r.grade === 'C+').length,
      'C': results.filter(r => r.grade === 'C').length,
      'D': results.filter(r => r.grade === 'D').length,
      'F': results.filter(r => r.grade === 'F').length
    };

    res.status(200).json({
      success: true,
      data: {
        exam,
        analytics: {
          totalStudents,
          present,
          absent,
          passed,
          failed,
          passPercentage: totalStudents > 0 ? parseFloat(((passed / totalStudents) * 100).toFixed(2)) : 0,
          avgMarks: parseFloat(avgMarks.toFixed(2)),
          avgPercentage: parseFloat(avgPercentage.toFixed(2)),
          highestMarks: highest,
          lowestMarks: lowest,
          gradeDistribution
        }
      }
    });
  } catch (error) {
    console.error('Get Exam Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam analytics'
    });
  }
};
