const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

// ─── VIEW ROUTEN (EJS Seiten) ───
router.get("/", auth, (req, res) => {
  res.render("index", { currentPage: "dashboard" });
});
router.get("/login", (req, res) => res.render("login", { currentPage: null }));
router.get("/register", (req, res) => res.render("login", { currentPage: null }));
router.get("/passwort-vergessen", (req, res) => res.render("forgot_password", { currentPage: null }));
router.get("/reset-password/:token", (req, res) => res.render("reset_password", { currentPage: null, token: req.params.token }));
router.get("/dashboard", auth, (req, res) => res.redirect("/"));
router.get("/todo", auth, (req, res) => res.render("todo", { currentPage: "todo" }));
router.get("/calendar", auth, (req, res) => res.render("calendar", { currentPage: "calendar" }));
router.get("/kalender", auth, (req, res) => res.render("calendar", { currentPage: "calendar" }));
router.get("/notes", auth, (req, res) => res.render("notes", { currentPage: "notes" }));
router.get("/notizen", auth, (req, res) => res.render("notes", { currentPage: "notes" }));
router.get("/pomodoro", auth, (req, res) => res.render("pomodoro", { currentPage: "pomodoro" }));
router.get("/tracking", auth, (req, res) => res.render("tracking", { currentPage: "tracking" }));
router.get("/habits", auth, (req, res) => res.render("habits", { currentPage: "habits" }));
router.get("/zeiterfassung", auth, (req, res) => res.render("tracking", { currentPage: "tracking" }));
router.get("/documents", auth, (req, res) => res.render("documents", { currentPage: "documents" }));
router.get("/dokumente", auth, (req, res) => res.render("documents", { currentPage: "documents" }));
router.get("/leaderboard", auth, (req, res) => res.render("leaderboard", { currentPage: "leaderboard" }));
router.get("/rangliste", auth, (req, res) => res.render("leaderboard", { currentPage: "leaderboard" }));
router.get("/user/:id", auth, (req, res) => res.render("user_profile", { currentPage: "leaderboard", userId: req.params.id }));
router.get("/messages", auth, (req, res) => res.render("messages", { currentPage: "messages" }));
router.get("/nachrichten", auth, (req, res) => res.render("messages", { currentPage: "messages" }));
router.get("/profile", auth, (req, res) => res.render("profile", { currentPage: "profile" }));
router.get("/profil", auth, (req, res) => res.render("profile", { currentPage: "profile" }));
router.get("/entwicklungsplan", auth, adminOnly, (req, res) => {
  const fileContents = {};
  const root = path.join(__dirname, "..", "..");
  const fileMap = {
    // Database Schema (Phase 1 - ilhan)
    "ilhan-db": "backend/database/db.js",

    // Backend Routes (Phase 2-6 - jaro)
    "jaro-auth": "backend/routes/auth-routes.js",
    "jaro-workspace": "backend/routes/workspace.js",
    "jaro-todos": "backend/routes/todos.js",
    "jaro-kalender": "backend/routes/kalender.js",
    "jaro-notizen": "backend/routes/notizen.js",
    "jaro-ordner": "backend/routes/ordner.js",
    "jaro-dashboard": "backend/routes/dashboard_widgets.js",
    "jaro-habits": "backend/routes/habits.js",
    "jaro-pomodoro": "backend/routes/pomodoro.js",
    "jaro-zeit": "backend/routes/zeit.js",
    "jaro-leaderboard": "backend/routes/leaderboard.js",
    "jaro-messages": "backend/routes/messages.js",
    "jaro-search": "backend/routes/search.js",
    "jaro-bugs": "backend/routes/bugs.js",
  };

  for (const [id, filePath] of Object.entries(fileMap)) {
    try {
      fileContents[id] = fs.readFileSync(path.join(root, filePath), "utf-8");
    } catch (e) {
      fileContents[id] = null;
    }
  }
  res.render("entwicklungsplan", { currentPage: "entwicklungsplan", fileContents });
});
router.get("/bugs", auth, (req, res) => res.render("bugs", { currentPage: "bugs" }));
router.get("/bug-report", auth, (req, res) => res.render("bugs", { currentPage: "bugs" }));
router.get("/changelog", (req, res) => {
  try {
    const { parseEntries } = require("../lib/changelog-parser");
    const clEntries = parseEntries();
    res.render("changelog", { currentPage: "changelog", clEntries });
  } catch {
    res.render("changelog", { currentPage: "changelog", clEntries: [] });
  }
});
router.get("/admin", auth, adminOnly, (req, res) => res.render("admin", { currentPage: "admin" }));
router.get("/dev-tasks-admin", auth, adminOnly, (req, res) => res.render("dev-tasks-admin", { currentPage: "admin" }));

// ─── HEALTH CHECK ───
router.get("/health", (req, res) => {
  res.json({ status: "✅ Server läuft", timestamp: new Date().toISOString() });
});

module.exports = router;
