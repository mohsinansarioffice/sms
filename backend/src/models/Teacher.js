const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    personalInfo: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
      },
      dateOfBirth: { type: Date },
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
      },
      photo: { type: String },
    },
    contactInfo: {
      phone: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      address: { type: String, trim: true },
    },
    professionalInfo: {
      designation: { type: String, trim: true },
      department: { type: String, trim: true },
      joiningDate: { type: Date, default: Date.now },
      qualification: { type: String, trim: true },
      experience: { type: Number, default: 0 },
      subjects: [{ type: String, trim: true }],
      classes: [{ type: String, trim: true }],
    },
    salary: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique employeeId per school
teacherSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });

// Full-text search
teacherSchema.index({
  'personalInfo.firstName': 'text',
  'personalInfo.lastName': 'text',
  employeeId: 'text',
});

// Full-name virtual
teacherSchema.virtual('fullName').get(function () {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

teacherSchema.set('toJSON', { virtuals: true });
teacherSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Teacher', teacherSchema);
