const express = require("express");
const router = express.Router();
const db = require("../database/db");

const DEFAULT_MODULES = [
  { key: "dashboard",    label: "Dashboard",      icon: "fa-th-large",       path: "/",                adminOnly: false },
  { key: "messages",     label: "Nachrichten",     icon: "fa-envelope",       path: "/messages",        adminOnly: false },
  { key: "todo",         label: "To-Do",           icon: "fa-check-circle",   path: "/todo",            adminOnly: false },
  { key: "notes",        label: "Notizen",         icon: "fa-sticky-note",    path: "/notes",           adminOnly: false },
  { key: "calendar",     label: "Kalender",        icon: "fa-calendar-alt",   path: "/calendar",        adminOnly: false },
  { key: "pomodoro",     label: "Pomodoro",        icon: "fa-clock",          path: "/pomodoro",        adminOnly: false },
  { key: "tracking",     label: "Zeiterfassung",   icon: "fa-stopwatch",      path: "/tracking",        adminOnly: false },
  { key: "leaderboard",  label: "Rangliste",       icon: "fa-trophy",         path: "/leaderboard",     adminOnly: false },
  { key: "bugs",         label: "Bugs",            icon: "fa-bug",            path: "/bugs",            adminOnly: false },
  { key: "entwicklungsplan", label: "Projektplan", icon: "fa-code-branch",    path: "/entwicklungsplan", adminOnly: true },
  { key: "admin",        label: "Admin",           icon: "fa-shield-alt",     path: "/admin",           adminOnly: true },
  { key: "changelog",    label: "Versionsverlauf", icon: "fa-clipboard-list", path: "/changelog",       adminOnly: false },
];

function ensureDefaultModules(userId) {
  const count = db.prepare("SELECT COUNT(*) as c FROM sidebar_modules WHERE user_id = ?").get(userId);
  if (count.c > 0) return;

  const insert = db.prepare(
    "INSERT OR IGNORE INTO sidebar_modules (user_id, module_key, label, icon, path, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const tx = db.transaction(() => {
    DEFAULT_MODULES.forEach((mod, i) => {
      insert.run(userId, mod.key, mod.label, mod.icon, mod.path, i, 1);
    });
  });
  tx();
}

// GET /api/sidebar/modules — Alle Module des Users (sichtbare + unsichtbare)
router.get("/modules", (req, res) => {
  try {
    ensureDefaultModules(req.user.id);
    const visible = db.prepare(
      "SELECT id, module_key, label, icon, path, sort_order FROM sidebar_modules WHERE user_id = ? AND visible = 1 ORDER BY sort_order"
    ).all(req.user.id);
    const available = db.prepare(
      "SELECT id, module_key, label, icon, path FROM sidebar_modules WHERE user_id = ? AND visible = 0 ORDER BY sort_order"
    ).all(req.user.id);
    res.json({ visible, available });
  } catch (err) {
    console.error("Fehler beim Laden der Sidebar-Module:", err);
    res.status(500).json({ error: "Fehler beim Laden der Module" });
  }
});

// PUT /api/sidebar/modules/reorder — Reihenfolge speichern
router.put("/modules/reorder", (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: "order muss ein Array sein" });

    const update = db.prepare("UPDATE sidebar_modules SET sort_order = ? WHERE id = ? AND user_id = ?");
    const tx = db.transaction(() => {
      order.forEach((id, idx) => {
        update.run(idx, id, req.user.id);
      });
    });
    tx();
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Sortieren:", err);
    res.status(500).json({ error: "Fehler beim Sortieren" });
  }
});

// PUT /api/sidebar/modules/:id/toggle — Sichtbarkeit umschalten
router.put("/modules/:id/toggle", (req, res) => {
  try {
    const mod = db.prepare("SELECT visible FROM sidebar_modules WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!mod) return res.status(404).json({ error: "Modul nicht gefunden" });
    db.prepare("UPDATE sidebar_modules SET visible = ? WHERE id = ? AND user_id = ?").run(mod.visible ? 0 : 1, req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Umschalten:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

// GET /api/sidebar/modules/all — Alle verfügbaren Module (auch die, die der User noch nicht hat)
router.get("/modules/all", (req, res) => {
  try {
    ensureDefaultModules(req.user.id);
    const all = db.prepare(
      "SELECT id, module_key, label, icon, path, visible FROM sidebar_modules WHERE user_id = ? ORDER BY sort_order"
    ).all(req.user.id);
    res.json(all);
  } catch (err) {
    console.error("Fehler:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

module.exports = router;
