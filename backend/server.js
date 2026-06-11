require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const db = require("./database/db");

// ROUTEN-IMPORTS
const indexRoutes = require("./routes/index");
const apiRootRoutes = require("./routes/api_root"); // Korrektur: Nutze api_root hier

const app = express();

// --- MIDDLEWARE ---
// Logging (wird später entfernt)
app.use((req, res, next) => {
  console.log(`Eingehender Request: ${req.method} ${req.url}`);
  next();
});

// EJS KONFIGURATION
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

// BASIS-MIDDLEWARE
// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Headers
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Clickjacking protection
  res.setHeader("X-Frame-Options", "DENY");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; font-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';"
  );
  next();
});

// Cache verhindern (wichtig für Auth-Seiten und JS/CSS Updates)
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- ROUTING ---
// API Routen einbinden (wird auf /api gemappt)
app.use("/api", apiRootRoutes);

// Web-Seiten Routen einbinden (wird auf / gemappt)
app.use("/", indexRoutes);

// 404 Fehlerbehandlung
app.use((req, res) => {
  res.status(404).json({ error: "Ressource nicht gefunden" });
});

// Global Error Handler (mit standardisierter Error-Response)
app.use((err, req, res, next) => {
  console.error("Unerwarteter Fehler:", err.message);
  
  // Don't expose internal error details to client
  const isApiRequest = req.originalUrl.startsWith("/api");
  const statusCode = err.status || err.statusCode || 500;
  const genericMessage = statusCode === 500 ? "Interner Serverfehler" : err.message;
  
  if (isApiRequest) {
    res.status(statusCode).json({ error: genericMessage });
  } else {
    res.status(statusCode).send("Ein Fehler ist aufgetreten");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
