const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

function isJaro(user) {
  return user && user.name === "jaro";
}

router.get("/", auth, (req, res) => {
  const bugs = db.prepare("SELECT b.*, u.name AS user_name FROM bug_reports b JOIN users u ON b.user_id = u.id ORDER BY b.created_at DESC").all();
  res.json({ bugs, isJaro: isJaro(req.user) });
});

router.post("/", auth, (req, res) => {
  try {
    const { titel, beschreibung, seite } = req.body;
    if (!titel || !titel.trim())
      return res.status(400).json({ error: "Titel erforderlich" });

    db.prepare("INSERT INTO bug_reports (user_id, titel, beschreibung, seite) VALUES (?, ?, ?, ?)").run(req.user.id, titel.trim(), beschreibung || null, seite || null);
    res.status(201).json({ message: "Bug gemeldet" });
  } catch (err) {
    console.error("Fehler bei Bug-Meldung:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.put("/:id/status", auth, (req, res) => {
  try {
    if (!isJaro(req.user))
      return res.status(403).json({ error: "Nur jaro kann Status ändern" });

    const { status } = req.body;
    if (!["offen", "in_arbeit", "abgeschlossen"].includes(status))
      return res.status(400).json({ error: "Ungültiger Status" });

    const bug = db.prepare("SELECT * FROM bug_reports WHERE id = ?").get(req.params.id);
    if (!bug) return res.status(404).json({ error: "Bug nicht gefunden" });

    const erledigt = status === "abgeschlossen" ? 1 : 0;
    db.prepare("UPDATE bug_reports SET status = ?, erledigt = ? WHERE id = ?").run(status, erledigt, req.params.id);
    res.json({ message: "Status geändert" });
  } catch (err) {
    console.error("Fehler bei Status-Änderung:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.delete("/:id", auth, (req, res) => {
  try {
    if (!isJaro(req.user))
      return res.status(403).json({ error: "Nur jaro kann Bugs löschen" });

    const bug = db.prepare("SELECT * FROM bug_reports WHERE id = ?").get(req.params.id);
    if (!bug) return res.status(404).json({ error: "Bug nicht gefunden" });

    db.prepare("DELETE FROM bug_reports WHERE id = ?").run(req.params.id);
    res.json({ message: "Bug gelöscht" });
  } catch (err) {
    console.error("Fehler beim Löschen:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

module.exports = router;
