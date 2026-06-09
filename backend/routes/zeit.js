const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

router.post("/start", auth, (req, res) => {
  try {
    const { todo_id, description } = req.body;
    const active = db.prepare("SELECT id FROM time_entries WHERE user_id = ? AND end_time IS NULL").get(req.user.id);
    if (active) {
      return res.status(400).json({ error: "Es läuft bereits eine Zeiterfassung" });
    }
    const now = new Date().toISOString();
    const result = db.prepare(
      "INSERT INTO time_entries (user_id, todo_id, start_time, description) VALUES (?, ?, ?, ?)"
    ).run(req.user.id, todo_id || null, now, description || null);
    const entry = db.prepare("SELECT * FROM time_entries WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/stop", auth, (req, res) => {
  try {
    const active = db.prepare("SELECT * FROM time_entries WHERE user_id = ? AND end_time IS NULL").get(req.user.id);
    if (!active) {
      return res.status(400).json({ error: "Keine aktive Zeiterfassung" });
    }
    const now = new Date();
    const start = new Date(active.start_time);
    const duration = Math.round((now - start) / 1000);
    db.prepare(
      "UPDATE time_entries SET end_time = ?, duration_seconds = ? WHERE id = ? AND user_id = ?"
    ).run(now.toISOString(), duration, active.id, req.user.id);
    const entry = db.prepare("SELECT * FROM time_entries WHERE id = ?").get(active.id);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/active", auth, (req, res) => {
  try {
    const active = db.prepare(
      "SELECT te.*, t.titel AS todo_titel FROM time_entries te LEFT JOIN todos t ON te.todo_id = t.id WHERE te.user_id = ? AND te.end_time IS NULL"
    ).get(req.user.id);
    if (active) {
      const start = new Date(active.start_time);
      const now = new Date();
      active.elapsed_seconds = Math.round((now - start) / 1000);
    }
    res.json(active || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/today", auth, (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const entries = db.prepare(
      "SELECT te.*, t.titel AS todo_titel FROM time_entries te LEFT JOIN todos t ON te.todo_id = t.id WHERE te.user_id = ? AND date(te.start_time) = ? ORDER BY te.start_time DESC"
    ).all(req.user.id, today);
    const total = entries.reduce((sum, e) => sum + (e.duration_seconds || 0), 0);
    res.json({ entries, total_seconds: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/range", auth, (req, res) => {
  try {
    const from = req.query.from || new Date().toISOString().split("T")[0];
    const to = req.query.to || from;
    const entries = db.prepare(
      "SELECT te.*, t.titel AS todo_titel FROM time_entries te LEFT JOIN todos t ON te.todo_id = t.id WHERE te.user_id = ? AND date(te.start_time) >= ? AND date(te.start_time) <= ? ORDER BY te.start_time DESC"
    ).all(req.user.id, from, to);
    const total = entries.reduce((sum, e) => sum + (e.duration_seconds || 0), 0);
    res.json({ entries, total_seconds: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, (req, res) => {
  try {
    db.prepare("DELETE FROM time_entries WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ message: "Eintrag gelöscht" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, (req, res) => {
  try {
    const { description, duration_seconds, todo_id } = req.body;
    const entry = db.prepare("SELECT * FROM time_entries WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!entry) return res.status(404).json({ error: "Eintrag nicht gefunden" });
    db.prepare(
      "UPDATE time_entries SET description = COALESCE(?, description), duration_seconds = COALESCE(?, duration_seconds), todo_id = COALESCE(?, todo_id) WHERE id = ? AND user_id = ?"
    ).run(description || null, duration_seconds || null, todo_id || null, req.params.id, req.user.id);
    const updated = db.prepare("SELECT * FROM time_entries WHERE id = ?").get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
