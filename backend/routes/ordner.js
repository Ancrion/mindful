const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", (req, res) => {
  try {
    const ordner = db
      .prepare("SELECT * FROM ordner WHERE user_id = ? ORDER BY erstellt DESC")
      .all(req.user.id);
    res.json(ordner);
  } catch (err) {
    console.error("Fehler beim Laden der Ordner:", err);
    res.status(500).json({ error: "Fehler beim Laden der Ordner" });
  }
});

router.post("/", (req, res) => {
  try {
    const { name, farbe } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name ist erforderlich" });
    }

    const result = db
      .prepare("INSERT INTO ordner (user_id, name, farbe) VALUES (?, ?, ?)")
      .run(req.user.id, name, farbe || "color-sand");

    res
      .status(201)
      .json({ message: "Ordner erstellt", id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Erstellen des Ordners:", err);
    res.status(500).json({ error: "Fehler beim Erstellen des Ordners" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name ist erforderlich" });

    db.prepare("UPDATE ordner SET name = ? WHERE id = ? AND user_id = ?").run(
      name,
      req.params.id,
      req.user.id,
    );
    res.json({ message: "Ordner umbenannt" });
  } catch (err) {
    console.error("Fehler beim Umbenennen des Ordners:", err);
    res.status(500).json({ error: "Fehler beim Umbenennen des Ordners" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM ordner WHERE id = ? AND user_id = ?").run(
      req.params.id,
      req.user.id,
    );
    res.json({ message: "Ordner gelöscht" });
  } catch (err) {
    console.error("Fehler beim Löschen des Ordners:", err);
    res.status(500).json({ error: "Fehler beim Löschen des Ordners" });
  }
});

module.exports = router;
