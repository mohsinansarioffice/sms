const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');

function oid(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

const uid = (u) => (u?._id || u?.id)?.toString();

/**
 * @param {import('mongoose').Types.ObjectId} schoolId
 */
async function getDefaultAcademicYearId(schoolId) {
  if (!schoolId) return null;
  let y = await AcademicYear.findOne({
    schoolId,
    isCurrent: true,
    isActive: true,
  })
    .select('_id')
    .lean();
  if (!y) {
    y = await AcademicYear.findOne({ schoolId, isActive: true })
      .sort({ startDate: -1 })
      .select('_id')
      .lean();
  }
  return y?._id || null;
}

/**
 * @param {import('mongoose').Types.ObjectId} teacherDocId
 */
async function teacherCoversClassSection(teacherDocId, classId, sectionId, schoolId, academicYearId) {
  if (!teacherDocId || !classId || !academicYearId) return false;
  const base = {
    schoolId,
    academicYearId,
    classId,
    teacherId: teacherDocId,
    isActive: true,
  };
  if (sectionId) {
    const n = await Timetable.countDocuments({
      ...base,
      $or: [{ sectionId }, { sectionId: null }],
    });
    return n > 0;
  }
  return (await Timetable.countDocuments({ ...base, sectionId: null })) > 0;
}

/**
 * @param {object} studentDoc
 */
async function teacherUserTeachesStudent(teacherUserId, studentDoc, schoolId) {
  const t = await Teacher.findOne({
    userId: teacherUserId,
    schoolId,
    isActive: true,
  })
    .select('_id')
    .lean();
  if (!t) return false;
  const ay = await getDefaultAcademicYearId(schoolId);
  if (!ay) return false;
  const cId = studentDoc?.academicInfo?.classId;
  if (!cId) return false;
  const sId = studentDoc?.academicInfo?.sectionId || null;
  return teacherCoversClassSection(t._id, cId, sId, schoolId, ay);
}

/**
 * Whether `teacherUser` may message `parentUser` (parent of a student in teacher's classes).
 */
async function teacherCanMessageParent(teacherUserId, parentUserId, schoolId) {
  const children = await Student.find({
    schoolId,
    parentId: parentUserId,
    isActive: true,
  }).lean();
  for (const ch of children) {
    if (await teacherUserTeachesStudent(teacherUserId, ch, schoolId)) return true;
  }
  return false;
}

/**
 * Whether parent may message this teacher (teaches at least one of the parent's children).
 */
async function parentCanMessageTeacher(parentUserId, teacherUserId, schoolId) {
  const students = await Student.find({
    schoolId,
    parentId: parentUserId,
    isActive: true,
  }).lean();
  for (const s of students) {
    if (await teacherUserTeachesStudent(teacherUserId, s, schoolId)) return true;
  }
  return false;
}

/**
 * @param {import('mongoose').Types.ObjectId} schoolId
 * @param {object} studentDoc
 * @param {import('mongoose').Types.ObjectId|null} academicYearId
 * @returns {Promise<import('mongoose').Types.ObjectId[]>} Teacher **User** ids
 */
async function getTeacherUserIdsForStudentClass(studentDoc, schoolId, academicYearId) {
  if (!studentDoc || !academicYearId) return [];
  const classId = studentDoc.academicInfo?.classId;
  if (!classId) return [];
  const sectionId = studentDoc.academicInfo?.sectionId || null;

  const q = {
    schoolId,
    academicYearId,
    classId,
    isActive: true,
    teacherId: { $ne: null },
  };
  if (sectionId) {
    q.$or = [{ sectionId }, { sectionId: null }];
  } else {
    q.sectionId = null;
  }

  const tids = await Timetable.find(q).distinct('teacherId');
  const out = new Set();
  for (const tid of tids) {
    if (!tid) continue;
    const trow = await Teacher.findById(tid).select('userId').lean();
    if (trow?.userId) out.add(trow.userId.toString());
  }
  return [...out].map((s) => oid(s));
}

/**
 * @param {import('mongoose').Types.ObjectId} schoolId
 * @param {import('mongoose').Types.ObjectId} teacherUserId
 * @param {import('mongoose').Types.ObjectId|null} academicYearId
 */
async function getStudentUserIdsTaughtByTeacher(teacherUserId, schoolId, academicYearId) {
  if (!academicYearId) return [];
  const t = await Teacher.findOne({
    userId: teacherUserId,
    schoolId,
    isActive: true,
  })
    .select('_id')
    .lean();
  if (!t) return [];

  const rows = await Timetable.find({
    schoolId,
    academicYearId: academicYearId,
    teacherId: t._id,
    isActive: true,
  })
    .select('classId sectionId')
    .lean();

  const orConds = [];
  const seen = new Set();
  for (const r of rows) {
    const k = `${r.classId}:${r.sectionId || ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (r.sectionId) {
      orConds.push({
        'academicInfo.classId': r.classId,
        $or: [{ 'academicInfo.sectionId': r.sectionId }, { 'academicInfo.sectionId': null }],
      });
    } else {
      orConds.push({ 'academicInfo.classId': r.classId, 'academicInfo.sectionId': null });
    }
  }
  if (!orConds.length) return [];

  const studocs = await Student.find({
    schoolId,
    isActive: true,
    $or: orConds,
    userId: { $ne: null },
  })
    .select('userId')
    .lean();
  return studocs.map((s) => s.userId).filter(Boolean);
}

/**
 * Returns whether `sender` may direct-message `recipient` (same school, active users).
 * @param {{ schoolId: any, _id: any, id?: any, role: string }} sender — req.user
 * @param {{ schoolId: any, _id: any, id?: any, role: string, isActive?: boolean }} recipient
 */
async function isMessageBetweenUsersAllowed(schoolId, sender, recipient) {
  if (!sender || !recipient) return false;
  if (recipient.isActive === false) return false;
  const sid = uid(sender);
  const rid = uid(recipient);
  if (!sid || !rid || sid === rid) return false;
  if (String(sender.schoolId) !== String(schoolId) || String(recipient.schoolId) !== String(schoolId)) {
    return false;
  }
  if (recipient.role === 'superadmin') return false;

  if (sender.role === 'admin') {
    return ['admin', 'teacher', 'student', 'parent'].includes(recipient.role);
  }

  if (sender.role === 'parent') {
    if (recipient.role === 'admin') return true;
    if (recipient.role === 'teacher') {
      return await parentCanMessageTeacher(oid(sid), oid(rid), schoolId);
    }
    return false;
  }

  if (sender.role === 'student') {
    if (recipient.role === 'admin') return true;
    const st = await Student.findOne({ userId: sender._id || sender.id, schoolId, isActive: true }).lean();
    if (!st) {
      return recipient.role === 'admin';
    }
    if (recipient.role === 'parent' && st.parentId) {
      return String(st.parentId) === rid;
    }
    if (recipient.role === 'teacher') {
      return await teacherUserTeachesStudent(
        recipient._id || recipient.id,
        st,
        schoolId
      );
    }
    if (recipient.role === 'student') {
      return false;
    }
    return false;
  }

  if (sender.role === 'teacher') {
    if (recipient.role === 'admin') return true;
    if (recipient.role === 'teacher') return true;
    if (recipient.role === 'parent') {
      return await teacherCanMessageParent(
        sender._id || sender.id,
        recipient._id || recipient.id,
        schoolId
      );
    }
    if (recipient.role === 'student') {
      const sdoc = await Student.findOne({
        userId: recipient._id || recipient.id,
        schoolId,
        isActive: true,
      }).lean();
      if (!sdoc) return false;
      return await teacherUserTeachesStudent(
        sender._id || sender.id,
        sdoc,
        schoolId
      );
    }
    return false;
  }

  return false;
}

/**
 * Distinct user ids the sender may address (excludes self).
 * @param {{ schoolId: any, _id: any, id?: any, role: string }} senderUser
 */
async function getMessageRecipientUserIds(schoolId, senderUser) {
  const selfId = oid(senderUser._id || senderUser.id);
  const baseQ = { schoolId, isActive: true, _id: { $ne: selfId } };

  if (senderUser.role === 'admin') {
    return User.find({
      ...baseQ,
      role: { $in: ['admin', 'teacher', 'student', 'parent'] },
    })
      .select('_id')
      .lean()
      .then((rows) => rows.map((r) => r._id));
  }

  if (senderUser.role === 'parent') {
    const ids = new Set();
    (await User.find({ ...baseQ, role: 'admin' }).select('_id').lean()).forEach((u) => ids.add(u._id.toString()));

    const teacherUsers = await User.find({ ...baseQ, role: 'teacher' }).select('_id').lean();
    for (const tu of teacherUsers) {
      if (await parentCanMessageTeacher(selfId, tu._id, schoolId)) {
        ids.add(tu._id.toString());
      }
    }
    return [...ids].map((s) => oid(s));
  }

  if (senderUser.role === 'student') {
    const st = await Student.findOne({ userId: selfId, schoolId, isActive: true }).lean();
    if (!st) {
      return User.find({ ...baseQ, role: 'admin' })
        .select('_id')
        .lean()
        .then((r) => r.map((x) => x._id));
    }
    const ids = new Set();
    (await User.find({ ...baseQ, role: 'admin' }).select('_id').lean()).forEach((u) => ids.add(u._id.toString()));
    if (st.parentId) {
      const p = await User.findOne({ _id: st.parentId, schoolId, isActive: true }).select('_id').lean();
      if (p) ids.add(p._id.toString());
    }
    const ay = await getDefaultAcademicYearId(schoolId);
    if (ay) {
      for (const tid of await getTeacherUserIdsForStudentClass(st, schoolId, ay)) {
        if (tid) ids.add(tid.toString());
      }
    }
    return [...ids].map((s) => oid(s));
  }

  if (senderUser.role === 'teacher') {
    const ids = new Set();
    (await User.find({ ...baseQ, role: { $in: ['admin', 'teacher'] } }).select('_id').lean()).forEach((u) => {
      ids.add(u._id.toString());
    });
    const ay = await getDefaultAcademicYearId(schoolId);
    (await getStudentUserIdsTaughtByTeacher(selfId, schoolId, ay)).forEach((u) => {
      if (u) ids.add(u.toString());
    });
    const parentUsers = await User.find({ ...baseQ, role: 'parent' }).select('_id').lean();
    for (const p of parentUsers) {
      if (await teacherCanMessageParent(selfId, p._id, schoolId)) {
        ids.add(p._id.toString());
      }
    }
    return [...ids].map((s) => oid(s));
  }

  return [];
}

module.exports = {
  isMessageBetweenUsersAllowed,
  getMessageRecipientUserIds,
  getDefaultAcademicYearId,
};
