const jwt = require('jsonwebtoken');
const User = require('../models/User');
const School = require('../models/School');
const { messageForSchoolInactive } = require('../lib/schoolAccessMessages');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // #region agent log
      fetch('http://127.0.0.1:7927/ingest/e6ebbb8a-aeab-4952-8d24-7d8dfe5ca2e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d5952'},body:JSON.stringify({sessionId:'4d5952',runId:process.env.DEBUG_RUN_ID||'pre-fix',hypothesisId:'H6',location:'auth.js:protect:noToken',message:'auth 401',data:{reason:'no_bearer_token'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify access token only (refresh uses opaque tokens, not JWT)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.typ && decoded.typ !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        // #region agent log
        fetch('http://127.0.0.1:7927/ingest/e6ebbb8a-aeab-4952-8d24-7d8dfe5ca2e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d5952'},body:JSON.stringify({sessionId:'4d5952',runId:process.env.DEBUG_RUN_ID||'pre-fix',hypothesisId:'H6',location:'auth.js:protect:userNotFound',message:'auth 401',data:{reason:'user_not_in_db'},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      if (req.user.schoolId) {
        const school = await School.findById(req.user.schoolId).select('isActive');
        if (!school) {
          return res.status(401).json({
            success: false,
            message: 'School not found for this account'
          });
        }
        if (!school.isActive) {
          return res.status(401).json({
            success: false,
            message: messageForSchoolInactive(req.user.role)
          });
        }
      }

      next();
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7927/ingest/e6ebbb8a-aeab-4952-8d24-7d8dfe5ca2e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d5952'},body:JSON.stringify({sessionId:'4d5952',runId:process.env.DEBUG_RUN_ID||'pre-fix',hypothesisId:'H6',location:'auth.js:protect:jwtFail',message:'auth 401 jwt',data:{reason:'invalid_or_expired_jwt',jwtMessage:error&&error.message},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7927/ingest/e6ebbb8a-aeab-4952-8d24-7d8dfe5ca2e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d5952'},body:JSON.stringify({sessionId:'4d5952',runId:process.env.DEBUG_RUN_ID||'pre-fix',hypothesisId:'H1',location:'auth.js:protect:outer',message:'auth 500',data:{errName:error&&error.name,errMessage:error&&error.message},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

/** Platform operator only — must be used after protect */
exports.authorizeSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Platform administrator access required'
    });
  }
  next();
};
