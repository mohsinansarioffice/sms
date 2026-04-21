const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required'],
    index: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    index: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['homework', 'classwork', 'notice', 'remark'],
    required: [true, 'Entry type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  }
}, {
  timestamps: true
});

// Compound index for fast class/section/date queries
diaryEntrySchema.index({ schoolId: 1, classId: 1, sectionId: 1, date: 1 });
diaryEntrySchema.index({ schoolId: 1, date: 1 });
diaryEntrySchema.index({ teacherId: 1, date: -1 });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
