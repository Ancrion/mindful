const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM workspaces WHERE user_id = ?");
    const workspaces = stmt.all(req.user.id);

    res.json(workspaces);
  } catch (err) {
    console.error("Fehler beim Laden der Workspaces:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.post("/", (req, res) => {
  try {
    const { name, farbe } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name ist erforderlich" });
    }

    const result = db
      .prepare("INSERT INTO workspaces (user_id, name, farbe) VALUES (?, ?, ?)")
      .run(req.user.id, name, farbe || "orange");

    res
      .status(201)
      .json({ message: "Workspace erstellt", id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Erstellen des Workspaces:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const { name, farbe } = req.body;

    db.prepare(
      "UPDATE workspaces SET name = ?, farbe = ? WHERE id = ? AND user_id = ?",
    ).run(name, farbe, req.params.id, req.user.id);

    res.json({ message: "Workspace aktualisiert" });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Workspaces:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM workspaces WHERE id = ? AND user_id = ?").run(
      req.params.id,
      req.user.id,
    );

    res.json({ message: "Workspace gelöscht" });
  } catch (err) {
    console.error("Fehler beim Löschen des Workspaces:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

module.exports = router;
