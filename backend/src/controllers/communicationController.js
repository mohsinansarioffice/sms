const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');
const Message = require('../models/Message');
const Student = require('../models/Student');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const uid = (u) => (u?.id || u?._id)?.toString();

/** Build one { name, url, size?, type? } from a plain object; require url. */
function oneAttachmentObject(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const url = row.url != null ? String(row.url).trim() : '';
  if (!url) return null;
  const name = row.name != null ? String(row.name).trim() || 'Attachment' : 'Attachment';
  const out = { name, url };
  if (row.size != null && row.size !== '' && !Number.isNaN(Number(row.size))) {
    out.size = Number(row.size);
  }
  if (row.type) out.type = String(row.type);
  return out;
}

/** Parse non-JSON strings like `[ { name: 'x', url: 'https://...' } ]` (runtime log evidence). */
function parseLooseAttachmentString(str) {
  const urlM = /url\s*:\s*['"]([^'"]+)['"]/i.exec(str);
  const nameM = /name\s*:\s*['"]([^'"]*)['"]/i.exec(str);
  const url = urlM && urlM[1] ? urlM[1].trim() : '';
  if (!url) return null;
  const name = nameM && nameM[1] != null ? nameM[1].trim() || 'Attachment' : 'Attachment';
  return { name, url };
}

/**
 * Clients sometimes send attachments as a stringified blob or string elements.
 * Mongoose expects an array of subdocuments { name, url, ... }.
 */
function normalizeAnnouncementAttachments(raw) {
  if (raw == null) return [];
  let list = raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      list = JSON.parse(t);
    } catch {
      const loose = parseLooseAttachmentString(t);
      return loose ? [loose] : [];
    }
  }
  if (!Array.isArray(list)) {
    const one = oneAttachmentObject(list);
    return one ? [one] : [];
  }
  const out = [];
  for (const slot of list) {
    if (slot == null) continue;
    if (typeof slot === 'string') {
      const s = slot.trim();
      if (!s) continue;
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          for (const p of parsed) {
            const o = oneAttachmentObject(p);
            if (o) out.push(o);
          }
        } else {
          const o = oneAttachmentObject(parsed);
          if (o) out.push(o);
        }
      } catch {
        const loose = parseLooseAttachmentString(s);
        if (loose) out.push(loose);
      }
      continue;
    }
    const o = oneAttachmentObject(slot);
    if (o) out.push(o);
  }
  return out;
}

/** Ensure Mongoose receives plain { name, url, ... } objects only (never stray strings). */
function finalizeAttachmentDocs(normalized) {
  return (normalized || [])
    .map((a) => {
      if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
      const url = a.url != null ? String(a.url).trim() : '';
      if (!url) return null;
      const row = {
        name: a.name != null ? String(a.name).trim() || 'Attachment' : 'Attachment',
        url
      };
      if (a.size != null && a.size !== '' && !Number.isNaN(Number(a.size))) {
        row.size = Number(a.size);
      }
      if (a.type) row.type = String(a.type);
      return row;
    })
    .filter(Boolean);
}

async function getStudentDocForUser(req) {
  if (req.user.role !== 'student') return null;
  return Student.findOne({
    userId: req.user._id || req.user.id,
    schoolId: req.user.schoolId
  }).lean();
}

function audienceAndClause(user, student) {
  if (user.role === 'admin') return null;
  if (user.role === 'teacher') {
    return { $or: [{ targetAudience: 'all' }, { targetAudience: 'teachers' }] };
  }
  if (user.role === 'parent') {
    return { $or: [{ targetAudience: 'all' }, { targetAudience: 'parents' }] };
  }
  if (user.role === 'student') {
    const or = [
      { targetAudience: 'all' },
      { targetAudience: 'students' }
    ];
    const classId = student?.academicInfo?.classId;
    if (classId) {
      or.push({
        targetAudience: 'specific_class',
        targetClasses: classId
      });
    }
    return { $or: or };
  }
  return { targetAudience: 'all' };
}

function canViewAnnouncement(user, announcement, student) {
  if (!announcement) return false;
  if (announcement.schoolId.toString() !== user.schoolId.toString()) return false;
  if (user.role === 'admin') return true;
  const ta = announcement.targetAudience;
  if (user.role === 'teacher') {
    return ta === 'all' || ta === 'teachers';
  }
  if (user.role === 'parent') {
    return ta === 'all' || ta === 'parents';
  }
  if (user.role === 'student') {
    if (ta === 'all' || ta === 'students') return true;
    if (ta === 'specific_class' && student?.academicInfo?.classId) {
      const cid = student.academicInfo.classId.toString();
      return (announcement.targetClasses || []).some((c) => c.toString() === cid);
    }
    return false;
  }
  return ta === 'all';
}

// ============ ANNOUNCEMENTS ============

exports.getAnnouncements = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || '').trim();

    const student = await getStudentDocForUser(req);

    const query = {
      schoolId: req.user.schoolId,
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    };

    const aud = audienceAndClause(req.user, student);
    const andParts = [];
    if (aud) andParts.push(aud);
    if (search) {
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(esc, 'i');
      andParts.push({ $or: [{ title: rx }, { content: rx }] });
    }
    if (andParts.length) query.$and = andParts;

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'profile.name role email')
      .populate('targetClasses', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const readIds = await AnnouncementRead.find({
      userId: req.user._id || req.user.id,
      announcementId: { $in: announcements.map((a) => a._id) }
    }).lean();

    const readMap = new Map(readIds.map((r) => [r.announcementId.toString(), r]));

    const announcementsWithReadStatus = announcements.map((announcement) => {
      const read = readMap.get(announcement._id.toString());
      return {
        ...announcement,
        isRead: !!read,
        readAt: read?.readAt
      };
    });

    const total = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        announcements: announcementsWithReadStatus,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Get Announcements Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements'
    });
  }
};

exports.getAnnouncement = async (req, res) => {
  try {
    const student = await getStudentDocForUser(req);

    const announcement = await Announcement.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId
    })
      .populate('createdBy', 'profile.name role email')
      .populate('targetClasses', 'name');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (!canViewAnnouncement(req.user, announcement, student)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this announcement'
      });
    }

    const read = await AnnouncementRead.findOne({
      announcementId: announcement._id,
      userId: req.user._id || req.user.id
    });

    res.status(200).json({
      success: true,
      data: {
        announcement: {
          ...announcement.toObject(),
          isRead: !!read,
          readAt: read?.readAt
        }
      }
    });
  } catch (error) {
    console.error('Get Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching announcement'
    });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (req.body.targetAudience === 'specific_class') {
      const tc = req.body.targetClasses;
      if (!Array.isArray(tc) || tc.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Select at least one class when targeting a specific class'
        });
      }
    }

    const attachments = finalizeAttachmentDocs(
      normalizeAnnouncementAttachments(req.body.attachments)
    );
    const announcement = await Announcement.create({
      title: String(req.body.title || '').trim(),
      content: String(req.body.content || '').trim(),
      priority: req.body.priority || 'normal',
      targetAudience: req.body.targetAudience || 'all',
      targetClasses: Array.isArray(req.body.targetClasses) ? req.body.targetClasses : [],
      attachments,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      isPinned: Boolean(req.body.isPinned),
      schoolId: req.user.schoolId,
      createdBy: req.user._id || req.user.id
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'profile.name role')
      .populate('targetClasses', 'name');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement: populatedAnnouncement }
    });
  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating announcement'
    });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (
      req.user.role !== 'admin' &&
      announcement.createdBy.toString() !== uid(req.user)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this announcement'
      });
    }

    if (req.body.targetAudience === 'specific_class') {
      const tc = req.body.targetClasses;
      if (tc !== undefined && (!Array.isArray(tc) || tc.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Select at least one class when targeting a specific class'
        });
      }
    }

    const { schoolId: _sid2, createdBy: _cb2, ...updates } = req.body;
    if (updates.attachments !== undefined) {
      updates.attachments = finalizeAttachmentDocs(
        normalizeAnnouncementAttachments(updates.attachments)
      );
    }
    Object.assign(announcement, updates);
    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'profile.name role')
      .populate('targetClasses', 'name');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: { announcement: updatedAnnouncement }
    });
  } catch (error) {
    console.error('Update Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating announcement'
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (
      req.user.role !== 'admin' &&
      announcement.createdBy.toString() !== uid(req.user)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement'
      });
    }

    announcement.isActive = false;
    await announcement.save();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting announcement'
    });
  }
};

exports.markAnnouncementRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid announcement id' });
    }

    const student = await getStudentDocForUser(req);
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId,
      isActive: true
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (!canViewAnnouncement(req.user, announcement, student)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const existing = await AnnouncementRead.findOne({
      announcementId: req.params.id,
      userId: req.user._id || req.user.id
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already marked as read'
      });
    }

    await AnnouncementRead.create({
      announcementId: req.params.id,
      userId: req.user._id || req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking announcement as read'
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const student = await getStudentDocForUser(req);

    const query = {
      schoolId: req.user.schoolId,
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    };

    const aud = audienceAndClause(req.user, student);
    if (aud) query.$and = [aud];

    const allAnnouncements = await Announcement.find(query).select('_id').lean();
    const announcementIds = allAnnouncements.map((a) => a._id);

    const readAnnouncements = await AnnouncementRead.find({
      announcementId: { $in: announcementIds },
      userId: req.user._id || req.user.id
    }).select('announcementId');

    const readSet = new Set(readAnnouncements.map((r) => r.announcementId.toString()));
    const unreadCount = announcementIds.filter((id) => !readSet.has(id.toString())).length;

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count'
    });
  }
};

/** Read receipts — creator or admin */
exports.getAnnouncementReaders = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (
      req.user.role !== 'admin' &&
      announcement.createdBy.toString() !== uid(req.user)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const reads = await AnnouncementRead.find({ announcementId: announcement._id })
      .populate('userId', 'profile.name role email')
      .sort({ readAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { readers: reads, totalReaders: reads.length }
    });
  } catch (error) {
    console.error('Get Announcement Readers Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching read receipts' });
  }
};

// ============ MESSAGES ============

exports.getMessages = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { type = 'inbox' } = req.query;

    const query = {
      schoolId: req.user.schoolId,
      isDeleted: false
    };

    if (type === 'inbox') {
      query.recipientId = req.user._id || req.user.id;
    } else if (type === 'sent') {
      query.senderId = req.user._id || req.user.id;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    const messages = await Message.find(query)
      .populate('senderId', 'profile.name role email')
      .populate('recipientId', 'profile.name role email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        messages,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

exports.getMessage = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId,
      $or: [
        { senderId: req.user._id || req.user.id },
        { recipientId: req.user._id || req.user.id }
      ]
    })
      .populate('senderId', 'profile.name role email')
      .populate('recipientId', 'profile.name role email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const recipientRef = message.recipientId;
    const recipientIdStr = (recipientRef?._id || recipientRef)?.toString();
    const userIdStr = (req.user._id || req.user.id)?.toString();

    if (recipientIdStr === userIdStr && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    const populated = await Message.findById(message._id)
      .populate('senderId', 'profile.name role email')
      .populate('recipientId', 'profile.name role email');

    res.status(200).json({
      success: true,
      data: { message: populated }
    });
  } catch (error) {
    console.error('Get Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message'
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const recipientId = req.body.recipientId;
    const recipient = await User.findOne({
      _id: recipientId,
      schoolId: req.user.schoolId,
      isActive: true
    });
    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Invalid recipient' });
    }

    if (req.user.role === 'parent' && recipient.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Parents can only send messages to school administrators'
      });
    }

    const message = await Message.create({
      subject: req.body.subject,
      content: req.body.content,
      attachments: req.body.attachments,
      schoolId: req.user.schoolId,
      senderId: req.user._id || req.user.id,
      recipientId
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'profile.name role email')
      .populate('recipientId', 'profile.name role email');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId,
      $or: [
        { senderId: req.user._id || req.user.id },
        { recipientId: req.user._id || req.user.id }
      ]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isDeleted = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

exports.getUnreadMessagesCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      schoolId: req.user.schoolId,
      recipientId: req.user._id || req.user.id,
      isRead: false,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get Unread Messages Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread messages count'
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const filter = {
      schoolId: req.user.schoolId,
      _id: { $ne: req.user._id || req.user.id },
      isActive: true
    };
    if (req.user.role === 'parent') {
      filter.role = 'admin';
    }

    const users = await User.find(filter)
      .select('profile.name role email')
      .sort({ 'profile.name': 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};
