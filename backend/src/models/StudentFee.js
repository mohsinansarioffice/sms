const mongoose = require('mongoose');

const studentFeeSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  remarks: {
    type: String,
    trim: true
  }
}, { timestamps: true });

studentFeeSchema.virtual('outstandingAmount').get(function () {
  return this.totalAmount - this.discount - this.paidAmount;
});

studentFeeSchema.set('toJSON', { virtuals: true });
studentFeeSchema.set('toObject', { virtuals: true });

// Sync hook — Mongoose 9 document `pre('save')` does not receive `next`; calling it threw TypeError.
studentFeeSchema.pre('save', function () {
  const outstanding = this.totalAmount - this.discount - this.paidAmount;

  if (outstanding <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
});

studentFeeSchema.index({ schoolId: 1, studentId: 1, academicYearId: 1 });
studentFeeSchema.index({ status: 1 });

module.exports = mongoose.model('StudentFee', studentFeeSchema);
