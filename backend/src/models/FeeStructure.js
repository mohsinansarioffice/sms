const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  feeCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeCategory',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Fee amount is required'],
    min: 0
  },
  frequency: {
    type: String,
    enum: ['one-time', 'monthly', 'quarterly', 'half-yearly', 'yearly'],
    default: 'yearly'
  },
  dueDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

feeStructureSchema.index({ schoolId: 1, academicYearId: 1, classId: 1 });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
