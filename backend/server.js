const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./src/lib/dbConnect");

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Await DB before any route (fixes Mongoose "buffering timed out" on Vercel cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/students", require("./src/routes/student"));
app.use("/api/teachers", require("./src/routes/teacher"));
app.use("/api/attendance", require("./src/routes/attendance"));
app.use("/api/subscription", require("./src/routes/subscription"));
app.use("/api/academic", require("./src/routes/academic"));
app.use("/api/exams", require("./src/routes/exam"));
app.use("/api/fees", require("./src/routes/fee"));
app.use("/api/communication", require("./src/routes/communication"));
app.use("/api/timetable", require("./src/routes/timetable"));
app.use("/api/reports", require("./src/routes/reports"));
app.use("/api/parent", require("./src/routes/parent"));
app.use("/api/leaves", require("./src/routes/leave"));
app.use("/api/events", require("./src/routes/events"));
app.use("/api/payroll", require("./src/routes/payroll"));
app.use("/api/diary", require("./src/routes/diary"));
app.use("/api/superadmin", require("./src/routes/superAdmin"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
