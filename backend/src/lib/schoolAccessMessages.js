/**
 * User-facing text when a school is inactive (School.isActive is false).
 * Used on login, token refresh, and protect middleware.
 */
function messageForSchoolInactive(role) {
  if (role === 'admin') {
    return 'An unexpected error occurred. Please contact your platform administrator.';
  }
  return 'An unexpected error occurred. Please contact your school administrator.';
}

module.exports = { messageForSchoolInactive };
