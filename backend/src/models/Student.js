const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
      index: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      trim: true,
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
        enum: ['Male', 'Female', 'Other'],
      },
      bloodGroup: { type: String, trim: true },
      photo: { type: String, trim: true },
    },
    contactInfo: {
      phone: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      address: { type: String, trim: true },
    },
    guardianInfo: {
      name: {
        type: String,
        required: [true, 'Guardian name is required'],
        trim: true,
      },
      relationship: { type: String, trim: true },
      phone: {
        type: String,
        required: [true, 'Guardian phone is required'],
        trim: true,
      },
      email: { type: String, trim: true },
    },
    academicInfo: {
      class: {
        type: String,
        trim: true,
      },
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
      section: { type: String, trim: true },
      sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
      },
      rollNumber: { type: String, trim: true },
      admissionDate: {
        type: Date,
        default: Date.now,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    /** Links this student record to a login user (portal); used for role-based features (e.g. announcements). */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

studentSchema.virtual('fullName').get(function getFullName() {
  const first = this.personalInfo?.firstName || '';
  const last = this.personalInfo?.lastName || '';
  return `${first} ${last}`.trim();
});

// Unique admission number per school
studentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });

// List/filter performance
studentSchema.index({ schoolId: 1, isActive: 1 });

// Name search (one text index per collection)
// Filter performance for relational fields
studentSchema.index({ 'academicInfo.classId': 1 });
studentSchema.index({ 'academicInfo.sectionId': 1 });

module.exports = mongoose.model('Student', studentSchema);
