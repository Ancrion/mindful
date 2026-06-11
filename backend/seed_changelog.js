const db = require("./database/db");

const insert = db.prepare(
  "INSERT OR IGNORE INTO changelog (version, datum, titel, features, fixes, commits) VALUES (?, ?, ?, ?, ?, ?)"
);

const entries = [
  ["1.7.8", "2026-06-10", "Widget Drag-Drop, Admin-Rechte-Fix & Sidebar-Bottom-Fix", [],
    ["Drop-Event wurde nicht ausgelöst → Grid-Container statt Widget-Cards als Event-Target",
     "Widgets blieben nach Drop halbdurchsichtig → .dragging-Klasse jetzt auch im Grid-Drop-Handler entfernt",
     "isJaro() prüfte req.user.is_admin (nicht im JWT) → DB-Query SELECT is_admin FROM users WHERE id = ?",
     "Backend gab isJaro: 1 (Integer) statt Boolean → draggable=\"1\" = \"auto\" im HTML5 → Drag nie startbar",
     "Sidebar-Bottom: <button> durch <a> ersetzt für einheitliches Styling mit Optionen",
     "adminOnly Middleware: redirect bei View-Routen statt JSON bei nicht-Admin"],
    ["9f64d54", "fc47729", "a3d7c4e", "cf4013c", "f63ea67", "c2c7f06"]
  ],
  ["1.7.9", "2026-06-11", "Admin-Panel & Benutzerverwaltung + JS-Syntax-Fixes",
    ["Admin-Panel unter /admin mit Benutzertabelle",
     "Admin-Rechte erteilen/entziehen per Klick",
     "Benutzer löschen (Doppel-Bestätigung)",
     "Passwort zurücksetzen (prompt oder Standard mindful2024)",
     "Neue API-Endpunkte unter /api/admin/"],
    ["todo.js: Syntaxfehler (überflüssige }-Klammer) → Script nie geladen",
     "notes.js: Syntaxfehler (doppeltes } in renameNote) → Notizen-Seite tot",
     "todo.js: loadTodos() fehlte const list = document.getElementById(\"taskList\") → ReferenceError",
     "adminOnly Middleware: unterscheidet API vs View-Routen"],
    ["21e1196", "79dd5d5", "e4211b6", "49a5ba2"]
  ],
];

console.log("Füge Changelog-Einträge ein …");
let count = 0;
for (const [version, datum, titel, features, fixes, commits] of entries) {
  const existing = db.prepare("SELECT id FROM changelog WHERE version = ?").get(version);
  if (existing) {
    console.log(`  v${version} existiert bereits (id=${existing.id}) – überspringe`);
    continue;
  }
  insert.run(
    version, datum, titel,
    JSON.stringify(features),
    JSON.stringify(fixes),
    JSON.stringify(commits)
  );
  count++;
}
console.log(`${count} Einträge eingefügt.`);
process.exit(0);
