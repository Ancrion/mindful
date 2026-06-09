const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => {
  try {
    const events = db
      .prepare(`SELECT e.*, w.name AS workspace_name, w.farbe AS workspace_farbe
        FROM events e
        LEFT JOIN workspaces w ON e.workspace_id = w.id
        WHERE e.user_id = ?
        ORDER BY e.start_datum ASC`)
      .all(req.user.id);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, (req, res) => {
  try {
    const { titel, beschreibung, start_datum, end_datum, farbe, ort, dauer, wiederholung, ganztag, erinnerung, workspace_id } = req.body;

    const result = db
      .prepare("INSERT INTO events (user_id, titel, beschreibung, start_datum, end_datum, farbe, ort, dauer, wiederholung, ganztag, erinnerung, workspace_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(
        req.user.id,
        titel,
        beschreibung || null,
        start_datum,
        end_datum || null,
        farbe || "#3B82F6",
        ort || null,
        dauer || 60,
        wiederholung || "none",
        ganztag ? 1 : 0,
        erinnerung || "keine",
        workspace_id || null,
      );

    res.status(201).json({ message: "Event erstellt", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, (req, res) => {
  try {
    const { titel, beschreibung, start_datum, end_datum, farbe, ort, dauer, wiederholung, ganztag, erinnerung, workspace_id } = req.body;

    db.prepare(
      "UPDATE events SET titel=?, beschreibung=?, start_datum=?, end_datum=?, farbe=?, ort=?, dauer=?, wiederholung=?, ganztag=?, erinnerung=?, workspace_id=? WHERE id=? AND user_id=?",
    ).run(
      titel,
      beschreibung || null,
      start_datum,
      end_datum || null,
      farbe,
      ort || null,
      dauer || 60,
      wiederholung || "none",
      ganztag ? 1 : 0,
      erinnerung || "keine",
      workspace_id || null,
      req.params.id,
      req.user.id,
    );

    res.json({ message: "Event geupdated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, (req, res) => {
  try {
    db.prepare("DELETE FROM events WHERE id = ? AND user_id = ?").run(
      req.params.id,
      req.user.id,
    );
    res.json({ message: "Event gelöscht" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
