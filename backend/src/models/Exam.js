const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  examTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamType',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true // e.g., "Midterm Exam 2024", "Math Quiz 1"
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: 1
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: 0
  },
  examDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  instructions: {
    type: String,
    trim: true
  },
  isPublished: {
    type: Boolean,
    default: false // Results visible to students only when published
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for queries
examSchema.index({ schoolId: 1, classId: 1, subjectId: 1 });
examSchema.index({ academicYearId: 1 });

module.exports = mongoose.model('Exam', examSchema);
