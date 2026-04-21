const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  capacity: {
    type: Number,
    default: 40
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

sectionSchema.index({ schoolId: 1, classId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
