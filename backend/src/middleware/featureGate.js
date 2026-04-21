const School = require('../models/School');
const PLANS = require('../config/plans');

// Middleware to check if school has access to a feature
exports.checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'This action requires a school subscription context.',
        });
      }

      const school = await School.findById(req.user.schoolId);

      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }

      const plan = PLANS[school.subscriptionPlan];

      if (!plan) {
        return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
      }

      const overrides = school.featureOverrides;
      let allowed = !!plan.features[featureName];
      if (overrides && typeof overrides.get === 'function' && overrides.has(featureName)) {
        allowed = overrides.get(featureName);
      }

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `This feature is not available in your ${plan.name} plan. Please upgrade to access this feature.`,
          featureLocked: true,
          currentPlan: school.subscriptionPlan,
          requiredPlan: getRequiredPlan(featureName)
        });
      }

      next();
    } catch (error) {
      console.error('Feature Gate Error:', error);
      res.status(500).json({ success: false, message: 'Error checking feature access' });
    }
  };
};

/** Lowest tier where the feature is enabled by default */
function getRequiredPlan(featureName) {
  const tiers = ['free', 'basic', 'premium'];
  for (const tier of tiers) {
    if (PLANS[tier] && PLANS[tier].features && PLANS[tier].features[featureName]) {
      return tier;
    }
  }
  return null;
}

// Middleware to check usage limits before creating a resource
exports.checkLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'This action requires a school subscription context.',
        });
      }

      const school = await School.findById(req.user.schoolId);
      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }

      const plan = PLANS[school.subscriptionPlan];

      let currentCount = 0;
      let limitKey = '';

      if (resourceType === 'students') {
        const Student = require('../models/Student');
        currentCount = await Student.countDocuments({
          schoolId: req.user.schoolId,
          isActive: true
        });
        limitKey = 'maxStudents';
      } else if (resourceType === 'teachers') {
        const Teacher = require('../models/Teacher');
        currentCount = await Teacher.countDocuments({
          schoolId: req.user.schoolId,
          isActive: true
        });
        limitKey = 'maxTeachers';
      }

      if (currentCount >= plan.limits[limitKey]) {
        return res.status(403).json({
          success: false,
          message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} limit reached. Your ${plan.name} plan allows ${plan.limits[limitKey]} ${resourceType}. Please upgrade to add more.`,
          limitReached: true,
          currentCount,
          limit: plan.limits[limitKey],
          currentPlan: school.subscriptionPlan
        });
      }

      next();
    } catch (error) {
      console.error('Limit Check Error:', error);
      res.status(500).json({ success: false, message: 'Error checking limits' });
    }
  };
};
