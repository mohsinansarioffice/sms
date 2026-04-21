const mongoose = require('mongoose');

const schoolEventSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
    },
    type: {
      type: String,
      enum: ['holiday', 'exam', 'event', 'other'],
      default: 'event',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'teachers', 'students', 'parents'],
      default: 'all',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

schoolEventSchema.index({ schoolId: 1, eventDate: 1 });

module.exports = mongoose.model('SchoolEvent', schoolEventSchema);
