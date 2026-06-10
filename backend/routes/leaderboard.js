const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

function todayStr() {
  return new Date().toLocaleDateString("en-CA");
}

router.get("/", auth, (req, res) => {
  try {
    const today = todayStr();

    const todosDone = db
      .prepare(
        `SELECT u.id, u.name, COUNT(*) AS value
         FROM todos t
         JOIN users u ON t.user_id = u.id
         WHERE t.status = 'erledigt' AND date(COALESCE(t.erledigt_at, t.erstellt)) = date(?)
         GROUP BY u.id
         ORDER BY value DESC`,
      )
      .all(today);

    const pomodoro = db
      .prepare(
        `SELECT u.id, u.name, COALESCE(SUM(p.duration_seconds), 0) AS value
         FROM pomodoro_sessions p
         JOIN users u ON p.user_id = u.id
         WHERE date(p.completed_at) = date(?)
         GROUP BY u.id
         ORDER BY value DESC`,
      )
      .all(today);

    const tracked = db
      .prepare(
        `SELECT u.id, u.name, COALESCE(SUM(t.duration_seconds), 0) AS value
         FROM time_entries te
         JOIN users u ON te.user_id = u.id
         WHERE date(te.created_at) = date(?)
         GROUP BY u.id
         ORDER BY value DESC`,
      )
      .all(today);

    const totalTodos = db
      .prepare(`SELECT COUNT(*) AS c FROM todos`).get().c;
    const totalUsers = db
      .prepare(`SELECT COUNT(*) AS c FROM users`).get().c;

    res.json({ todosDone, pomodoro, tracked, totalTodos, totalUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
