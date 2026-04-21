const mongoose = require('mongoose');
const School = require('../models/School');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const FeePayment = require('../models/FeePayment');
const PLANS = require('../config/plans');
const { validationResult } = require('express-validator');

const FEATURE_KEYS = Object.keys(PLANS.free.features);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPlanLevel(planId) {
  const levels = { free: 1, basic: 2, premium: 3 };
  return levels[planId] || 0;
}

function mapToObject(m) {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m);
  if (typeof m === 'object' && m !== null) return { ...m };
  return {};
}

// @route GET /api/superadmin/overview
exports.getOverviewStats = async (req, res) => {
  try {
    const [totalSchools, activeSchools, totalStudents, totalTeachers, planAgg, feeAgg] = await Promise.all([
      School.countDocuments({}),
      School.countDocuments({ isActive: true }),
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments({ isActive: true }),
      School.aggregate([{ $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }]),
      FeePayment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    const planDistribution = {};
    planAgg.forEach((row) => {
      planDistribution[row._id] = row.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalSchools,
        activeSchools,
        totalStudents,
        totalTeachers,
        totalFeeCollected: feeAgg[0]?.total || 0,
        planDistribution
      }
    });
  } catch (error) {
    console.error('getOverviewStats:', error);
    res.status(500).json({ success: false, message: 'Error fetching overview stats' });
  }
};

// @route GET /api/superadmin/schools
exports.getAllSchools = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || '').trim();
    const filter = {};
    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: 'i' };
    }
    const skip = (page - 1) * limit;
    const total = await School.countDocuments(filter);
    const schools = await School.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    const withCounts = await Promise.all(
      schools.map(async (s) => {
        const [studentCount, teacherCount] = await Promise.all([
          Student.countDocuments({ schoolId: s._id, isActive: true }),
          Teacher.countDocuments({ schoolId: s._id, isActive: true })
        ]);
        return {
          ...s,
          featureOverrides: mapToObject(s.featureOverrides),
          studentCount,
          teacherCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        schools: withCounts,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('getAllSchools:', error);
    res.status(500).json({ success: false, message: 'Error fetching schools' });
  }
};

// @route GET /api/superadmin/schools/:id
exports.getSchoolStats = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid school id' });
    }

    const school = await School.findById(id).lean();
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const [studentCount, teacherCount, feeSum, lastPayment] = await Promise.all([
      Student.countDocuments({ schoolId: id, isActive: true }),
      Teacher.countDocuments({ schoolId: id, isActive: true }),
      FeePayment.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      FeePayment.findOne({ schoolId: id }).sort({ paymentDate: -1 }).select('paymentDate amount').lean()
    ]);

    const plan = PLANS[school.subscriptionPlan];
    const overrides = mapToObject(school.featureOverrides);

    const effectiveFeatures = {};
    FEATURE_KEYS.forEach((key) => {
      const def = plan?.features[key];
      effectiveFeatures[key] =
        Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : def;
    });

    res.status(200).json({
      success: true,
      data: {
        school: {
          ...school,
          featureOverrides: overrides
        },
        stats: {
          studentCount,
          teacherCount,
          feeCollected: feeSum[0]?.total || 0,
          lastPaymentDate: lastPayment?.paymentDate || null
        },
        planDefaults: plan?.features || {},
        effectiveFeatures
      }
    });
  } catch (error) {
    console.error('getSchoolStats:', error);
    res.status(500).json({ success: false, message: 'Error fetching school stats' });
  }
};

// @route PATCH /api/superadmin/schools/:id/plan
exports.updateSchoolPlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { newPlan, paymentDueDate } = req.body;

    if (!PLANS[newPlan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    if (paymentDueDate !== undefined) {
      if (paymentDueDate === null || paymentDueDate === '') {
        school.paymentDueDate = null;
      } else {
        const d = new Date(paymentDueDate);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid payment due date' });
        }
        school.paymentDueDate = d;
      }
    }

    if (getPlanLevel(newPlan) < getPlanLevel(school.subscriptionPlan)) {
      const studentCount = await Student.countDocuments({ schoolId: id, isActive: true });
      const teacherCount = await Teacher.countDocuments({ schoolId: id, isActive: true });
      const newPlanConfig = PLANS[newPlan];
      if (studentCount > newPlanConfig.limits.maxStudents) {
        return res.status(400).json({
          success: false,
          message: `Cannot downgrade: ${studentCount} students exceed ${newPlanConfig.name} limit (${newPlanConfig.limits.maxStudents}).`
        });
      }
      if (teacherCount > newPlanConfig.limits.maxTeachers) {
        return res.status(400).json({
          success: false,
          message: `Cannot downgrade: ${teacherCount} teachers exceed ${newPlanConfig.name} limit (${newPlanConfig.limits.maxTeachers}).`
        });
      }
    }

    school.subscriptionPlan = newPlan;
    school.subscriptionExpiry =
      newPlan === 'free'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    school.pendingPayment = false;

    await school.save();

    res.status(200).json({
      success: true,
      message: 'Plan updated',
      data: { school }
    });
  } catch (error) {
    console.error('updateSchoolPlan:', error);
    res.status(500).json({ success: false, message: 'Error updating plan' });
  }
};

// @route GET /api/superadmin/payment-alerts
exports.getPaymentAlerts = async (req, res) => {
  try {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [dueOrOverdue, awaitingPayment] = await Promise.all([
      School.find({
        isActive: true,
        subscriptionPlan: { $in: ['basic', 'premium'] },
        paymentDueDate: { $ne: null, $lte: endOfToday }
      })
        .select('name subscriptionPlan paymentDueDate pendingPayment')
        .sort({ paymentDueDate: 1 })
        .lean(),
      School.find({
        isActive: true,
        pendingPayment: true,
        subscriptionPlan: { $in: ['basic', 'premium'] }
      })
        .select('name subscriptionPlan paymentDueDate pendingPayment')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        dueOrOverdue,
        awaitingPayment
      }
    });
  } catch (error) {
    console.error('getPaymentAlerts:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment alerts' });
  }
};

// @route PATCH /api/superadmin/schools/:id/features
exports.toggleSchoolFeature = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { featureKey, value, clear } = req.body;

    if (!FEATURE_KEYS.includes(featureKey)) {
      return res.status(400).json({
        success: false,
        message: `Unknown feature. Allowed: ${FEATURE_KEYS.join(', ')}`
      });
    }

    if (!clear && typeof value !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'When not clearing, "value" must be a boolean'
      });
    }

    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    if (!school.featureOverrides) {
      school.featureOverrides = new Map();
    }

    if (clear) {
      school.featureOverrides.delete(featureKey);
    } else {
      school.featureOverrides.set(featureKey, value);
    }

    await school.save();

    const overrides = mapToObject(school.featureOverrides);
    const plan = PLANS[school.subscriptionPlan];
    const effectiveFeatures = {};
    FEATURE_KEYS.forEach((key) => {
      const def = plan?.features[key];
      effectiveFeatures[key] = Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : def;
    });

    res.status(200).json({
      success: true,
      message: clear ? 'Override cleared' : 'Feature override updated',
      data: { school, featureOverrides: overrides, effectiveFeatures }
    });
  } catch (error) {
    console.error('toggleSchoolFeature:', error);
    res.status(500).json({ success: false, message: 'Error updating feature override' });
  }
};

// @route PATCH /api/superadmin/schools/:id/active
exports.toggleSchoolActive = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    school.isActive = !!isActive;
    await school.save();

    res.status(200).json({
      success: true,
      message: `School ${school.isActive ? 'activated' : 'deactivated'}`,
      data: { school }
    });
  } catch (error) {
    console.error('toggleSchoolActive:', error);
    res.status(500).json({ success: false, message: 'Error updating school status' });
  }
};

// @route POST /api/superadmin/admins
exports.createSuperAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, password, name } = req.body;
    const normalized = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalized });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      email: normalized,
      password,
      role: 'superadmin',
      schoolId: null,
      profile: {
        name: name || 'Platform Admin',
        phone: '',
        address: ''
      }
    });

    res.status(201).json({
      success: true,
      message: 'Super admin created',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.profile.name
        }
      }
    });
  } catch (error) {
    console.error('createSuperAdmin:', error);
    res.status(500).json({ success: false, message: 'Error creating super admin' });
  }
};
