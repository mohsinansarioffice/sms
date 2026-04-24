const mongoose = require('mongoose');
const DiaryEntry = require('../models/DiaryEntry');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');

function toStartOfDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function toEndOfDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Diary entries may omit sectionId for class-wide posts; parents must still see those. */
function applyParentClassSectionFilter(filter, student) {
  const rawClass = student.academicInfo?.classId;
  const rawSection = student.academicInfo?.sectionId;
  const classIdVal = rawClass?._id || rawClass;
  if (!classIdVal) {
    return { ok: false, message: 'Student has no class assigned' };
  }
  const sectionIdVal = rawSection?._id || rawSection;

  filter.classId = classIdVal;
  // Match class-wide entries (null/missing section) OR this student's section
  const sectionOr = [{ sectionId: null }];
  if (sectionIdVal) {
    sectionOr.push({ sectionId: sectionIdVal });
  }
  filter.$or = sectionOr;
  return { ok: true };
}

// @desc    Get diary entries (admin/teacher: filtered list; parent/student: scoped class entries)
// @route   GET /api/diary
// @access  Private (admin, teacher, parent, student)
exports.getDiaryEntries = async (req, res) => {
  try {
    const { classId, sectionId, date, startDate, endDate, type, status, page = 1, limit = 30 } = req.query;
    const schoolId = req.user.schoolId;
    const role = req.user.role;

    const filter = { schoolId };

    // Parent/student role: automatically scope to linked student's class
    if (role === 'parent') {
      const parentId = req.user._id || req.user.id;
      let targetStudentId = req.query.studentId;

      if (targetStudentId && !mongoose.Types.ObjectId.isValid(targetStudentId)) {
        return res.status(400).json({ success: false, message: 'Invalid studentId' });
      }

      const studentQuery = { schoolId, parentId, isActive: true };
      if (targetStudentId) studentQuery._id = targetStudentId;

      const student = await Student.findOne(studentQuery)
        .populate('academicInfo.classId', 'name')
        .populate('academicInfo.sectionId', 'name')
        .lean();

      if (!student) {
        return res.status(404).json({ success: false, message: 'No linked student found' });
      }

      const applied = applyParentClassSectionFilter(filter, student);
      if (!applied.ok) {
        return res.status(400).json({ success: false, message: applied.message });
      }
      filter.status = 'published';
    } else if (role === 'student') {
      const student = await Student.findOne({
        schoolId,
        userId: req.user._id || req.user.id,
        isActive: true,
      })
        .populate('academicInfo.classId', 'name')
        .populate('academicInfo.sectionId', 'name')
        .lean();

      if (!student) {
        return res.status(404).json({ success: false, message: 'No linked student found' });
      }

      const applied = applyParentClassSectionFilter(filter, student);
      if (!applied.ok) {
        return res.status(400).json({ success: false, message: applied.message });
      }
      filter.status = 'published';
    } else {
      // Admin / Teacher filters
      if (classId && mongoose.Types.ObjectId.isValid(classId)) filter.classId = classId;
      if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) filter.sectionId = sectionId;
      if (type && ['homework', 'classwork', 'notice', 'remark'].includes(type)) filter.type = type;
      if (status && ['draft', 'published'].includes(status)) filter.status = status;
    }

    // Date filtering
    if (date) {
      const start = toStartOfDay(date);
      const end = toEndOfDay(date);
      if (start && end) filter.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = toStartOfDay(startDate);
        if (s) filter.date.$gte = s;
      }
      if (endDate) {
        const e = toEndOfDay(endDate);
        if (e) filter.date.$lte = e;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DiaryEntry.countDocuments(filter);

    const entries = await DiaryEntry.find(filter)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('academicYearId', 'name year')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: {
        entries,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get Diary Entries Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching diary entries' });
  }
};

// @desc    Get diary entries for a specific class/section by date (lightweight, for parent/student view)
// @route   GET /api/diary/class
// @access  Private (admin, teacher, parent, student)
exports.getClassDiary = async (req, res) => {
  try {
    const { classId, sectionId, date, startDate, endDate } = req.query;
    const schoolId = req.user.schoolId;
    const role = req.user.role;

    const filter = { schoolId, status: 'published' };

    if (role === 'parent') {
      const parentId = req.user._id || req.user.id;
      let targetStudentId = req.query.studentId;

      const studentQuery = { schoolId, parentId, isActive: true };
      if (targetStudentId && mongoose.Types.ObjectId.isValid(targetStudentId)) {
        studentQuery._id = targetStudentId;
      }

      const student = await Student.findOne(studentQuery).lean();
      if (!student) {
        return res.status(404).json({ success: false, message: 'No linked student found' });
      }

      const applied = applyParentClassSectionFilter(filter, student);
      if (!applied.ok) {
        return res.status(400).json({ success: false, message: applied.message });
      }
    } else if (role === 'student') {
      const student = await Student.findOne({
        schoolId,
        userId: req.user._id || req.user.id,
        isActive: true,
      }).lean();
      if (!student) {
        return res.status(404).json({ success: false, message: 'No linked student found' });
      }

      const applied = applyParentClassSectionFilter(filter, student);
      if (!applied.ok) {
        return res.status(400).json({ success: false, message: applied.message });
      }
    } else {
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ success: false, message: 'Valid classId is required' });
      }
      filter.classId = classId;
      if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) filter.sectionId = sectionId;
    }

    if (date) {
      const start = toStartOfDay(date);
      const end = toEndOfDay(date);
      if (start && end) filter.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = toStartOfDay(startDate);
        if (s) filter.date.$gte = s;
      }
      if (endDate) {
        const e = toEndOfDay(endDate);
        if (e) filter.date.$lte = e;
      }
    } else {
      // Default: today
      const start = toStartOfDay(new Date());
      const end = toEndOfDay(new Date());
      filter.date = { $gte: start, $lte: end };
    }

    const entries = await DiaryEntry.find(filter)
      .populate('subjectId', 'name')
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName')
      .sort({ type: 1, createdAt: 1 })
      .lean();

    // Group by type for easy rendering
    const grouped = { homework: [], classwork: [], notice: [], remark: [] };
    entries.forEach((e) => {
      if (grouped[e.type]) grouped[e.type].push(e);
    });

    res.status(200).json({
      success: true,
      data: { entries, grouped }
    });
  } catch (error) {
    console.error('Get Class Diary Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching class diary' });
  }
};

// @desc    Get single diary entry
// @route   GET /api/diary/:id
// @access  Private
exports.getDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, schoolId: req.user.schoolId })
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('academicYearId', 'name year')
      .lean();

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Diary entry not found' });
    }

    // Parent/student can only see published entries
    if ((req.user.role === 'parent' || req.user.role === 'student') && entry.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Diary entry not found' });
    }

    res.status(200).json({ success: true, data: { entry } });
  } catch (error) {
    console.error('Get Diary Entry Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching diary entry' });
  }
};

// @desc    Create a diary entry
// @route   POST /api/diary
// @access  Private (admin, teacher)
exports.createDiaryEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { classId, sectionId, academicYearId, subjectId, date, type, title, description, dueDate, status } = req.body;
    const schoolId = req.user.schoolId;

    // Find the Teacher record linked to this User
    let teacherId;
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ schoolId, userId: req.user.id || req.user._id }).lean();
      if (!teacher) {
        return res.status(403).json({ success: false, message: 'Teacher profile not found for this account' });
      }
      teacherId = teacher._id;
    } else {
      // Admin: can optionally specify a teacherId or default to a placeholder
      if (req.body.teacherId && mongoose.Types.ObjectId.isValid(req.body.teacherId)) {
        teacherId = req.body.teacherId;
      } else {
        // For admin without a Teacher record, find or use any teacher in school as fallback
        // Actually for admin we'll store the admin's user id mapped as a pseudo-ref
        // Better: require teacherId in body for admin or find teacher by userId
        const teacher = await Teacher.findOne({ schoolId }).lean();
        if (!teacher) {
          return res.status(400).json({ success: false, message: 'No teacher found in this school. Please provide a valid teacherId.' });
        }
        teacherId = teacher._id;
      }
    }

    const parsedDate = toStartOfDay(date);
    if (!parsedDate) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const entryData = {
      schoolId,
      classId,
      sectionId: sectionId || undefined,
      academicYearId: academicYearId || undefined,
      subjectId: subjectId || undefined,
      teacherId,
      date: parsedDate,
      type,
      title: title.trim(),
      description: description.trim(),
      status: status || 'published'
    };

    if (type === 'homework' && dueDate) {
      const due = toStartOfDay(dueDate);
      if (due) entryData.dueDate = due;
    }

    const entry = await DiaryEntry.create(entryData);

    const populated = await DiaryEntry.findById(entry._id)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Diary entry created successfully',
      data: { entry: populated }
    });
  } catch (error) {
    console.error('Create Diary Entry Error:', error);
    res.status(500).json({ success: false, message: 'Error creating diary entry' });
  }
};

// @desc    Update a diary entry
// @route   PUT /api/diary/:id
// @access  Private (admin, teacher - own entries only)
exports.updateDiaryEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const entry = await DiaryEntry.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Diary entry not found' });
    }

    // Teachers can only edit their own entries
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ schoolId: req.user.schoolId, userId: req.user.id || req.user._id }).lean();
      if (!teacher || String(entry.teacherId) !== String(teacher._id)) {
        return res.status(403).json({ success: false, message: 'You can only edit your own diary entries' });
      }
    }

    const { classId, sectionId, academicYearId, subjectId, date, type, title, description, dueDate, status } = req.body;

    if (classId && mongoose.Types.ObjectId.isValid(classId)) entry.classId = classId;
    if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) entry.sectionId = sectionId;
    if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) entry.academicYearId = academicYearId;
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) entry.subjectId = subjectId;
    if (date) {
      const parsed = toStartOfDay(date);
      if (parsed) entry.date = parsed;
    }
    if (type && ['homework', 'classwork', 'notice', 'remark'].includes(type)) entry.type = type;
    if (title) entry.title = title.trim();
    if (description) entry.description = description.trim();
    if (status && ['draft', 'published'].includes(status)) entry.status = status;

    if (entry.type === 'homework' && dueDate) {
      const due = toStartOfDay(dueDate);
      if (due) entry.dueDate = due;
    } else if (entry.type !== 'homework') {
      entry.dueDate = undefined;
    }

    await entry.save();

    const populated = await DiaryEntry.findById(entry._id)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Diary entry updated successfully',
      data: { entry: populated }
    });
  } catch (error) {
    console.error('Update Diary Entry Error:', error);
    res.status(500).json({ success: false, message: 'Error updating diary entry' });
  }
};

// @desc    Delete a diary entry
// @route   DELETE /api/diary/:id
// @access  Private (admin, teacher - own entries only)
exports.deleteDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Diary entry not found' });
    }

    // Teachers can only delete their own entries
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ schoolId: req.user.schoolId, userId: req.user.id || req.user._id }).lean();
      if (!teacher || String(entry.teacherId) !== String(teacher._id)) {
        return res.status(403).json({ success: false, message: 'You can only delete your own diary entries' });
      }
    }

    await entry.deleteOne();

    res.status(200).json({ success: true, message: 'Diary entry deleted successfully' });
  } catch (error) {
    console.error('Delete Diary Entry Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting diary entry' });
  }
};
