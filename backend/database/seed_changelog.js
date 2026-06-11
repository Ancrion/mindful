const db = require("../database/db");
const seedData = require("./changelog-seed.json");

function autoSeedChangelog() {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO changelog (version, datum, titel, features, fixes, commits) VALUES (?, ?, ?, ?, ?, ?)"
  );

  let count = 0;
  for (const entry of seedData) {
    const existing = db.prepare("SELECT id FROM changelog WHERE version = ?").get(entry.version);
    if (existing) continue;
    insert.run(
      entry.version,
      entry.datum,
      entry.titel,
      JSON.stringify(entry.features || []),
      JSON.stringify(entry.fixes || []),
      JSON.stringify(entry.commits || [])
    );
    count++;
  }

  if (count > 0) {
    console.log(`✅ ${count} neue Changelog-Einträge automatisch eingefügt`);
  }
}

module.exports = autoSeedChangelog;
