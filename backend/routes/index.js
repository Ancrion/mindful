const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// ─── VIEW ROUTEN (EJS Seiten) ───
router.get("/", auth, (req, res) => {
  res.render("index", { currentPage: "dashboard" });
});
router.get("/login", (req, res) => res.render("login", { currentPage: null }));
router.get("/register", (req, res) => res.render("login", { currentPage: null }));
router.get("/dashboard", auth, (req, res) => res.redirect("/"));
router.get("/todo", auth, (req, res) => res.render("todo", { currentPage: "todo" }));
router.get("/calendar", auth, (req, res) => res.render("calendar", { currentPage: "calendar" }));
router.get("/kalender", auth, (req, res) => res.render("calendar", { currentPage: "calendar" }));
router.get("/notes", auth, (req, res) => res.render("notes", { currentPage: "notes" }));
router.get("/notizen", auth, (req, res) => res.render("notes", { currentPage: "notes" }));
router.get("/pomodoro", auth, (req, res) => res.render("pomodoro", { currentPage: "pomodoro" }));
router.get("/tracking", auth, (req, res) => res.render("tracking", { currentPage: "tracking" }));
router.get("/zeiterfassung", auth, (req, res) => res.render("tracking", { currentPage: "tracking" }));
router.get("/profile", auth, (req, res) => res.render("profile", { currentPage: "profile" }));
router.get("/profil", auth, (req, res) => res.render("profile", { currentPage: "profile" }));

// ─── HEALTH CHECK ───
router.get("/health", (req, res) => {
  res.json({ status: "✅ Server läuft", timestamp: new Date().toISOString() });
});

module.exports = router;
