const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

router.get("/:id/profile", auth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ error: "Ungültige ID" });

    const user = db
      .prepare("SELECT id, name, avatar, created_at FROM users WHERE id = ?")
      .get(userId);
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    const todosDone = db
      .prepare(
        `SELECT COUNT(*) AS value FROM todos WHERE user_id = ? AND status = 'erledigt'`,
      )
      .get(userId).value;

    const totalTodos = db
      .prepare(`SELECT COUNT(*) AS value FROM todos WHERE user_id = ?`)
      .get(userId).value;

    const pomodoroTotal = db
      .prepare(
        `SELECT COALESCE(SUM(duration_seconds), 0) AS value FROM pomodoro_sessions WHERE user_id = ?`,
      )
      .get(userId).value;

    const trackedTotal = db
      .prepare(
        `SELECT COALESCE(SUM(duration_seconds), 0) AS value FROM time_entries WHERE user_id = ?`,
      )
      .get(userId).value;

    res.json({ user, stats: { todosDone, totalTodos, pomodoroTotal, trackedTotal } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
