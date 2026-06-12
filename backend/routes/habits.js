const express = require("express");
const router = express.Router();
const db = require("../database/db");

// GET /api/habits — Alle Habits des Users
router.get("/", (req, res) => {
  try {
    const habits = db.prepare("SELECT * FROM habits WHERE user_id = ? ORDER BY time_start, id").all(req.user.id);
    res.json(habits);
  } catch (err) {
    console.error("Habits Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// GET /api/habits/today — Heutige Habits mit Completion-Status
router.get("/today", (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay();
    const habits = db.prepare("SELECT * FROM habits WHERE user_id = ? AND active = 1 ORDER BY time_start, id").all(req.user.id);
    const logs = db.prepare("SELECT * FROM habit_logs WHERE datum = ? AND habit_id IN (SELECT id FROM habits WHERE user_id = ?)").all(today, req.user.id);
    const loggedIds = new Set(logs.map(l => l.habit_id));

    const result = habits.filter(h => {
      if (h.typ === "daily") return true;
      if (h.typ === "interval") {
        const created = new Date(h.created_at);
        const diffDays = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
        return diffDays % (h.interval_days || 1) === 0;
      }
      if (h.typ === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
      if (h.typ === "weekends") return dayOfWeek === 0 || dayOfWeek === 6;
      if (h.typ === "weekly") {
        const created = new Date(h.created_at);
        const diffDays = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
        return diffDays % 7 === 0;
      }
      return true;
    }).map(h => ({
      ...h,
      completed: loggedIds.has(h.id) ? 1 : 0,
    }));

    res.json(result);
  } catch (err) {
    console.error("Habits today Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// POST /api/habits — Neues Habit erstellen
router.post("/", (req, res) => {
  try {
    const { name, icon, color, typ, interval_days, time_start, time_end } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Name erforderlich" });

    const result = db.prepare(
      "INSERT INTO habits (user_id, name, icon, color, typ, interval_days, time_start, time_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, name.trim(), icon || "fa-check-circle", color || "#6366f1", typ || "daily", interval_days || 1, time_start || null, time_end || null);

    const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(result.lastInsertRowid);
    res.json(habit);
  } catch (err) {
    console.error("Habit anlegen Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// PUT /api/habits/:id — Habit aktualisieren
router.put("/:id", (req, res) => {
  try {
    const { name, icon, color, typ, interval_days, time_start, time_end, active } = req.body;
    const existing = db.prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: "Nicht gefunden" });

    db.prepare(
      "UPDATE habits SET name = ?, icon = ?, color = ?, typ = ?, interval_days = ?, time_start = ?, time_end = ?, active = ? WHERE id = ? AND user_id = ?"
    ).run(
      name ?? existing.name,
      icon ?? existing.icon,
      color ?? existing.color,
      typ ?? existing.typ,
      interval_days ?? existing.interval_days,
      time_start !== undefined ? time_start : existing.time_start,
      time_end !== undefined ? time_end : existing.time_end,
      active !== undefined ? (active ? 1 : 0) : existing.active,
      req.params.id, req.user.id
    );

    const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(req.params.id);
    res.json(habit);
  } catch (err) {
    console.error("Habit update Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// DELETE /api/habits/:id — Habit löschen
router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM habits WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: "Nicht gefunden" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Habit delete Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// POST /api/habits/:id/toggle — Heutiges Completion togglen
router.post("/:id/toggle", (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const existing = db.prepare("SELECT * FROM habit_logs WHERE habit_id = ? AND datum = ?").get(req.params.id, today);
    if (existing) {
      db.prepare("DELETE FROM habit_logs WHERE id = ?").run(existing.id);
      res.json({ completed: false });
    } else {
      db.prepare("INSERT INTO habit_logs (habit_id, datum) VALUES (?, ?)").run(req.params.id, today);
      res.json({ completed: true });
    }
  } catch (err) {
    console.error("Habit toggle Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

module.exports = router;
