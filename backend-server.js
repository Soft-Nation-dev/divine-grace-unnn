// =============================================
// Main Express Server
// =============================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// Middleware
// =============================================

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:5173", // Vite dev server
    "http://localhost:3000", // Alternative dev server
    process.env.FRONTEND_URL || "http://localhost:5173",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// =============================================
// Routes
// =============================================

// Auth routes
app.use("/api/auth", require("./backend-routes-auth"));

// Prayer requests routes
app.use("/api/prayers", require("./backend-routes-prayers"));

// LSTS forms routes
app.use("/api/lsts", require("./backend-routes-lsts"));

// Summit forms routes
app.use("/api/summit", require("./backend-routes-summit"));

// Audio messages routes
app.use("/api/messages", require("./backend-routes-messages"));

// Admin routes
app.use("/api/admin", require("./backend-routes-admin"));

// =============================================
// Health Check Endpoint
// =============================================

app.get("/health", (req, res) => {
  res.json({
    status: "✅ Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "🙏 Divine Grace UNN Backend API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      prayers: "/api/prayers",
      lsts: "/api/lsts",
      summit: "/api/summit",
      messages: "/api/messages",
      admin: "/api/admin",
      health: "/health",
    },
  });
});

// =============================================
// Error Handling
// =============================================

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
  });
});

// =============================================
// Start Server
// =============================================

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║  🙏 Divine Grace UNN Backend API           ║
  ║  Status: ✅ Running                         ║
  ║  Port: ${PORT}                             ║
  ║  Environment: ${process.env.NODE_ENV || "development"} ║
  ║  URL: http://localhost:${PORT}             ║
  ╚════════════════════════════════════════════╝
  `);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});
