/**
 * Create or reset a platform super admin user.
 *
 * Create:  node scripts/createSuperAdmin.js <email> <password> [name...]
 * Reset:   node scripts/createSuperAdmin.js <email> <password> [name...] --reset
 * Env:     SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_NAME (optional)
 *
 * Use --reset when the user already exists as superadmin but login says invalid
 * credentials (e.g. password was set with a different string due to shell quoting).
 */
require('dotenv').config();
const { applyMongoDnsFromEnv } = require('../src/utils/mongoDns');
applyMongoDnsFromEnv();
const mongoose = require('mongoose');

// Load models after env
const User = require('../src/models/User');

function parseArgs() {
  const raw = process.argv.slice(2);
  const resetPassword = raw.includes('--reset');
  const args = raw.filter((a) => a !== '--reset');
  const emailArg = args[0] || process.env.SUPERADMIN_EMAIL;
  const passwordArg = args[1] || process.env.SUPERADMIN_PASSWORD;
  const nameArg =
    (args.length > 2 ? args.slice(2).join(' ').trim() : null) ||
    process.env.SUPERADMIN_NAME ||
    'Super Admin';
  return { emailArg, passwordArg, nameArg, resetPassword };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  const { emailArg, passwordArg, nameArg, resetPassword } = parseArgs();

  if (!emailArg || !passwordArg) {
    console.error('Usage: node scripts/createSuperAdmin.js <email> <password> [name...] [--reset]');
    console.error('Or set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env');
    console.error('Add --reset to update password when super admin already exists.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const email = String(emailArg).toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== 'superadmin') {
      console.error(
        `User already exists with role "${existing.role}". Use a different email for super admin.`
      );
      process.exit(1);
    }
    if (!resetPassword) {
      console.error(`Super admin already exists: ${email}`);
      console.error(
        'If login fails with "invalid credentials", reset the password with the same command plus --reset'
      );
      process.exit(1);
    }
    existing.password = String(passwordArg);
    if (nameArg) {
      existing.profile = existing.profile || {};
      existing.profile.name = nameArg;
    }
    await existing.save();
    console.log(`Super admin password updated: ${email}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  await User.create({
    email,
    password: String(passwordArg),
    role: 'superadmin',
    schoolId: null,
    profile: {
      name: nameArg,
      phone: '',
      address: ''
    }
  });

  console.log(`Super admin created: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  if (err && (err.code === 'ESERVFAIL' || err.code === 'ENOTFOUND')) {
    console.error(
      '\nTip: Atlas `mongodb+srv` needs working DNS (SRV/TXT). Try MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 in .env, or use the "standard connection string" from Atlas (mongodb://… with host list).'
    );
  }
  process.exit(1);
});
