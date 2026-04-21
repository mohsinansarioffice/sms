const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Academic year name is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

academicYearSchema.index({ schoolId: 1, name: 1 }, { unique: true });

// Ensure only one current academic year per school
academicYearSchema.pre('save', async function() {
  if (!this.isCurrent) return;

  // If this year is set as current, unset any other current year for the school.
  await this.constructor.updateMany(
    { schoolId: this.schoolId, isActive: true, _id: { $ne: this._id } },
    { isCurrent: false }
  );
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);
