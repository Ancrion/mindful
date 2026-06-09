const express = require("express");
const router = express.Router();
const db = require("../database/db");

function requireUser(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }
  next();
}

// GET /api/dashboard/widgets
router.get("/", requireUser, (req, res) => {
  const widgets = db
    .prepare("SELECT id, typ, position, config FROM dashboard_widgets WHERE user_id = ? ORDER BY position")
    .all(req.user.id);
  res.json(widgets);
});

// POST /api/dashboard/widgets
router.post("/", requireUser, (req, res) => {
  const { typ, config } = req.body;
  if (!typ) return res.status(400).json({ error: "typ required" });

  const maxPos = db
    .prepare("SELECT COALESCE(MAX(position), -1) as m FROM dashboard_widgets WHERE user_id = ?")
    .get(req.user.id);
  const position = maxPos.m + 1;

  const result = db
    .prepare("INSERT INTO dashboard_widgets (user_id, typ, position, config) VALUES (?, ?, ?, ?)")
    .run(req.user.id, typ, position, JSON.stringify(config || {}));

  const widget = db
    .prepare("SELECT id, typ, position, config FROM dashboard_widgets WHERE id = ?")
    .get(result.lastInsertRowid);
  res.json(widget);
});

// PUT /api/dashboard/widgets/order
router.put("/order", requireUser, (req, res) => {
  const { order } = req.body; // [{id, position}, ...]
  if (!Array.isArray(order)) return res.status(400).json({ error: "order array required" });

  const stmt = db.prepare("UPDATE dashboard_widgets SET position = ? WHERE id = ? AND user_id = ?");
  const txn = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item.position, item.id, req.user.id);
    }
  });
  txn(order);
  res.json({ ok: true });
});

// PUT /api/dashboard/widgets/:id
router.put("/:id", requireUser, (req, res) => {
  const { config } = req.body;
  db.prepare("UPDATE dashboard_widgets SET config = ? WHERE id = ? AND user_id = ?")
    .run(JSON.stringify(config || {}), req.params.id, req.user.id);
  res.json({ ok: true });
});

// DELETE /api/dashboard/widgets/:id
router.delete("/:id", requireUser, (req, res) => {
  db.prepare("DELETE FROM dashboard_widgets WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Weather endpoint (Open-Meteo, no API key needed)
router.get("/weather/data", requireUser, (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });

  const https = require("https");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`;

  https.get(url, (resp) => {
    let data = "";
    resp.on("data", (chunk) => (data += chunk));
    resp.on("end", () => {
      try {
        res.json(JSON.parse(data));
      } catch {
        res.status(500).json({ error: "Parse error" });
      }
    });
  }).on("error", () => res.status(500).json({ error: "Weather fetch failed" }));
});

module.exports = router;
