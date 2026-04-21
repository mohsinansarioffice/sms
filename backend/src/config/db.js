const mongoose = require("mongoose");

async function connectDB(mongoUri) {
  // Prevent deprecation warnings and keep query behavior consistent.
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

module.exports = { connectDB };
