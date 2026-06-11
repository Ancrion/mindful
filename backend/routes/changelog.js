const express = require("express");
const router = express.Router();
const { parseEntries } = require("../lib/changelog-parser");

router.get("/", (req, res) => {
  try {
    const entries = parseEntries();
    res.json(entries);
  } catch (err) {
    console.error("Fehler beim Laden des Changelogs:", err);
    res.status(500).json({ error: "Fehler beim Laden" });
  }
});

module.exports = router;
