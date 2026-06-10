const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");
const { isValidSearchQuery } = require("../middleware/validators");
const { getPaginationParams, buildPaginationResponse } = require("../middleware/pagination");
const logger = require("../middleware/logger");

router.get("/", auth, (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const { offset, limit } = getPaginationParams(req);
    
    // Validate search query
    if (q && !isValidSearchQuery(q)) {
      return res.status(400).json({ error: "Suchbegriff zu lang (max. 200 Zeichen)" });
    }
    
    const userId = req.user.id;
    const recentLimit = 8;

    if (!q) {
      const recentTodos = db
        .prepare("SELECT id, titel, status, NULL AS snippet, 'todo' AS typ FROM todos WHERE user_id = ? ORDER BY erstellt DESC LIMIT ?")
        .all(userId, recentLimit);
      const recentNotes = db
        .prepare("SELECT id, titel, NULL AS snippet, 'notiz' AS typ FROM notizen WHERE user_id = ? ORDER BY COALESCE(aktualisiert, erstellt) DESC LIMIT ?")
        .all(userId, recentLimit);
      const recentEvents = db
        .prepare("SELECT id, titel, start_datum, NULL AS snippet, 'event' AS typ FROM events WHERE user_id = ? ORDER BY id DESC LIMIT ?")
        .all(userId, recentLimit);
      const recentDocs = db
        .prepare("SELECT id, titel, typ AS dateityp, NULL AS snippet, 'dokument' AS typ FROM dokumente WHERE user_id = ? ORDER BY id DESC LIMIT ?")
        .all(userId, recentLimit);
      return res.json({ todos: recentTodos, notizen: recentNotes, events: recentEvents, dokumente: recentDocs, suggestions: true });
    }

    const like = `%${q}%`;

    const todos = db
      .prepare("SELECT id, titel, status, SUBSTR(beschreibung, 1, 120) AS snippet, 'todo' AS typ FROM todos WHERE user_id = ? AND (titel LIKE ? OR beschreibung LIKE ?) LIMIT ? OFFSET ?")
      .all(userId, like, like, limit, offset);

    const notizen = db
      .prepare("SELECT id, titel, SUBSTR(inhalt, 1, 120) AS snippet, 'notiz' AS typ FROM notizen WHERE user_id = ? AND (titel LIKE ? OR inhalt LIKE ?) LIMIT ? OFFSET ?")
      .all(userId, like, like, limit, offset);

    const events = db
      .prepare("SELECT id, titel, start_datum, SUBSTR(beschreibung, 1, 120) AS snippet, 'event' AS typ FROM events WHERE user_id = ? AND (titel LIKE ? OR beschreibung LIKE ?) LIMIT ? OFFSET ?")
      .all(userId, like, like, limit, offset);

    const dokumente = db
      .prepare("SELECT id, titel, typ AS dateityp, dateiname, 'dokument' AS typ FROM dokumente WHERE user_id = ? AND (titel LIKE ? OR dateiname LIKE ?) LIMIT ? OFFSET ?")
      .all(userId, like, like, limit, offset);

    res.json(buildPaginationResponse(
      { todos, notizen, events, dokumente, suggestions: false },
      Math.max(todos.length, notizen.length, events.length, dokumente.length),
      offset,
      limit
    ));
  } catch (err) {
    logger.error("Search error", { error: err.message });
    res.status(500).json({ error: "Suchfehler" });
  }
});

module.exports = router;
