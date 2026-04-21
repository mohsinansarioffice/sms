const express = require('express');
const { getParentDashboard, getParentChildren } = require('../controllers/parentController');
const { protect, authorize } = require('../middleware/auth');
const { checkFeature } = require('../middleware/featureGate');

const router = express.Router();
// Core parent portal; gated so plan checks run after protect (requires schoolId on user).
const parentPortalGate = checkFeature('studentManagement');

router.get('/children', protect, parentPortalGate, authorize('parent'), getParentChildren);
router.get('/dashboard', protect, parentPortalGate, authorize('parent'), getParentDashboard);

module.exports = router;
