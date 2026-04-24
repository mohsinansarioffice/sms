const mongoose = require("mongoose");
const { applyMongoDnsFromEnv } = require("../utils/mongoDns");

applyMongoDnsFromEnv();

/**
 * Vercel/serverless: one connection is cached on global for warm invocations.
 * Await this before any DB work to avoid "buffering timed out" (queries
 * running while mongoose is still connecting).
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }
  if (!global._mongoCache) {
    global._mongoCache = { promise: null };
  }
  const c = global._mongoCache;
  if (!c.promise) {
    c.promise = mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    });
  }
  try {
    await c.promise;
  } catch (err) {
    c.promise = null;
    throw err;
  }
}

module.exports = connectDB;
