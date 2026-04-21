const mongoose = require('mongoose');
const Student = require('../models/Student');
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

async function generateAdmissionNumber(schoolId) {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  const sid = new mongoose.Types.ObjectId(schoolId);

  const [row] = await Student.aggregate([
    {
      $match: {
        schoolId: sid,
        admissionNumber: { $regex: `^${prefix}\\d{4}$` },
      },
    },
    {
      $project: {
        seq: {
          $toInt: {
            $substrCP: [
              '$admissionNumber',
              prefix.length,
              { $subtract: [{ $strLenCP: '$admissionNumber' }, prefix.length] },
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
 * GET /api/students
 */
exports.getStudents = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const schoolId = req.user.schoolId;
    const filter = { schoolId };

    const status = (req.query.status || 'all').toLowerCase();
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;

    if (req.query.class) {
      filter['academicInfo.class'] = String(req.query.class).trim();
    }
    if (req.query.section) {
      filter['academicInfo.section'] = String(req.query.section).trim();
    }

    const search = req.query.search ? String(req.query.search).trim() : '';
    if (search) {
      filter.$text = { $search: search };
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('academicInfo.classId', 'name')
        .populate('academicInfo.sectionId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data: {
        students,
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error('getStudents error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load students',
    });
  }
};

/**
 * GET /api/students/:id
 */
exports.getStudent = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
      });
    }

    const student = await Student.findOne({
      _id: id,
      schoolId: req.user.schoolId,
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

    let siblingStudents = [];
    if (student.parentId) {
      const siblings = await Student.find({
        schoolId: req.user.schoolId,
        parentId: student.parentId,
        _id: { $ne: student._id },
        isActive: true,
      })
        .populate('academicInfo.classId', 'name')
        .populate('academicInfo.sectionId', 'name')
        .select('personalInfo admissionNumber academicInfo')
        .sort({ 'personalInfo.firstName': 1, admissionNumber: 1 })
        .lean();

      siblingStudents = siblings.map((s) => ({
        _id: s._id,
        name: `${s.personalInfo?.firstName || ''} ${s.personalInfo?.lastName || ''}`.trim(),
        admissionNumber: s.admissionNumber,
        className: s.academicInfo?.classId?.name || s.academicInfo?.class,
        sectionName: s.academicInfo?.sectionId?.name || s.academicInfo?.section,
      }));
    }

    res.json({
      success: true,
      data: { student: { ...student, siblingStudents } },
    });
  } catch (err) {
    console.error('getStudent error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load student',
    });
  }
};

const Class = require('../models/Class');
const Section = require('../models/Section');

/**
 * POST /api/students
 */
exports.createStudent = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const academicInfo = { ...req.body.academicInfo };

    // Auto-populate names from IDs for legacy compatibility
    if (academicInfo.classId && !academicInfo.class) {
      const cls = await Class.findOne({ _id: academicInfo.classId, schoolId: req.user.schoolId });
      if (cls) academicInfo.class = cls.name;
    }
    if (academicInfo.sectionId && !academicInfo.section) {
      const sec = await Section.findOne({ _id: academicInfo.sectionId, schoolId: req.user.schoolId });
      if (sec) academicInfo.section = sec.name;
    }

    const school = await School.findById(req.user.schoolId).lean();
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    const maxStudents = school.limits?.maxStudents ?? 50;
    const activeCount = await Student.countDocuments({
      schoolId: req.user.schoolId,
      isActive: true,
    });

    if (activeCount >= maxStudents) {
      return res.status(403).json({
        success: false,
        message:
          'Student limit reached for your subscription plan. Please upgrade to add more students.',
        data: { current: activeCount, limit: maxStudents },
      });
    }

    let admissionNumber;
    let student;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      admissionNumber = await generateAdmissionNumber(req.user.schoolId);
      try {
        student = await Student.create({
          schoolId: req.user.schoolId,
          admissionNumber,
          personalInfo: req.body.personalInfo,
          contactInfo: req.body.contactInfo || {},
          guardianInfo: req.body.guardianInfo,
          academicInfo: {
            ...academicInfo,
            admissionDate: academicInfo?.admissionDate || undefined,
          },
          isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        });
        break;
      } catch (e) {
        if (e.code === 11000) {
          console.warn('createStudent duplicate admissionNumber, retrying:', admissionNumber);
          continue;
        }
        throw e;
      }
    }

    if (!student) {
      return res.status(500).json({
        success: false,
        message: 'Could not assign a unique admission number. Please try again.',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { student },
    });
  } catch (err) {
    console.error('createStudent error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
    });
  }
};

const ALLOWED_UPDATE_ROOT = new Set([
  'personalInfo',
  'contactInfo',
  'guardianInfo',
  'academicInfo',
  'isActive',
]);

function mergeNested(target, patch) {
  if (!patch || typeof patch !== 'object') return;
  Object.keys(patch).forEach((key) => {
    if (patch[key] !== undefined) {
      target[key] = patch[key];
    }
  });
}

/**
 * PUT /api/students/:id
 */
exports.updateStudent = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
      });
    }

    const student = await Student.findOne({
      _id: id,
      schoolId: req.user.schoolId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const body = req.body || {};
    
    // Auto-populate names if IDs are updated in academicInfo
    if (body.academicInfo) {
      if (body.academicInfo.classId && !body.academicInfo.class) {
        const cls = await Class.findOne({ _id: body.academicInfo.classId, schoolId: req.user.schoolId });
        if (cls) body.academicInfo.class = cls.name;
      }
      if (body.academicInfo.sectionId && !body.academicInfo.section) {
        const sec = await Section.findOne({ _id: body.academicInfo.sectionId, schoolId: req.user.schoolId });
        if (sec) body.academicInfo.section = sec.name;
      }
    }

    Object.keys(body).forEach((key) => {
      if (!ALLOWED_UPDATE_ROOT.has(key)) return;
      if (key === 'isActive') {
        if (body.isActive !== undefined) student.isActive = Boolean(body.isActive);
        return;
      }
      if (typeof body[key] === 'object' && body[key] !== null && !Array.isArray(body[key])) {
        mergeNested(student[key], body[key]);
        student.markModified(key);
      }
    });

    await student.save();

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: { student },
    });
  } catch (err) {
    console.error('updateStudent error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
    });
  }
};

/**
 * DELETE /api/students/:id (soft delete)
 */
exports.deleteStudent = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
      });
    }

    const student = await Student.findOneAndUpdate(
      { _id: id, schoolId: req.user.schoolId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.json({
      success: true,
      message: 'Student deactivated successfully',
      data: { student },
    });
  } catch (err) {
    console.error('deleteStudent error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate student',
    });
  }
};

/**
 * POST /api/students/promote
 */
exports.promoteStudents = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    const {
      fromClassId,
      toClassId,
      toSectionId,
      studentIds = [],
      academicYearId,
      keepSameSection = false,
    } = req.body;

    if (!fromClassId || !toClassId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'From class, to class, and student IDs are required',
      });
    }

    const fromClass = await Class.findOne({ _id: fromClassId, schoolId: req.user.schoolId }).lean();
    const toClass = await Class.findOne({ _id: toClassId, schoolId: req.user.schoolId }).lean();
    if (!fromClass || !toClass) {
      return res.status(404).json({
        success: false,
        message: 'Source or target class not found',
      });
    }

    let targetSection = null;
    if (toSectionId) {
      targetSection = await Section.findOne({
        _id: toSectionId,
        classId: toClassId,
        schoolId: req.user.schoolId,
        isActive: true,
      }).lean();
      if (!targetSection) {
        return res.status(404).json({
          success: false,
          message: 'Target section not found for selected class',
        });
      }
    }

    const validIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid student IDs provided',
      });
    }

    const students = await Student.find({
      _id: { $in: validIds },
      schoolId: req.user.schoolId,
      'academicInfo.classId': fromClassId,
      isActive: true,
    });

    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: 'No eligible students found to promote',
      });
    }

    const updatePromises = students.map(async (student) => {
      student.academicInfo.classId = toClass._id;
      student.academicInfo.class = toClass.name;
      if (keepSameSection) {
        // Retain section as-is.
      } else if (targetSection) {
        student.academicInfo.sectionId = targetSection._id;
        student.academicInfo.section = targetSection.name;
      } else {
        student.academicInfo.sectionId = undefined;
        student.academicInfo.section = '';
      }
      if (academicYearId) {
        student.academicInfo.currentAcademicYearId = academicYearId;
      }
      return student.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Promoted ${students.length} students successfully`,
      data: {
        promotedCount: students.length,
      },
    });
  } catch (err) {
    console.error('promoteStudents error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to promote students',
    });
  }
};

const { parse: parseCsv } = require('csv-parse/sync');

function normalizeCsvHeaderKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

const CSV_FIELD_ALIASES = {
  firstname: 'firstName',
  lastname: 'lastName',
  guardianname: 'guardianName',
  guardianphone: 'guardianPhone',
  guardianemail: 'guardianEmail',
  guardianrelationship: 'guardianRelationship',
  dateofbirth: 'dateOfBirth',
  dob: 'dateOfBirth',
  birthdate: 'dateOfBirth',
  gender: 'gender',
  bloodgroup: 'bloodGroup',
  phone: 'phone',
  email: 'email',
  address: 'address',
  classname: 'className',
  class: 'className',
  sectionname: 'sectionName',
  section: 'sectionName',
  rollnumber: 'rollNumber',
  roll: 'rollNumber',
  admissiondate: 'admissionDate',
};

function mapCsvRow(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const nk = normalizeCsvHeaderKey(k);
    const canon = CSV_FIELD_ALIASES[nk];
    if (!canon) continue;
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s === '') continue;
    out[canon] = s;
  }
  return out;
}

function parseOptionalDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeStudentGender(value) {
  if (!value) return undefined;
  const x = String(value).trim().toLowerCase();
  if (x === 'm' || x === 'male') return 'Male';
  if (x === 'f' || x === 'female') return 'Female';
  if (x === 'other' || x === 'o') return 'Other';
  return null;
}

async function createStudentWithAdmissionRetry(schoolId, payload) {
  let student;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const admissionNumber = await generateAdmissionNumber(schoolId);
    try {
      student = await Student.create({
        schoolId,
        admissionNumber,
        ...payload,
      });
      break;
    } catch (e) {
      if (e.code === 11000) continue;
      throw e;
    }
  }
  return student;
}

/**
 * POST /api/students/import (multipart file field: file)
 */
exports.importStudents = async (req, res) => {
  try {
    if (!requireSchoolId(req, res)) return;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required (field name: file)',
      });
    }

    let records;
    try {
      records = parseCsv(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: `Invalid CSV: ${e.message || 'could not parse file'}`,
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV has no data rows',
      });
    }

    const school = await School.findById(req.user.schoolId).lean();
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const maxStudents = school.limits?.maxStudents ?? 50;
    const activeCount = await Student.countDocuments({
      schoolId: req.user.schoolId,
      isActive: true,
    });

    const dataRows = records
      .map((raw, idx) => ({ row: idx + 2, mapped: mapCsvRow(raw) }))
      .filter(({ mapped }) => Object.keys(mapped).length > 0);

    if (dataRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recognizable columns. Required headers include firstName, lastName, guardianName, guardianPhone.',
      });
    }

    if (activeCount + dataRows.length > maxStudents) {
      return res.status(400).json({
        success: false,
        message: `Import would exceed your student limit. You have ${maxStudents - activeCount} slot(s) left but the file has ${dataRows.length} data row(s).`,
        data: { current: activeCount, limit: maxStudents, fileRows: dataRows.length },
      });
    }

    const schoolId = req.user.schoolId;
    const classes = await Class.find({ schoolId, isActive: true }).lean();
    const classByNormName = new Map();
    for (const c of classes) {
      classByNormName.set(String(c.name).trim().toLowerCase(), c);
    }

    const sections = await Section.find({ schoolId, isActive: true }).lean();
    const sectionByClassAndName = new Map();
    for (const s of sections) {
      const cid = String(s.classId);
      const key = `${cid}::${String(s.name).trim().toLowerCase()}`;
      sectionByClassAndName.set(key, s);
    }

    let created = 0;
    const errors = [];

    for (const { row, mapped } of dataRows) {
      const firstName = mapped.firstName;
      const lastName = mapped.lastName;
      const guardianName = mapped.guardianName;
      const guardianPhone = mapped.guardianPhone;

      if (!firstName || !lastName || !guardianName || !guardianPhone) {
        errors.push({
          row,
          message: 'Missing required field(s): firstName, lastName, guardianName, guardianPhone',
        });
        continue;
      }

      const dob = parseOptionalDate(mapped.dateOfBirth);
      if (mapped.dateOfBirth && dob === null) {
        errors.push({ row, message: 'Invalid dateOfBirth' });
        continue;
      }

      let genderNorm = normalizeStudentGender(mapped.gender);
      if (mapped.gender && genderNorm === null) {
        errors.push({ row, message: 'Invalid gender (use Male, Female, or Other)' });
        continue;
      }

      const admDate = parseOptionalDate(mapped.admissionDate);
      if (mapped.admissionDate && admDate === null) {
        errors.push({ row, message: 'Invalid admissionDate' });
        continue;
      }

      const className = mapped.className;
      const sectionName = mapped.sectionName;

      if (sectionName && !className) {
        errors.push({ row, message: 'sectionName requires className' });
        continue;
      }

      let classDoc = null;
      let sectionDoc = null;
      if (className) {
        classDoc = classByNormName.get(className.trim().toLowerCase());
        if (!classDoc) {
          errors.push({ row, message: `Class not found: "${className}"` });
          continue;
        }
        if (sectionName) {
          const skey = `${String(classDoc._id)}::${sectionName.trim().toLowerCase()}`;
          sectionDoc = sectionByClassAndName.get(skey);
          if (!sectionDoc) {
            errors.push({
              row,
              message: `Section not found for class "${className}": "${sectionName}"`,
            });
            continue;
          }
        }
      }

      const personalInfo = {
        firstName,
        lastName,
        ...(dob ? { dateOfBirth: dob } : {}),
        ...(genderNorm ? { gender: genderNorm } : {}),
        ...(mapped.bloodGroup ? { bloodGroup: mapped.bloodGroup } : {}),
      };

      const contactInfo = {
        ...(mapped.phone ? { phone: mapped.phone } : {}),
        ...(mapped.email ? { email: mapped.email } : {}),
        ...(mapped.address ? { address: mapped.address } : {}),
      };

      const guardianInfo = {
        name: guardianName,
        phone: guardianPhone,
        ...(mapped.guardianEmail ? { email: mapped.guardianEmail } : {}),
        ...(mapped.guardianRelationship
          ? { relationship: mapped.guardianRelationship }
          : {}),
      };

      const academicInfo = {};
      if (classDoc) {
        academicInfo.classId = classDoc._id;
        academicInfo.class = classDoc.name;
      }
      if (sectionDoc) {
        academicInfo.sectionId = sectionDoc._id;
        academicInfo.section = sectionDoc.name;
      }
      if (mapped.rollNumber) academicInfo.rollNumber = mapped.rollNumber;
      if (admDate) academicInfo.admissionDate = admDate;

      try {
        const student = await createStudentWithAdmissionRetry(schoolId, {
          personalInfo,
          contactInfo,
          guardianInfo,
          academicInfo,
          isActive: true,
        });
        if (student) created += 1;
        else {
          errors.push({
            row,
            message: 'Could not assign a unique admission number',
          });
        }
      } catch (e) {
        const msg =
          e.name === 'ValidationError'
            ? e.message
            : e.message || 'Failed to create student';
        errors.push({ row, message: msg });
      }
    }

    const errCap = 50;
    res.status(200).json({
      success: true,
      message: `Import finished: ${created} created, ${errors.length} failed`,
      data: {
        created,
        failed: errors.length,
        errors: errors.slice(0, errCap),
        errorsTruncated: errors.length > errCap ? errors.length - errCap : 0,
      },
    });
  } catch (err) {
    console.error('importStudents error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to import students',
    });
  }
};
