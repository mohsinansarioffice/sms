const mongoose = require('mongoose');

const announcementAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Attachment', trim: true },
    url: { type: String, required: true, trim: true },
    size: { type: Number },
    type: { type: String, trim: true }
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required']
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'teachers', 'students', 'parents', 'specific_class'],
    default: 'all'
  },
  targetClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  attachments: {
    type: [announcementAttachmentSchema],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

announcementSchema.index({ schoolId: 1, createdAt: -1 });
announcementSchema.index({ schoolId: 1, targetAudience: 1 });
announcementSchema.index({ schoolId: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
