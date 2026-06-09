const express = require("express");
const router = express.Router();
const db = require("../database/db");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, (req, res) => {
  try {
    const user = req.user;

    const todos = db
      .prepare("SELECT t.*, w.name AS workspace_name FROM todos t LEFT JOIN workspaces w ON t.workspace_id = w.id WHERE t.user_id = ?")
      .all(req.user.id);

    const notizen = db
      .prepare("SELECT * FROM notizen WHERE user_id = ?")
      .all(req.user.id);

    const events = db
      .prepare("SELECT * FROM events WHERE user_id = ?")
      .all(req.user.id);

    const dokumente = db
      .prepare("SELECT * FROM dokumente WHERE user_id = ?")
      .all(req.user.id);

    res.json({
      user,
      todos,
      notizen,
      events,
      dokumente,
    });
  } catch (err) {
    console.error("Fehler beim Laden der Dashboard-Daten:", err);
    res
      .status(500)
      .json({ error: "Datenbankfehler beim Laden des Dashboards" });
  }
});

module.exports = router;

