const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

classSchema.index({ schoolId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
