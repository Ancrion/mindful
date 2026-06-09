const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

router.post("/", auth, (req, res) => {
  try {
    const { to_user_id, subject, body } = req.body;
    if (!to_user_id || !subject) {
      return res.status(400).json({ error: "Empfänger und Betreff erforderlich" });
    }
    const recipient = db.prepare("SELECT id FROM users WHERE id = ?").get(to_user_id);
    if (!recipient) return res.status(404).json({ error: "Empfänger nicht gefunden" });
    if (to_user_id === req.user.id) {
      return res.status(400).json({ error: "Du kannst keine Nachricht an dich selbst senden" });
    }
    db.prepare(
      "INSERT INTO messages (from_user_id, to_user_id, subject, body) VALUES (?, ?, ?, ?)",
    ).run(req.user.id, to_user_id, subject, body || "");

    res.status(201).json({ message: "Nachricht gesendet" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/inbox", auth, (req, res) => {
  try {
    const msgs = db
      .prepare(
        `SELECT m.id, m.subject, m.body, m.read, m.created_at,
                u.id AS from_id, u.name AS from_name
         FROM messages m
         JOIN users u ON m.from_user_id = u.id
         WHERE m.to_user_id = ?
         ORDER BY m.created_at DESC`,
      )
      .all(req.user.id);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/sent", auth, (req, res) => {
  try {
    const msgs = db
      .prepare(
        `SELECT m.id, m.subject, m.body, m.read, m.created_at,
                u.id AS to_id, u.name AS to_name
         FROM messages m
         JOIN users u ON m.to_user_id = u.id
         WHERE m.from_user_id = ?
         ORDER BY m.created_at DESC`,
      )
      .all(req.user.id);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/read", auth, (req, res) => {
  try {
    db.prepare(
      "UPDATE messages SET read = 1 WHERE id = ? AND to_user_id = ?",
    ).run(req.params.id, req.user.id);
    res.json({ message: "Als gelesen markiert" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/unread", auth, (req, res) => {
  try {
    const count = db
      .prepare("SELECT COUNT(*) AS c FROM messages WHERE to_user_id = ? AND read = 0")
      .get(req.user.id).c;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
