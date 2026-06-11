const express = require("express");
const router = express.Router();
const db = require("../database/db");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

router.get("/users", auth, adminOnly, (req, res) => {
  try {
    const users = db.prepare("SELECT id, name, is_admin, created_at, (SELECT COUNT(*) FROM todos WHERE user_id = users.id) AS todos, (SELECT COUNT(*) FROM bug_reports WHERE user_id = users.id) AS bugs FROM users ORDER BY created_at ASC").all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/users/:id/toggle-admin", auth, adminOnly, (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) return res.status(400).json({ error: "Kann sich nicht selbst entfernen" });

    const user = db.prepare("SELECT id, is_admin FROM users WHERE id = ?").get(targetId);
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    const newVal = user.is_admin ? 0 : 1;
    db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(newVal, targetId);
    res.json({ message: newVal ? "Admin-Rechte erteilt" : "Admin-Rechte entzogen", is_admin: newVal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/users/:id", auth, adminOnly, (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) return res.status(400).json({ error: "Kann sich nicht selbst löschen" });

    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(targetId);
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    db.prepare("DELETE FROM users WHERE id = ?").run(targetId);
    res.json({ message: "Benutzer gelöscht" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/users/:id/reset-password", auth, adminOnly, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(targetId);
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    const newPassword = req.body.password || "mindful2024";
    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET passwort_hash = ? WHERE id = ?").run(hash, targetId);
    res.json({ message: "Passwort zurückgesetzt", newPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
