
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { authRouter, setupRouter } = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const commentRoutes = require("./routes/commentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const ganttRoutes = require("./routes/ganttRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

const validateEnvironment = () => {
  if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
    console.error("JWT_SECRET is required before starting the server.");
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/setup", setupRouter);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks", commentRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/gantt", ganttRoutes);

// Health-check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow backend is running!",
  });
});

// Start server after connecting to MongoDB
const startServer = async () => {
  validateEnvironment();
  await connectDB();

  app.listen(PORT, () => {
    console.log(`TaskFlow server running at http://localhost:${PORT}`);
  });
};

startServer();
