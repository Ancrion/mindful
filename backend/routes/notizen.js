const express = require("express");
const router = express.Router();
const db = require("../database/db");
// ACHTUNG: Stelle sicher, dass der Pfad zur Middleware stimmt (z.B. "../middleware/auth" oder du nutzt die Funktion direkt)
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/notizen:
 *   get:
 *     summary: Alle Notizen holen
 *     tags: [Notizen]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Notizen
 */
router.get("/", auth, (req, res) => {
  try {
    let query = "SELECT n.*, w.name AS workspace_name, w.farbe AS workspace_farbe FROM notizen n LEFT JOIN workspaces w ON n.workspace_id = w.id WHERE n.user_id = ?";
    const params = [req.user.id];

    if (req.query.folder) {
      query += " AND ordner_id = ?";
      params.push(req.query.folder);
    }

    query += " ORDER BY erstellt DESC";
    const notizen = db.prepare(query).all(...params);
    res.json(notizen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notizen:
 *   post:
 *     summary: Neue Notiz erstellen
 *     tags: [Notizen]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titel:
 *                 type: string
 *               inhalt:
 *                 type: string
 *               farbe:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notiz erstellt
 */
router.post("/", auth, (req, res) => {
  try {
    const { titel, inhalt, farbe, workspace_id } = req.body;
    const ordner_id = req.body.ordner_id || req.body.ordnerId || null;
    const result = db
      .prepare(
        "INSERT INTO notizen (user_id, titel, inhalt, farbe, ordner_id, workspace_id) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(req.user.id, titel || "Neue Notiz", inhalt || "", farbe || "#FFFFFF", ordner_id, workspace_id || null);

    const note = db
      .prepare("SELECT * FROM notizen WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notizen/{id}:
 *   put:
 *     summary: Notiz updaten
 *     tags: [Notizen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notiz geupdated
 */
router.put("/:id", auth, (req, res) => {
  try {
    const sets = [];
    const params = [];
    if (req.body.titel !== undefined) {
      sets.push("titel=?");
      params.push(req.body.titel);
    }
    if (req.body.inhalt !== undefined) {
      sets.push("inhalt=?");
      params.push(req.body.inhalt);
    }
    if (req.body.farbe !== undefined) {
      sets.push("farbe=?");
      params.push(req.body.farbe);
    }
    if (req.body.ordner_id !== undefined || req.body.ordnerId !== undefined) {
      sets.push("ordner_id=?");
      params.push(req.body.ordner_id ?? req.body.ordnerId ?? null);
    }
    if (req.body.workspace_id !== undefined) {
      sets.push("workspace_id=?");
      params.push(req.body.workspace_id || null);
    }
    sets.push("aktualisiert=datetime('now', 'localtime')");
    params.push(req.params.id, req.user.id);
    db.prepare(`UPDATE notizen SET ${sets.join(", ")} WHERE id=? AND user_id=?`).run(...params);

    const note = db
      .prepare("SELECT * FROM notizen WHERE id = ? AND user_id = ?")
      .get(req.params.id, req.user.id);

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notizen/{id}:
 *   delete:
 *     summary: Notiz löschen
 *     tags: [Notizen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notiz gelöscht
 */
router.delete("/:id", auth, (req, res) => {
  try {
    db.prepare("DELETE FROM notizen WHERE id = ? AND user_id = ?").run(
      req.params.id,
      req.user.id,
    );
    res.json({ message: "Notiz gelöscht" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
