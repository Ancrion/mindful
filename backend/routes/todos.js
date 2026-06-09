const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Alle Todos holen
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Todos
 */
router.get("/", auth, (req, res) => {
  try {
    let query = `SELECT t.*, w.name AS workspace_name, w.farbe AS workspace_farbe FROM todos t LEFT JOIN workspaces w ON t.workspace_id = w.id WHERE t.user_id = ?`;
    const params = [req.user.id];

    if (req.query.status && req.query.status !== "alle") {
      query += " AND t.status = ?";
      params.push(req.query.status);
    }
    if (req.query.workspace_id) {
      query += " AND t.workspace_id = ?";
      params.push(req.query.workspace_id);
    }

    query += " ORDER BY t.erstellt DESC";
    const todos = db.prepare(query).all(...params);
    todos.forEach((t) => {
      if (t.schritte && typeof t.schritte === "string") {
        try { t.schritte = JSON.parse(t.schritte); } catch { t.schritte = []; }
      }
    });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Neues Todo erstellen
 *     tags: [Todos]
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
 *               beschreibung:
 *                 type: string
 *               workspace_id:
 *                 type: integer
 *               faellig:
 *                 type: string
 *     responses:
 *       201:
 *         description: Todo erstellt
 */
router.post("/", auth, (req, res) => {
  try {
    const { titel, beschreibung, workspace_id, status, prioritaet } = req.body;
    const faellig = req.body.faellig || req.body.due_date || null;
    if (!titel) return res.status(400).json({ error: "Titel fehlt" });

    const result = db
      .prepare(
        "INSERT INTO todos (user_id, titel, beschreibung, workspace_id, faellig, status, prioritaet) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(req.user.id, titel, beschreibung, workspace_id || null, faellig, status || "offen", prioritaet || "mittel");

    res
      .status(201)
      .json({ message: "Todo erstellt ✅", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: Todo aktualisieren
 *     tags: [Todos]
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
 *         description: Todo aktualisiert
 */
router.put("/:id", auth, (req, res) => {
  try {
    const { titel, beschreibung, status, erledigt, workspace_id, prioritaet, schritte } = req.body;
    const faellig = req.body.faellig ?? req.body.due_date;

    const todo = db
      .prepare("SELECT * FROM todos WHERE id = ? AND user_id = ?")
      .get(req.params.id, req.user.id);
    if (!todo) return res.status(404).json({ error: "Todo nicht gefunden" });

    db.prepare(
      `UPDATE todos SET 
        titel = ?, beschreibung = ?, faellig = ?, status = ?, erledigt = ?, workspace_id = ?, prioritaet = ?, schritte = ? 
       WHERE id = ? AND user_id = ?`,
    ).run(
      titel ?? todo.titel,
      beschreibung ?? todo.beschreibung,
      faellig ?? todo.faellig,
      status ?? todo.status,
      erledigt ?? todo.erledigt,
      workspace_id ?? todo.workspace_id,
      prioritaet ?? todo.prioritaet,
      schritte ?? todo.schritte,
      req.params.id,
      req.user.id,
    );

    res.json({ message: "Todo aktualisiert ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: Todo löschen
 *     tags: [Todos]
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
 *         description: Todo gelöscht
 */
router.delete("/:id", auth, (req, res) => {
  try {
    db.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ message: "Todo gelöscht ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/todos/{id}/related:
 *   get:
 *     summary: Verknüpfte Notizen und Dokumente abrufen
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id/related", auth, (req, res) => {
  try {
    const id = req.params.id;
    const notizen = db
      .prepare("SELECT * FROM notizen WHERE todo_id = ? AND user_id = ?")
      .all(id, req.user.id);
    const events = [];
    const dokumente = db
      .prepare("SELECT * FROM dokumente WHERE todo_id = ? AND user_id = ?")
      .all(id, req.user.id);

    res.json({ notizen, events, dokumente });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
