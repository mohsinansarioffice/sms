const School = require('../models/School');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const PLANS = require('../config/plans');

function getPlanLevel(planId) {
  const levels = { free: 1, basic: 2, premium: 3 };
  return levels[planId] || 0;
}

// @desc    Get all available plans with status relative to current school plan
// @route   GET /api/subscription/plans
// @access  Private
exports.getPlans = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);

    const plansWithStatus = Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
      isCurrent: school.subscriptionPlan === key,
      isUpgrade: getPlanLevel(key) > getPlanLevel(school.subscriptionPlan),
      isDowngrade: getPlanLevel(key) < getPlanLevel(school.subscriptionPlan)
    }));

    res.status(200).json({
      success: true,
      data: {
        plans: plansWithStatus,
        currentPlan: school.subscriptionPlan
      }
    });
  } catch (error) {
    console.error('Get Plans Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching plans' });
  }
};

// @desc    Get current usage statistics
// @route   GET /api/subscription/usage
// @access  Private
exports.getUsage = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    const plan = PLANS[school.subscriptionPlan];

    const features = { ...plan.features };
    const overrides = school.featureOverrides;
    if (overrides && typeof overrides.forEach === 'function') {
      overrides.forEach((value, key) => {
        features[key] = value;
      });
    }

    if (req.user.role === 'teacher') {
      return res.status(200).json({
        success: true,
        data: {
          plan: {
            name: plan.name,
            id: school.subscriptionPlan
          },
          features
        }
      });
    }

    const studentCount = await Student.countDocuments({
      schoolId: req.user.schoolId,
      isActive: true
    });

    const teacherCount = await Teacher.countDocuments({
      schoolId: req.user.schoolId,
      isActive: true
    });

    const studentsPercentage = plan.limits.maxStudents === 999999
      ? 0
      : (studentCount / plan.limits.maxStudents) * 100;

    const teachersPercentage = plan.limits.maxTeachers === 999999
      ? 0
      : (teacherCount / plan.limits.maxTeachers) * 100;

    res.status(200).json({
      success: true,
      data: {
        plan: {
          name: plan.name,
          id: school.subscriptionPlan,
          price: plan.price
        },
        usage: {
          students: {
            current: studentCount,
            limit: plan.limits.maxStudents,
            percentage: studentsPercentage
          },
          teachers: {
            current: teacherCount,
            limit: plan.limits.maxTeachers,
            percentage: teachersPercentage
          }
        },
        features,
        subscriptionExpiry: school.subscriptionExpiry,
        pendingPayment: !!school.pendingPayment,
        paymentDueDate: school.paymentDueDate || null
      }
    });
  } catch (error) {
    console.error('Get Usage Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching usage statistics' });
  }
};

// @desc    Change subscription plan (mock payment)
// @route   POST /api/subscription/change-plan
// @access  Private (admin only)
exports.changePlan = async (req, res) => {
  try {
    const { newPlan } = req.body;

    if (!PLANS[newPlan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    if (newPlan === 'basic' || newPlan === 'premium') {
      return res.status(403).json({
        success: false,
        message:
          'Upgrading to a paid plan is not available here. Contact support with your payment confirmation; your plan will be activated after we verify payment.',
      });
    }

    const school = await School.findById(req.user.schoolId);

    // If downgrading, ensure current usage fits within new plan limits
    if (getPlanLevel(newPlan) < getPlanLevel(school.subscriptionPlan)) {
      const studentCount = await Student.countDocuments({
        schoolId: req.user.schoolId,
        isActive: true
      });
      const teacherCount = await Teacher.countDocuments({
        schoolId: req.user.schoolId,
        isActive: true
      });
      const newPlanConfig = PLANS[newPlan];

      if (studentCount > newPlanConfig.limits.maxStudents) {
        return res.status(400).json({
          success: false,
          message: `Cannot downgrade. You have ${studentCount} active students but the ${newPlanConfig.name} plan allows only ${newPlanConfig.limits.maxStudents}.`
        });
      }

      if (teacherCount > newPlanConfig.limits.maxTeachers) {
        return res.status(400).json({
          success: false,
          message: `Cannot downgrade. You have ${teacherCount} active teachers but the ${newPlanConfig.name} plan allows only ${newPlanConfig.limits.maxTeachers}.`
        });
      }
    }

    const wasUpgrade = getPlanLevel(newPlan) > getPlanLevel(school.subscriptionPlan);

    school.subscriptionPlan = newPlan;
    if (newPlan === 'free') {
      school.pendingPayment = false;
    }
    school.subscriptionExpiry = newPlan === 'free'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)   // 1 year for free
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);   // 30 days for paid

    await school.save();

    res.status(200).json({
      success: true,
      message: `Successfully ${wasUpgrade ? 'upgraded' : 'changed'} to ${PLANS[newPlan].name} plan`,
      data: {
        newPlan,
        expiryDate: school.subscriptionExpiry
      }
    });
  } catch (error) {
    console.error('Change Plan Error:', error);
    res.status(500).json({ success: false, message: 'Error changing plan' });
  }
};
