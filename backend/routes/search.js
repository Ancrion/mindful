const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const userId = req.user.id;

    if (!q) {
      const recentTodos = db.prepare("SELECT id, titel, status, 'todo' AS typ FROM todos WHERE user_id = ? ORDER BY id DESC LIMIT 3").all(userId);
      const recentNotes = db.prepare("SELECT id, titel, 'notiz' AS typ FROM notizen WHERE user_id = ? ORDER BY id DESC LIMIT 3").all(userId);
      const recentEvents = db.prepare("SELECT id, titel, start_datum, 'event' AS typ FROM events WHERE user_id = ? ORDER BY id DESC LIMIT 3").all(userId);
      return res.json({ todos: recentTodos, notizen: recentNotes, events: recentEvents, suggestions: true });
    }

    const like = `%${q}%`;

    const todos = db
      .prepare("SELECT id, titel, status, 'todo' AS typ FROM todos WHERE user_id = ? AND (titel LIKE ? OR beschreibung LIKE ?) LIMIT 10")
      .all(userId, like, like);

    const notizen = db
      .prepare("SELECT id, titel, 'notiz' AS typ FROM notizen WHERE user_id = ? AND (titel LIKE ? OR inhalt LIKE ?) LIMIT 10")
      .all(userId, like, like);

    const events = db
      .prepare("SELECT id, titel, start_datum, 'event' AS typ FROM events WHERE user_id = ? AND (titel LIKE ? OR beschreibung LIKE ?) LIMIT 10")
      .all(userId, like, like);

    res.json({ todos, notizen, events, suggestions: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
