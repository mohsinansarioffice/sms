const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { validationResult } = require('express-validator');

// ============ ACADEMIC YEAR ============

// @desc    Get all academic years
// @route   GET /api/academic/years
// @access  Private
exports.getAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYear.find({
      schoolId: req.user.schoolId
    }).sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      data: { years }
    });
  } catch (error) {
    console.error('Get Academic Years Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching academic years' });
  }
};

// @desc    Create academic year
// @route   POST /api/academic/years
// @access  Private (admin)
exports.createAcademicYear = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startDate or endDate' });
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Prevent overlapping academic years (active only) within the same school.
    const overlap = await AcademicYear.findOne({
      schoolId: req.user.schoolId,
      isActive: true,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).lean();

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: `Academic year dates overlap with an existing academic year (${overlap.name})`,
      });
    }

    const payload = {
      name: req.body.name,
      startDate,
      endDate,
      isCurrent: Boolean(req.body.isCurrent),
      schoolId: req.user.schoolId,
    };

    const year = await AcademicYear.create(payload);

    res.status(201).json({
      success: true,
      message: 'Academic year created successfully',
      data: { year }
    });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7927/ingest/e6ebbb8a-aeab-4952-8d24-7d8dfe5ca2e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d5952'},body:JSON.stringify({sessionId:'4d5952',runId:process.env.DEBUG_RUN_ID||'pre-fix',hypothesisId:'H7',location:'academicController.js:createAcademicYear:catch',message:'create year failed',data:{errName:error&&error.name,errMessage:error&&error.message,errCode:error&&error.code},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('Create Academic Year Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Academic year with this name already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating academic year' });
  }
};

// @desc    Update academic year
// @route   PUT /api/academic/years/:id
// @access  Private (admin)
exports.updateAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!year) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Academic year updated successfully',
      data: { year }
    });
  } catch (error) {
    console.error('Update Academic Year Error:', error);
    res.status(500).json({ success: false, message: 'Error updating academic year' });
  }
};

// @desc    Delete academic year (soft)
// @route   DELETE /api/academic/years/:id
// @access  Private (admin)
exports.deleteAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!year) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }

    res.status(200).json({ success: true, message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Delete Academic Year Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting academic year' });
  }
};

// ============ CLASSES ============

// @desc    Get all classes
// @route   GET /api/academic/classes
// @access  Private
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find({
      schoolId: req.user.schoolId,
      isActive: true
    }).sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: { classes }
    });
  } catch (error) {
    console.error('Get Classes Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching classes' });
  }
};

// @desc    Create class
// @route   POST /api/academic/classes
// @access  Private (admin)
exports.createClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const classDoc = await Class.create({
      ...req.body,
      schoolId: req.user.schoolId
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: { class: classDoc }
    });
  } catch (error) {
    console.error('Create Class Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Class with this name already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating class' });
  }
};

// @desc    Update class
// @route   PUT /api/academic/classes/:id
// @access  Private (admin)
exports.updateClass = async (req, res) => {
  try {
    const classDoc = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: { class: classDoc }
    });
  } catch (error) {
    console.error('Update Class Error:', error);
    res.status(500).json({ success: false, message: 'Error updating class' });
  }
};

// @desc    Delete class (soft)
// @route   DELETE /api/academic/classes/:id
// @access  Private (admin)
exports.deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    res.status(200).json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete Class Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting class' });
  }
};

// ============ SECTIONS ============

// @desc    Get all sections (optionally filtered by class)
// @route   GET /api/academic/sections?classId=xxx
// @access  Private
exports.getSections = async (req, res) => {
  try {
    const { classId } = req.query;

    const query = {
      schoolId: req.user.schoolId,
      isActive: true
    };

    if (classId) {
      query.classId = classId;
    }

    const sections = await Section.find(query)
      .populate('classId', 'name')
      .populate('classTeacher', 'personalInfo.firstName personalInfo.lastName')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { sections }
    });
  } catch (error) {
    console.error('Get Sections Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching sections' });
  }
};

// @desc    Create section
// @route   POST /api/academic/sections
// @access  Private (admin)
exports.createSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    // Verify class exists and belongs to school
    const classDoc = await Class.findOne({
      _id: req.body.classId,
      schoolId: req.user.schoolId
    });

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Verify teacher exists if provided
    if (req.body.classTeacher) {
      const teacher = await Teacher.findOne({
        _id: req.body.classTeacher,
        schoolId: req.user.schoolId
      });

      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
    }

    const section = await Section.create({
      ...req.body,
      schoolId: req.user.schoolId
    });

    const populatedSection = await Section.findById(section._id)
      .populate('classId', 'name')
      .populate('classTeacher', 'personalInfo.firstName personalInfo.lastName');

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: { section: populatedSection }
    });
  } catch (error) {
    console.error('Create Section Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Section with this name already exists for this class' });
    }
    res.status(500).json({ success: false, message: 'Error creating section' });
  }
};

// @desc    Update section
// @route   PUT /api/academic/sections/:id
// @access  Private (admin)
exports.updateSection = async (req, res) => {
  try {
    const section = await Section.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('classId', 'name')
      .populate('classTeacher', 'personalInfo.firstName personalInfo.lastName');

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      data: { section }
    });
  } catch (error) {
    console.error('Update Section Error:', error);
    res.status(500).json({ success: false, message: 'Error updating section' });
  }
};

// @desc    Delete section (soft)
// @route   DELETE /api/academic/sections/:id
// @access  Private (admin)
exports.deleteSection = async (req, res) => {
  try {
    const section = await Section.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    res.status(200).json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete Section Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting section' });
  }
};

// ============ SUBJECTS ============

// @desc    Get all subjects
// @route   GET /api/academic/subjects
// @access  Private
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({
      schoolId: req.user.schoolId,
      isActive: true
    })
      .populate('classes', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { subjects }
    });
  } catch (error) {
    console.error('Get Subjects Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching subjects' });
  }
};

// @desc    Create subject
// @route   POST /api/academic/subjects
// @access  Private (admin)
exports.createSubject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    // Verify all classes exist
    if (req.body.classes && req.body.classes.length > 0) {
      const classes = await Class.find({
        _id: { $in: req.body.classes },
        schoolId: req.user.schoolId
      });

      if (classes.length !== req.body.classes.length) {
        return res.status(400).json({ success: false, message: 'Some classes not found' });
      }
    }

    const subject = await Subject.create({
      ...req.body,
      schoolId: req.user.schoolId
    });

    const populatedSubject = await Subject.findById(subject._id)
      .populate('classes', 'name');

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject: populatedSubject }
    });
  } catch (error) {
    console.error('Create Subject Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Subject with this name already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating subject' });
  }
};

// @desc    Update subject
// @route   PUT /api/academic/subjects/:id
// @access  Private (admin)
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('classes', 'name');

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject }
    });
  } catch (error) {
    console.error('Update Subject Error:', error);
    res.status(500).json({ success: false, message: 'Error updating subject' });
  }
};

// @desc    Delete subject (soft)
// @route   DELETE /api/academic/subjects/:id
// @access  Private (admin)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    res.status(200).json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete Subject Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting subject' });
  }
};
