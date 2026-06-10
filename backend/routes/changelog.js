const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

router.get("/", (req, res) => {
  try {
    const entries = db.prepare("SELECT * FROM changelog ORDER BY id DESC").all();
    entries.forEach(e => {
      try { e.features = JSON.parse(e.features); } catch { e.features = []; }
      try { e.fixes = JSON.parse(e.fixes); } catch { e.fixes = []; }
      try { e.commits = JSON.parse(e.commits); } catch { e.commits = []; }
    });
    res.json(entries);
  } catch (err) {
    console.error("Fehler beim Laden des Changelogs:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.post("/", auth, adminOnly, (req, res) => {
  try {
    const { version, datum, titel, features, fixes, commits } = req.body;
    if (!version || !datum || !titel)
      return res.status(400).json({ error: "Version, Datum und Titel erforderlich" });

    const result = db.prepare(
      "INSERT INTO changelog (version, datum, titel, features, fixes, commits) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      version, datum, titel,
      JSON.stringify(features || []),
      JSON.stringify(fixes || []),
      JSON.stringify(commits || [])
    );
    res.status(201).json({ message: "Changelog-Eintrag erstellt", id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Erstellen:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.put("/:id", auth, adminOnly, (req, res) => {
  try {
    const { version, datum, titel, features, fixes, commits } = req.body;
    db.prepare(
      "UPDATE changelog SET version=?, datum=?, titel=?, features=?, fixes=?, commits=? WHERE id=?"
    ).run(
      version, datum, titel,
      JSON.stringify(features || []),
      JSON.stringify(fixes || []),
      JSON.stringify(commits || []),
      req.params.id
    );
    res.json({ message: "Changelog aktualisiert" });
  } catch (err) {
    console.error("Fehler beim Aktualisieren:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.delete("/:id", auth, adminOnly, (req, res) => {
  try {
    db.prepare("DELETE FROM changelog WHERE id = ?").run(req.params.id);
    res.json({ message: "Changelog-Eintrag gelöscht" });
  } catch (err) {
    console.error("Fehler beim Löschen:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

module.exports = router;
