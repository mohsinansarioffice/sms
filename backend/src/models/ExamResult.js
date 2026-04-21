const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  marksObtained: {
    type: Number,
    required: [true, 'Marks obtained is required'],
    min: 0
  },
  grade: {
    type: String,
    trim: true // A, B, C, D, F or A+, A, B+, etc.
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  remarks: {
    type: String,
    trim: true
  },
  isAbsent: {
    type: Boolean,
    default: false
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index - one result per student per exam
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

// Calculate percentage and grade before saving
examResultSchema.pre('save', async function() {
  try {
    const Exam = mongoose.model('Exam');
    const exam = await Exam.findById(this.examId);
    
    if (exam && !this.isAbsent) {
      // Calculate percentage
      this.percentage = parseFloat(((this.marksObtained / exam.totalMarks) * 100).toFixed(2));
      
      // Calculate grade based on percentage
      this.grade = calculateGrade(this.percentage);
    } else if (this.isAbsent) {
      this.marksObtained = 0;
      this.percentage = 0;
      this.grade = 'AB'; // Absent
    }
  } catch (error) {
    throw error;
  }
});

// Grade calculation function
function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
}

module.exports = mongoose.model('ExamResult', examResultSchema);
