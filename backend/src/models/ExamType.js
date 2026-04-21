const mongoose = require('mongoose');

const examTypeSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Exam type name is required'],
    trim: true // e.g., "Midterm", "Final", "Quiz", "Assignment"
  },
  description: {
    type: String,
    trim: true
  },
  weightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0 // Percentage weightage in final grade calculation
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique exam type per school
examTypeSchema.index({ schoolId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ExamType', examTypeSchema);
