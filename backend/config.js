const path = require("path");

module.exports = {
  uploadDir: path.join(__dirname, process.env.UPLOAD_DIR || "uploads"),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || 100 * 1024 * 1024), // 100 MB default
  port: parseInt(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "fallback-secret-change-in-production",
};
