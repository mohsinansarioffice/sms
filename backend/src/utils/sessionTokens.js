const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function parseDurationToMs(str, fallbackMs) {
  if (!str || typeof str !== 'string') return fallbackMs;
  const m = /^(\d+)([smhd])$/i.exec(String(str).trim());
  if (!m) return fallbackMs;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return n * (mult[unit] || mult.m);
}

function hashRefreshToken(raw) {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function generateOpaqueRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateAccessToken(id, role, schoolId) {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || '15m';
  return jwt.sign(
    { id, role, schoolId, typ: 'access' },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function getRefreshExpiresAt() {
  const ms = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES, 7 * 24 * 60 * 60 * 1000);
  return new Date(Date.now() + ms);
}

module.exports = {
  hashRefreshToken,
  generateOpaqueRefreshToken,
  generateAccessToken,
  getRefreshExpiresAt,
  parseDurationToMs,
};
