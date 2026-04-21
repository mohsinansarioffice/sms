const mongoose = require('mongoose');

const feeCategorySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Fee category name is required'],
    trim: true
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

feeCategorySchema.index({ schoolId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FeeCategory', feeCategorySchema);
