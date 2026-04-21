const mongoose = require('mongoose');
const PLANS = require('../config/plans');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  subscriptionExpiry: {
    type: Date,
    default: function() {
      // Set default to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  limits: {
    maxStudents: {
      type: Number,
      default: 50
    },
    maxTeachers: {
      type: Number,
      default: 3
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  /** Per-school feature overrides; keys match PLANS.features. If set, overrides plan default. */
  featureOverrides: {
    type: Map,
    of: Boolean,
    default: () => new Map()
  },
  /** True until super admin confirms payment after offline collection */
  pendingPayment: {
    type: Boolean,
    default: false,
  },
  /** Monthly payment deadline (school/super admin sets); drives billing reminders */
  paymentDueDate: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true
});

// Limits always mirror PLANS (single source of truth)
schoolSchema.pre('validate', function() {
  const plan = PLANS[this.subscriptionPlan];
  if (plan && plan.limits) {
    this.limits.maxStudents = plan.limits.maxStudents;
    this.limits.maxTeachers = plan.limits.maxTeachers;
  }
});


module.exports = mongoose.model('School', schoolSchema);
