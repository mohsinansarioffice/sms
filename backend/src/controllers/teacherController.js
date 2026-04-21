const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const School = require('../models/School');

function requireSchoolId(req, res) {
  if (!req.user?.schoolId) {
    res.status(403).json({
      success: false,
      message: 'Your account is not linked to a school',
    });
    return false;
  }
  return true;
}

async function generateEmployeeId(schoolId) {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;
  const sid = new mongoose.Types.ObjectId(schoolId);

  const [row] = await Teacher.aggregate([
    {
      $match: {
        schoolId: sid,
        employeeId: { $regex: `^${prefix}\\d{4}$` },
      },
    },
    {
      $project: {
        seq: {
          $toInt: {
            $substrCP: [
              '$employeeId',
              prefix.length,
              { $subtract: [{ $strLenCP: '$employeeId' }, prefix.length] },
            ],
          },
        },
      },
    },
    { $group: { _id: null, maxSeq: { $max: '$seq' } } },
  ]);

  const next = (row && typeof row.maxSeq === 'number' ? row.maxSeq : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

/**
 * GET /api/teachers
 */
exports.getTeachers = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { schoolId: req.user.schoolId };

    const status = (req.query.status || 'all').toLowerCase();
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;

    if (req.query.department) {
      filter['professionalInfo.department'] = String(req.query.department).trim();
    }

    const search = req.query.search ? String(req.query.search).trim() : '';
    if (search) {
      filter.$text = { $search: search };
    }

    const [teachers, total] = await Promise.all([
      Teacher.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Teacher.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data: { teachers, total, totalPages, currentPage: page, limit },
    });
  } catch (err) {
    console.error('getTeachers error:', err);
    res.status(500).json({ success: false, message: 'Failed to load teachers' });
  }
};

/**
 * GET /api/teachers/:id
 */
exports.getTeacher = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher ID' });
    }

    const teacher = await Teacher.findOne({
      _id: id,
      schoolId: req.user.schoolId,
    }).lean();

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.json({ success: true, data: { teacher } });
  } catch (err) {
    console.error('getTeacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to load teacher' });
  }
};

/**
 * POST /api/teachers
 */
exports.createTeacher = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const school = await School.findById(req.user.schoolId).lean();
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const maxTeachers = school.limits?.maxTeachers ?? 3;
    const activeCount = await Teacher.countDocuments({
      schoolId: req.user.schoolId,
      isActive: true,
    });

    if (activeCount >= maxTeachers) {
      return res.status(403).json({
        success: false,
        message: `Teacher limit reached. Your ${school.subscriptionPlan} plan allows ${maxTeachers} teachers. Please upgrade to add more.`,
        limitReached: true,
        data: { current: activeCount, limit: maxTeachers },
      });
    }

    // Generate unique employeeId with retry
    let teacher;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const employeeId = await generateEmployeeId(req.user.schoolId);
      try {
        teacher = await Teacher.create({
          schoolId: req.user.schoolId,
          employeeId,
          personalInfo: req.body.personalInfo,
          contactInfo: req.body.contactInfo || {},
          professionalInfo: req.body.professionalInfo || {},
          salary: req.body.salary || 0,
          isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        });
        break;
      } catch (e) {
        if (e.code === 11000) {
          console.warn('createTeacher duplicate employeeId, retrying:', employeeId);
          continue;
        }
        throw e;
      }
    }

    if (!teacher) {
      return res.status(500).json({
        success: false,
        message: 'Could not assign a unique employee ID. Please try again.',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: { teacher },
    });
  } catch (err) {
    console.error('createTeacher error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Failed to create teacher' });
  }
};

const ALLOWED_UPDATE_ROOT = new Set([
  'personalInfo',
  'contactInfo',
  'professionalInfo',
  'salary',
  'isActive',
]);

function mergeNested(target, patch) {
  if (!patch || typeof patch !== 'object') return;
  Object.keys(patch).forEach((key) => {
    if (patch[key] !== undefined) target[key] = patch[key];
  });
}

/**
 * PUT /api/teachers/:id
 */
exports.updateTeacher = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher ID' });
    }

    const teacher = await Teacher.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const body = req.body || {};
    Object.keys(body).forEach((key) => {
      if (!ALLOWED_UPDATE_ROOT.has(key)) return;
      if (key === 'isActive') {
        if (body.isActive !== undefined) teacher.isActive = Boolean(body.isActive);
        return;
      }
      if (key === 'salary') {
        if (body.salary !== undefined) teacher.salary = Number(body.salary);
        return;
      }
      if (typeof body[key] === 'object' && body[key] !== null && !Array.isArray(body[key])) {
        mergeNested(teacher[key], body[key]);
        teacher.markModified(key);
      }
    });

    // Handle arrays inside professionalInfo explicitly
    if (body.professionalInfo?.subjects !== undefined) {
      teacher.professionalInfo.subjects = body.professionalInfo.subjects;
      teacher.markModified('professionalInfo');
    }
    if (body.professionalInfo?.classes !== undefined) {
      teacher.professionalInfo.classes = body.professionalInfo.classes;
      teacher.markModified('professionalInfo');
    }

    await teacher.save();

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: { teacher },
    });
  } catch (err) {
    console.error('updateTeacher error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Failed to update teacher' });
  }
};

/**
 * DELETE /api/teachers/:id  (soft delete)
 */
exports.deleteTeacher = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher ID' });
    }

    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, schoolId: req.user.schoolId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.json({
      success: true,
      message: 'Teacher deactivated successfully',
      data: { teacher },
    });
  } catch (err) {
    console.error('deleteTeacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to deactivate teacher' });
  }
};
