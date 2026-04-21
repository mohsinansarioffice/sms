const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  studentFeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentFee',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'cheque', 'bank_transfer'],
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Generate before validators run so `required: true` passes; use document id for global uniqueness (no race on counters).
feePaymentSchema.pre('validate', function () {
  if (!this.receiptNumber) {
    const year = new Date().getFullYear();
    const idPart = this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString();
    this.receiptNumber = `REC-${year}-${idPart}`;
  }
});

feePaymentSchema.index({ paymentDate: 1 });
feePaymentSchema.index({ schoolId: 1, paymentDate: -1 });

module.exports = mongoose.model('FeePayment', feePaymentSchema);
