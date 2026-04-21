const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  class: {
    type: String,
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required'],
    index: true
  },
  section: {
    type: String,
    trim: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    index: true
  },
  records: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance for same day/class/section
attendanceSchema.index(
  { schoolId: 1, date: 1, classId: 1, sectionId: 1 },
  { unique: true }
);

// Index for querying by student
attendanceSchema.index({ 'records.studentId': 1 });

// Method to calculate attendance percentage for a student
attendanceSchema.statics.getStudentAttendancePercentage = async function(studentId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        'records.studentId': new mongoose.Types.ObjectId(studentId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: '$records' },
    {
      $match: {
        'records.studentId': new mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [{ $in: ['$records.status', ['present', 'late']] }, 1, 0]
          }
        }
      }
    }
  ]);

  if (result.length === 0) {
    return { totalDays: 0, presentDays: 0, percentage: 0 };
  }

  const { totalDays, presentDays } = result[0];
  const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  return { totalDays, presentDays, percentage: parseFloat(percentage.toFixed(2)) };
};

module.exports = mongoose.model('Attendance', attendanceSchema);
