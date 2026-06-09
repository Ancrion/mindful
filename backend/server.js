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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
  res.status(404).send("Seite nicht gefunden");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
