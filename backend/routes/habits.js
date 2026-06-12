const express = require("express");
const router = express.Router();
const db = require("../database/db");

// ─── HELPER FUNCTIONS ───
function calculateStreaks(habitId) {
  const logs = db.prepare("SELECT datum FROM habit_logs WHERE habit_id = ? ORDER BY datum DESC").all(habitId);
  if (!logs.length) return { current: 0, longest: 0 };

  let current = 0, longest = 0, temp = 0;
  let lastDate = null;

  for (const log of logs) {
    const logDate = new Date(log.datum);
    if (!lastDate) {
      lastDate = logDate;
      temp = 1;
    } else {
      const diff = Math.floor((lastDate - logDate) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        temp++;
      } else if (diff > 1) {
        longest = Math.max(longest, temp);
        temp = 1;
      }
      lastDate = logDate;
    }
  }
  longest = Math.max(longest, temp);
  
  // Current streak (nur wenn letzter log heute oder gestern)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (logs.length > 0) {
    const lastLog = new Date(logs[0].datum);
    lastLog.setHours(0, 0, 0, 0);
    if (lastLog.getTime() === today.getTime() || lastLog.getTime() === yesterday.getTime()) {
      current = temp;
    }
  }

  return { current, longest };
}

function shouldHabitBeDueToday(habit, dayOfWeek) {
  if (habit.typ === "daily") return true;
  if (habit.typ === "interval") {
    const created = new Date(habit.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return diffDays % (habit.interval_days || 1) === 0;
  }
  if (habit.typ === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (habit.typ === "weekends") return dayOfWeek === 0 || dayOfWeek === 6;
  if (habit.typ === "weekly") {
    const created = new Date(habit.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return diffDays % 7 === 0;
  }
  return false;
}

// GET /api/habits — Alle Habits des Users
router.get("/", (req, res) => {
  try {
    const habits = db.prepare("SELECT * FROM habits WHERE user_id = ? AND archived = 0 ORDER BY time_start, id").all(req.user.id);
    res.json(habits);
  } catch (err) {
    console.error("Habits Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// GET /api/habits/stats — Statistiken für alle Habits
router.get("/stats", (req, res) => {
  try {
    const habits = db.prepare("SELECT id, name, current_streak, longest_streak, total_completions FROM habits WHERE user_id = ? AND archived = 0").all(req.user.id);
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.substring(0, 7); // YYYY-MM
    
    const stats = habits.map(h => {
      const monthCount = db.prepare(
        "SELECT COUNT(*) as c FROM habit_logs WHERE habit_id = ? AND datum LIKE ?"
      ).get(h.id, thisMonth + "%");
      
      return {
        ...h,
        completions_this_month: monthCount.c,
      };
    });

    res.json(stats);
  } catch (err) {
    console.error("Habits stats Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// GET /api/habits/calendar/:id — Kalender-Daten für ein Habit (letzter Monat)
router.get("/calendar/:id", (req, res) => {
  try {
    const habit = db.prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!habit) return res.status(404).json({ error: "Habit nicht gefunden" });

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Erste und letzte des Monats
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstStr = firstDay.toISOString().split("T")[0];
    const lastStr = lastDay.toISOString().split("T")[0];

    const logs = db.prepare(
      "SELECT datum FROM habit_logs WHERE habit_id = ? AND datum BETWEEN ? AND ?"
    ).all(req.params.id, firstStr, lastStr);

    const data = {};
    logs.forEach(log => {
      data[log.datum] = true;
    });

    res.json({
      habit_id: habit.id,
      year,
      month,
      data,
    });
  } catch (err) {
    console.error("Calendar Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// GET /api/habits/today — Heutige Habits mit Completion-Status
router.get("/today", (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay();
    const habits = db.prepare("SELECT * FROM habits WHERE user_id = ? AND active = 1 AND archived = 0 ORDER BY priority DESC, time_start, id").all(req.user.id);
    const logs = db.prepare("SELECT * FROM habit_logs WHERE datum = ? AND habit_id IN (SELECT id FROM habits WHERE user_id = ?)").all(today, req.user.id);
    const loggedIds = new Set(logs.map(l => l.habit_id));

    const result = habits.filter(h => shouldHabitBeDueToday(h, dayOfWeek)).map(h => {
      const streaks = calculateStreaks(h.id);
      return {
        ...h,
        completed: loggedIds.has(h.id) ? 1 : 0,
        current_streak: streaks.current,
        longest_streak: streaks.longest,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Habits today Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// POST /api/habits — Neues Habit erstellen
router.post("/", (req, res) => {
  try {
    const { name, description, icon, color, category, priority, typ, interval_days, time_start, time_end, reminder_time } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Name erforderlich" });

    const result = db.prepare(
      "INSERT INTO habits (user_id, name, description, icon, color, category, priority, typ, interval_days, time_start, time_end, reminder_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      req.user.id,
      name.trim(),
      description || null,
      icon || "fa-check-circle",
      color || "#6366f1",
      category || null,
      priority || "medium",
      typ || "daily",
      interval_days || 1,
      time_start || null,
      time_end || null,
      reminder_time || null
    );

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
    const { name, description, icon, color, category, priority, typ, interval_days, time_start, time_end, reminder_time, active, archived } = req.body;
    const existing = db.prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: "Nicht gefunden" });

    db.prepare(
      "UPDATE habits SET name = ?, description = ?, icon = ?, color = ?, category = ?, priority = ?, typ = ?, interval_days = ?, time_start = ?, time_end = ?, reminder_time = ?, active = ?, archived = ? WHERE id = ? AND user_id = ?"
    ).run(
      name ?? existing.name,
      description !== undefined ? description : existing.description,
      icon ?? existing.icon,
      color ?? existing.color,
      category !== undefined ? category : existing.category,
      priority ?? existing.priority,
      typ ?? existing.typ,
      interval_days ?? existing.interval_days,
      time_start !== undefined ? time_start : existing.time_start,
      time_end !== undefined ? time_end : existing.time_end,
      reminder_time !== undefined ? reminder_time : existing.reminder_time,
      active !== undefined ? (active ? 1 : 0) : existing.active,
      archived !== undefined ? (archived ? 1 : 0) : existing.archived,
      req.params.id,
      req.user.id
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

// POST /api/habits/:id/toggle — Heutiges Completion togglen mit Notizen
router.post("/:id/toggle", (req, res) => {
  try {
    const { notes } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const existing = db.prepare("SELECT * FROM habit_logs WHERE habit_id = ? AND datum = ?").get(req.params.id, today);
    
    if (existing) {
      db.prepare("DELETE FROM habit_logs WHERE id = ?").run(existing.id);
      res.json({ completed: false });
    } else {
      db.prepare("INSERT INTO habit_logs (habit_id, datum, notes) VALUES (?, ?, ?)").run(req.params.id, today, notes || null);
      
      // Update stats
      const total = db.prepare("SELECT COUNT(*) as c FROM habit_logs WHERE habit_id = ?").get(req.params.id);
      const streaks = calculateStreaks(req.params.id);
      db.prepare("UPDATE habits SET total_completions = ?, current_streak = ?, longest_streak = ? WHERE id = ?").run(
        total.c,
        streaks.current,
        streaks.longest,
        req.params.id
      );

      res.json({ completed: true });
    }
  } catch (err) {
    console.error("Habit toggle Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// GET /api/habits/:id/history — History für ein Habit
router.get("/:id/history", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const logs = db.prepare(
      "SELECT datum, notes FROM habit_logs WHERE habit_id = ? AND habit_id IN (SELECT id FROM habits WHERE user_id = ?) ORDER BY datum DESC LIMIT ?"
    ).all(req.params.id, req.user.id, limit);
    res.json(logs);
  } catch (err) {
    console.error("History Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

module.exports = router;
