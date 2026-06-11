const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const dataFile = path.join(__dirname, "..", "data", "changelog-seed.json");

function loadEntries() {
  const raw = fs.readFileSync(dataFile, "utf8");
  return JSON.parse(raw);
}

router.get("/", (req, res) => {
  try {
    const entries = loadEntries();
    res.json(entries);
  } catch (err) {
    console.error("Fehler beim Laden des Changelogs:", err);
    res.status(500).json({ error: "Fehler beim Laden" });
  }
});

module.exports = router;
