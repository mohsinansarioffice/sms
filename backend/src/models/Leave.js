const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    applicantType: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['sick', 'casual', 'medical', 'other'],
      default: 'casual',
    },
    fromDate: {
      type: Date,
      required: true,
      index: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalNote: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

leaveSchema.index({ schoolId: 1, applicantId: 1, fromDate: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
