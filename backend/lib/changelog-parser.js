const fs = require("fs");
const path = require("path");

const mdFile = path.join(__dirname, "..", "..", "CHANGELOG_DE.md");

function parseEntries() {
  const raw = fs.readFileSync(mdFile, "utf8");
  const lines = raw.split("\n");

  const entries = [];
  let current = null;
  let section = null;

  for (const line of lines) {
    // Neue Version: ## vX.Y.Z - Titel
    const versionMatch = line.match(/^##\s+.+?v(\d+\.\d+\.\d+)\s*-\s*(.+)$/);
    if (versionMatch) {
      if (current) entries.push(current);
      current = {
        version: versionMatch[1],
        titel: versionMatch[2].trim(),
        datum: "",
        features: [],
        fixes: [],
        commits: [],
      };
      section = null;
      continue;
    }

    if (!current) continue;

    // Datum: **text**: DD.MM.YYYY → YYYY-MM-DD
    const dateMatch = line.match(/^\*\*.*?\*\*:\s*(\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      current.datum = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      continue;
    }

    // Neue Funktionen
    if (line.includes("###") && /Neue Funktionen/i.test(line)) {
      section = "features";
      continue;
    }

    // Bugfixes
    if (line.includes("###") && /Bugfixes|Improvements|Behoben/i.test(line)) {
      section = "fixes";
      continue;
    }

    // Commits section (if any)
    if (line.includes("###") && /Commits/i.test(line)) {
      section = "commits";
      continue;
    }

    // Items in current section
    if (section && line.trim().startsWith("- ")) {
      let item = line.trim().replace(/^- /, "").trim();
      item = item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      item = item.replace(/`(.*?)`/g, "<code>$1</code>");
      if (section === "features") current.features.push(item);
      else if (section === "fixes") current.fixes.push(item);
      else if (section === "commits") current.commits.push(item);
    }
  }

  if (current) entries.push(current);
  return entries;
}

module.exports = { parseEntries };
