const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth"); // Deine JWT-Middleware
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer Setup
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/**
 * @swagger
 * /api/dokumente:
 *   get:
 *     summary: Alle Dokumente holen
 *     tags: [Dokumente]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Dokumente
 */
router.get("/", auth, (req, res) => {
  try {
    let query = "SELECT * FROM dokumente WHERE user_id = ?";
    const params = [req.user.id];

    if (req.query.folder_id) {
      query += " AND ordner_id = ?";
      params.push(req.query.folder_id);
    }

    query += " ORDER BY erstellt DESC";
    const docs = db.prepare(query).all(...params);

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, (req, res) => {
  try {
    const { titel, ordner_id } = req.body;

    const sets = [];
    const params = [];

    if (titel !== undefined) { sets.push("titel=?"); params.push(titel); }
    if (ordner_id !== undefined) { sets.push("ordner_id=?"); params.push(ordner_id); }

    if (sets.length === 0) return res.status(400).json({ error: "Keine Felder zum Aktualisieren" });

    params.push(req.params.id, req.user.id);
    db.prepare(`UPDATE dokumente SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`).run(...params);

    res.json({ message: "Dokument aktualisiert" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/dokumente/upload:
 *   post:
 *     summary: Dokument hochladen
 *     tags: [Dokumente]
 *     security:
 *       - bearerAuth: []
 * ... (Swagger Doku wie zuvor)
 */
router.post("/upload", auth, upload.single("datei"), (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Keine Datei hochgeladen" });

    const { titel, ordner_id, todo_id, event_id, kategorie } = req.body;

    const result = db
      .prepare(
        `INSERT INTO dokumente 
       (user_id, titel, ordner_id, dateiname, gespeichert, groesse, todo_id, event_id, bereich) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.user.id,
        titel || req.file.originalname,
        ordner_id || null,
        req.file.filename,
        req.file.path,
        req.file.size,
        todo_id || null,
        event_id || null,
        kategorie || null,
      );

    res
      .status(201)
      .json({ message: "Dokument hochgeladen", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/dokumente/{id}:
 *   delete:
 *     summary: Dokument löschen
 *     ...
 */
router.get("/download/:id", auth, (req, res) => {
  try {
    const dok = db
      .prepare("SELECT * FROM dokumente WHERE id = ? AND user_id = ?")
      .get(req.params.id, req.user.id);
    if (!dok) return res.status(404).json({ error: "Dokument nicht gefunden" });

    const filePath = path.resolve(uploadDir, path.basename(dok.gespeichert));
    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "Datei auf Server nicht gefunden" });

    res.download(filePath, dok.dateiname);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, (req, res) => {
  try {
    const dok = db
      .prepare("SELECT gespeichert FROM dokumente WHERE id = ? AND user_id = ?")
      .get(req.params.id, req.user.id);
    if (dok) {
      const filePath = path.resolve(uploadDir, path.basename(dok.gespeichert));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.prepare("DELETE FROM dokumente WHERE id = ? AND user_id = ?").run(
      req.params.id,
      req.user.id,
    );

    res.json({ message: "Dokument gelöscht" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
