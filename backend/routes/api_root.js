const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Import aller API-Routes
const authRoutes = require("./auth-routes");
const dashboardRoutes = require("./api");
const todosRoutes = require("./todos");
const notizenRoutes = require("./notizen");
const kalenderRoutes = require("./kalender");
const dokumenteRoutes = require("./dokumente");
const ordnerRoutes = require("./ordner");
const workspaceRoutes = require("./workspace");
const pomodoroRoutes = require("./pomodoro");
const zeitRoutes = require("./zeit");
const searchRoutes = require("./search");
const dashboardWidgetRoutes = require("./dashboard_widgets");
const leaderboardRoutes = require("./leaderboard");
const usersRoutes = require("./users");
const messagesRoutes = require("./messages");
const bugsRoutes = require("./bugs");
const changelogRoutes = require("./changelog");
const adminRoutes = require("./admin");
const sidebarRoutes = require("./sidebar");

// Auth Routes (öffentlich - kein auth erforderlich)
router.use("/auth", authRoutes);

// Protected Routes (auth erforderlich)
router.use("/dashboard", auth, dashboardRoutes);
router.use("/todos", auth, todosRoutes);
router.use("/notizen", auth, notizenRoutes);
router.use("/kalender", auth, kalenderRoutes);
router.use("/dokumente", auth, dokumenteRoutes);
router.use("/ordner", auth, ordnerRoutes);
router.use("/workspaces", auth, workspaceRoutes);
router.use("/pomodoro", auth, pomodoroRoutes);
router.use("/zeit", auth, zeitRoutes);
router.use("/search", auth, searchRoutes);
router.use("/dashboard/widgets", auth, dashboardWidgetRoutes);
router.use("/leaderboard", auth, leaderboardRoutes);
router.use("/users", auth, usersRoutes);
router.use("/messages", auth, messagesRoutes);
router.use("/sidebar", auth, sidebarRoutes);
router.use("/bugs", auth, bugsRoutes);
router.use("/changelog", changelogRoutes);
router.use("/admin", auth, adminRoutes);

// Health Check
router.get("/health", (req, res) => {
  res.json({ status: "✅ API läuft", timestamp: new Date().toISOString() });
});

// Daily Quote (cached, no auth needed)
let quoteCache = { quote: "", author: "", date: "" };
router.get("/quote", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  if (quoteCache.date === today && quoteCache.quote) {
    return res.json({ quote: quoteCache.quote, author: quoteCache.author });
  }
  const https = require("https");
  https.get("https://zenquotes.io/api/random", (resp) => {
    let data = "";
    resp.on("data", (chunk) => (data += chunk));
    resp.on("end", () => {
      try {
        const arr = JSON.parse(data);
        if (Array.isArray(arr) && arr.length) {
          quoteCache = { quote: arr[0].q, author: arr[0].a, date: today };
          res.json({ quote: arr[0].q, author: arr[0].a });
        } else throw new Error();
      } catch {
        res.json({ quote: quoteCache.quote || "Lebe jeden Tag, als wäre es dein letzter.", author: quoteCache.author || "Unbekannt" });
      }
    });
  }).on("error", () => {
    res.json({ quote: quoteCache.quote || "Lebe jeden Tag, als wäre es dein letzter.", author: quoteCache.author || "Unbekannt" });
  });
});

module.exports = router;

