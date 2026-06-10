const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", (req, res) => {
  try {
    const workspaces = db.prepare("SELECT * FROM workspaces WHERE user_id = ? ORDER BY id").all(req.user.id);
    res.json(workspaces);
  } catch (err) {
    console.error("Fehler beim Laden der Workspaces:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.post("/", (req, res) => {
  try {
    const { name, farbe, parent_id } = req.body;
    if (!name) return res.status(400).json({ error: "Name ist erforderlich" });

    if (parent_id) {
      const parent = db.prepare("SELECT id FROM workspaces WHERE id = ? AND user_id = ?").get(parent_id, req.user.id);
      if (!parent) return res.status(400).json({ error: "Parent-Workspace nicht gefunden" });
    }

    const result = db
      .prepare("INSERT INTO workspaces (user_id, name, farbe, parent_id) VALUES (?, ?, ?, ?)")
      .run(req.user.id, name, farbe || "orange", parent_id || null);

    res.status(201).json({ message: "Workspace erstellt", id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Erstellen des Workspaces:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const { name, farbe, parent_id } = req.body;

    if (parent_id !== undefined) {
      const parent = db.prepare("SELECT id FROM workspaces WHERE id = ? AND user_id = ?").get(parent_id, req.user.id);
      if (parent_id && !parent) return res.status(400).json({ error: "Parent-Workspace nicht gefunden" });
    }

    db.prepare(
      "UPDATE workspaces SET name = COALESCE(?, name), farbe = COALESCE(?, farbe), parent_id = COALESCE(?, parent_id) WHERE id = ? AND user_id = ?",
    ).run(name || null, farbe || null, parent_id !== undefined ? (parent_id || null) : null, req.params.id, req.user.id);

    res.json({ message: "Workspace aktualisiert" });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Workspaces:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.put("/:id/move", (req, res) => {
  try {
    const { parent_id } = req.body;
    const ws = db.prepare("SELECT * FROM workspaces WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!ws) return res.status(404).json({ error: "Workspace nicht gefunden" });

    if (parent_id) {
      const parent = db.prepare("SELECT id FROM workspaces WHERE id = ? AND user_id = ?").get(parent_id, req.user.id);
      if (!parent) return res.status(400).json({ error: "Parent-Workspace nicht gefunden" });
    }

    db.prepare("UPDATE workspaces SET parent_id = ? WHERE id = ?").run(parent_id || null, req.params.id);
    res.json({ message: "Workspace verschoben" });
  } catch (err) {
    console.error("Fehler beim Verschieben:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const ws = db.prepare("SELECT * FROM workspaces WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!ws) return res.status(404).json({ error: "Workspace nicht gefunden" });

    // Kinder an den Parent des gelöschten Workspaces hängen
    db.prepare("UPDATE workspaces SET parent_id = ? WHERE parent_id = ? AND user_id = ?").run(ws.parent_id, req.params.id, req.user.id);

    db.prepare("DELETE FROM workspaces WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ message: "Workspace gelöscht" });
  } catch (err) {
    console.error("Fehler beim Löschen des Workspaces:", err);
    res.status(500).json({ error: "Datenbankfehler" });
  }
});

module.exports = router;
