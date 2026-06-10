const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => {
  const bugs = db.prepare("SELECT b.*, u.name AS user_name FROM bug_reports b JOIN users u ON b.user_id = u.id ORDER BY b.erledigt ASC, b.created_at DESC").all();
  res.json(bugs);
});

router.post("/", auth, (req, res) => {
  try {
    const { titel, beschreibung } = req.body;
    if (!titel || !titel.trim())
      return res.status(400).json({ error: "Titel erforderlich" });

    db.prepare("INSERT INTO bug_reports (user_id, titel, beschreibung) VALUES (?, ?, ?)").run(req.user.id, titel.trim(), beschreibung || null);
    res.status(201).json({ message: "Bug gemeldet" });
  } catch (err) {
    console.error("Fehler bei Bug-Meldung:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.put("/:id/toggle", auth, (req, res) => {
  try {
    const bug = db.prepare("SELECT * FROM bug_reports WHERE id = ?").get(req.params.id);
    if (!bug) return res.status(404).json({ error: "Bug nicht gefunden" });

    const newStatus = bug.erledigt ? 0 : 1;
    db.prepare("UPDATE bug_reports SET erledigt = ?, status = ? WHERE id = ?").run(newStatus, newStatus ? "erledigt" : "offen", req.params.id);
    res.json({ message: "Status geändert", erledigt: newStatus });
  } catch (err) {
    console.error("Fehler beim Toggle:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

module.exports = router;
