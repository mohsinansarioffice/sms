const User = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const RefreshToken = require('../models/RefreshToken');
const {
  hashRefreshToken,
  generateOpaqueRefreshToken,
  generateAccessToken,
  getRefreshExpiresAt,
} = require('../utils/sessionTokens');
const { validationResult } = require('express-validator');
const PLANS = require('../config/plans');

async function issueSession(user, schoolIdForToken) {
  const accessToken = generateAccessToken(user._id, user.role, schoolIdForToken);
  const rawRefresh = generateOpaqueRefreshToken();
  const tokenHash = hashRefreshToken(rawRefresh);
  const expiresAt = getRefreshExpiresAt();
  await RefreshToken.create({ userId: user._id, tokenHash, expiresAt });
  return { accessToken, refreshToken: rawRefresh };
}

// @desc    Register school and admin user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('Starting registration...', req.body);

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { schoolName, name, email, password, phone, subscriptionPlan: requestedPlan } = req.body;

    let selectedPlan = 'free';
    if (requestedPlan && PLANS[requestedPlan]) {
      selectedPlan = requestedPlan;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create school first
    console.log('Creating school...');
    const schoolPayload = { name: schoolName };
    if (selectedPlan !== 'free') {
      const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      schoolPayload.subscriptionPlan = selectedPlan;
      schoolPayload.subscriptionExpiry = oneDayFromNow;
      schoolPayload.pendingPayment = true;
    } else {
      schoolPayload.subscriptionPlan = 'free';
      schoolPayload.pendingPayment = false;
    }
    const school = await School.create(schoolPayload);
    console.log('School created:', school._id);

    // Create admin user
    console.log('Creating admin user...');
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: 'admin',
      schoolId: school._id,
      profile: {
        name,
        phone: phone || '',
        address: ''
      }
    });
    console.log('User created:', user._id);

    // Update school owner
    school.owner = user._id;
    await school.save();

    const { accessToken, refreshToken } = await issueSession(user, school._id);

    console.log('Registration complete!');

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.profile.name,
          schoolId: school._id,
          schoolName: school.name
        }
      }
    });

  } catch (error) {
    console.error('Registration Error:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });

    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? `Registration failed: ${error.message}` 
        : 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    let school = null;
    if (user.role !== 'superadmin') {
      school = await School.findById(user.schoolId);
      if (!school) {
        return res.status(401).json({
          success: false,
          message: 'School not found for this account'
        });
      }
    }

    const { accessToken, refreshToken } = await issueSession(
      user,
      user.schoolId || null
    );

    console.log('Login successful:', user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.profile.name,
          schoolId: school ? school._id : null,
          schoolName: school ? school.name : 'Platform',
          subscriptionPlan: school ? school.subscriptionPlan : null
        }
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? `Login failed: ${error.message}` 
        : 'Server error during login'
    });
  }
};

// @desc    Refresh access token (rotates refresh token)
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    const raw = req.body?.refreshToken;
    if (!raw || typeof raw !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const tokenHash = hashRefreshToken(raw.trim());
    const doc = await RefreshToken.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!doc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    const user = await User.findById(doc.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    let school = null;
    if (user.role !== 'superadmin') {
      school = await School.findById(user.schoolId);
      if (!school) {
        return res.status(401).json({
          success: false,
          message: 'School not found for this account',
        });
      }
    }

    const newRaw = generateOpaqueRefreshToken();
    const newHash = hashRefreshToken(newRaw);
    const expiresAt = getRefreshExpiresAt();
    const newDoc = await RefreshToken.create({
      userId: user._id,
      tokenHash: newHash,
      expiresAt,
    });

    doc.revokedAt = new Date();
    doc.replacedBy = newDoc._id;
    await doc.save();

    const accessToken = generateAccessToken(user._id, user.role, user.schoolId || null);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRaw,
      },
    });
  } catch (error) {
    console.error('Refresh Error:', error);
    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === 'development'
          ? `Refresh failed: ${error.message}`
          : 'Server error during refresh',
    });
  }
};

// @desc    Revoke refresh session
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  try {
    const raw = req.body?.refreshToken;
    if (raw && typeof raw === 'string') {
      const tokenHash = hashRefreshToken(raw.trim());
      await RefreshToken.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }
    res.status(200).json({
      success: true,
      message: 'Logged out',
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const uid = req.user.id || req.user._id;
    const user = await User.findById(uid).populate(
      'schoolId',
      'name subscriptionPlan subscriptionExpiry limits featureOverrides pendingPayment paymentDueDate'
    );

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// @desc    Create parent user linked to student
// @route   POST /api/auth/create-parent
// @access  Private (admin)
exports.createParent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { studentId, name, email, password, phone } = req.body;

    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId,
      isActive: true,
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (student.parentId) {
      return res.status(400).json({
        success: false,
        message: 'This student is already linked to a parent account',
      });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');

    let parentUser;
    let successMessage = 'Parent account created successfully';

    if (existingUser) {
      const isSameSchool = String(existingUser.schoolId) === String(req.user.schoolId);
      if (existingUser.role !== 'parent' || !isSameSchool) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      if (existingUser.isActive) {
        // Siblings: link this student to an existing active parent account (no new User, password optional).
        existingUser.profile = {
          ...(existingUser.profile || {}),
          name: name || existingUser.profile?.name || '',
          phone: phone !== undefined && phone !== null ? String(phone) : existingUser.profile?.phone || '',
        };
        await existingUser.save();
        parentUser = existingUser;
        successMessage = 'Parent linked to student successfully';
      } else {
        const pwd = password != null ? String(password) : '';
        if (pwd.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters to reactivate this parent account',
          });
        }
        existingUser.isActive = true;
        existingUser.password = pwd;
        existingUser.profile = {
          ...(existingUser.profile || {}),
          name: name || existingUser.profile?.name || '',
          phone: phone || existingUser.profile?.phone || '',
        };
        await existingUser.save();
        parentUser = existingUser;
        successMessage = 'Parent account relinked successfully';
      }
    } else {
      const pwd = password != null ? String(password) : '';
      if (pwd.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }
      parentUser = await User.create({
        email: normalizedEmail,
        password: pwd,
        role: 'parent',
        schoolId: req.user.schoolId,
        profile: {
          name,
          phone: phone || '',
          address: '',
        },
      });
    }

    student.parentId = parentUser._id;
    await student.save();

    res.status(201).json({
      success: true,
      message: successMessage,
      data: {
        parent: {
          id: parentUser._id,
          email: parentUser.email,
          role: parentUser.role,
          name: parentUser.profile.name,
        },
        studentId: student._id,
      },
    });
  } catch (error) {
    console.error('Create Parent Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating parent account',
    });
  }
};

// @desc    Check if email already exists
// @route   GET /api/auth/check-email?email=xxx
// @access  Private (admin)
exports.checkEmailAvailability = async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const existingUser = await User.findOne({ email }).select('_id email role schoolId isActive').lean();
    const sameSchool =
      !!existingUser && String(existingUser.schoolId) === String(req.user.schoolId);
    const canRelink =
      !!existingUser && existingUser.role === 'parent' && sameSchool && !existingUser.isActive;
    const canLinkExistingActiveParent =
      !!existingUser && existingUser.role === 'parent' && sameSchool && !!existingUser.isActive;
    res.status(200).json({
      success: true,
      data: {
        available: !existingUser || canRelink || canLinkExistingActiveParent,
        canRelink,
        canLinkExistingActiveParent,
        existingUser: existingUser
          ? {
              id: existingUser._id,
              email: existingUser.email,
              role: existingUser.role,
              isActive: existingUser.isActive,
              sameSchool,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Check Email Availability Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email availability',
    });
  }
};

// @desc    Reset linked parent password for student
// @route   PUT /api/auth/parents/:studentId/password
// @access  Private (admin)
exports.resetParentPassword = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId,
      isActive: true,
    });
    if (!student || !student.parentId) {
      return res.status(404).json({
        success: false,
        message: 'No linked parent found for this student',
      });
    }

    const parentUser = await User.findOne({
      _id: student.parentId,
      schoolId: req.user.schoolId,
      role: 'parent',
      isActive: true,
    });
    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: 'Linked parent account not found',
      });
    }

    parentUser.password = String(newPassword);
    await parentUser.save();

    res.status(200).json({
      success: true,
      message: 'Parent password reset successfully',
    });
  } catch (error) {
    console.error('Reset Parent Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting parent password',
    });
  }
};

// @desc    Unlink parent account from student
// @route   DELETE /api/auth/parents/:studentId
// @access  Private (admin)
exports.unlinkParentAccount = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId,
      isActive: true,
    });
    if (!student || !student.parentId) {
      return res.status(404).json({
        success: false,
        message: 'No linked parent found for this student',
      });
    }

    const parentUserId = student.parentId;
    student.parentId = null;
    await student.save();

    const remaining = await Student.countDocuments({
      schoolId: req.user.schoolId,
      parentId: parentUserId,
      isActive: true,
    });

    if (remaining === 0) {
      await User.findOneAndUpdate(
        { _id: parentUserId, schoolId: req.user.schoolId, role: 'parent' },
        { isActive: false }
      );
      res.status(200).json({
        success: true,
        message: 'Parent account unlinked successfully (account deactivated)',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Student unlinked from parent; parent account remains active for other children',
    });
  } catch (error) {
    console.error('Unlink Parent Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlinking parent account',
    });
  }
};
