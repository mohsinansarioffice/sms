const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Time slot name is required'],
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 0,
    },
    isBreak: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

timeSlotSchema.index({ schoolId: 1, displayOrder: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
