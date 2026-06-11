const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const md = require("markdown-it")({ html: true, linkify: true });

const mdFile = path.join(__dirname, "..", "..", "CHANGELOG_DE.md");

router.get("/", (req, res) => {
  try {
    const raw = fs.readFileSync(mdFile, "utf8");
    const html = md.render(raw);
    res.json({ html });
  } catch (err) {
    console.error("Fehler beim Laden des Changelogs:", err);
    res.status(500).json({ error: "Fehler beim Laden" });
  }
});

module.exports = router;
