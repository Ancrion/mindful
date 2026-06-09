const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

router.post("/", auth, (req, res) => {
  try {
    const { todo_id, duration_seconds } = req.body;
    if (!duration_seconds) {
      return res.status(400).json({ error: "duration_seconds fehlt" });
    }
    const result = db
      .prepare(
        "INSERT INTO pomodoro_sessions (user_id, todo_id, duration_seconds) VALUES (?, ?, ?)",
      )
      .run(req.user.id, todo_id || null, duration_seconds);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", auth, (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const since = sevenDaysAgo.toISOString().split("T")[0];

    const todaySessions = db
      .prepare(
        "SELECT COUNT(*) AS count, COALESCE(SUM(duration_seconds), 0) AS total_seconds FROM pomodoro_sessions WHERE user_id = ? AND date(completed_at) = ?",
      )
      .get(userId, today);

    const weekSessions = db
      .prepare(
        "SELECT date(completed_at) AS day, COUNT(*) AS count, COALESCE(SUM(duration_seconds), 0) AS total_seconds FROM pomodoro_sessions WHERE user_id = ? AND date(completed_at) >= ? GROUP BY date(completed_at) ORDER BY day",
      )
      .all(userId, since);

    const totalTodos = db
      .prepare("SELECT COUNT(*) AS count FROM todos WHERE user_id = ?")
      .get(userId);
    const doneTodos = db
      .prepare("SELECT COUNT(*) AS count FROM todos WHERE user_id = ? AND status = 'erledigt'")
      .get(userId);

    const successRate = totalTodos.count > 0
      ? Math.round((doneTodos.count / totalTodos.count) * 100)
      : 0;

    const totalFocusSeconds = db
      .prepare("SELECT COALESCE(SUM(duration_seconds), 0) AS total FROM pomodoro_sessions WHERE user_id = ?")
      .get(userId);

    res.json({
      today: {
        sessions: todaySessions.count,
        seconds: todaySessions.total_seconds,
      },
      week: weekSessions,
      totalFocusSeconds: totalFocusSeconds.total,
      successRate,
      totalTodos: totalTodos.count,
      doneTodos: doneTodos.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
