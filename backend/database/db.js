const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "mindful.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  -- 1. BENUTZER (E-Mail entfernt)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    passwort_hash TEXT NOT NULL,
    wallpaper TEXT DEFAULT NULL,
    avatar TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  -- 2. SESSIONS
  CREATE TABLE IF NOT EXISTS sessions (
    token    TEXT PRIMARY KEY,
    user_id  INTEGER,
    erstellt TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 3. WORKSPACES
  CREATE TABLE IF NOT EXISTS workspaces (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL,
    name     TEXT NOT NULL,
    farbe    TEXT DEFAULT 'orange',
    erstellt TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 4. TODOS
  CREATE TABLE IF NOT EXISTS todos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    workspace_id INTEGER,
    titel        TEXT NOT NULL,
    beschreibung TEXT,
    status       TEXT DEFAULT 'offen',
    faellig      TEXT,
    erledigt     INTEGER DEFAULT 0,
    erstellt     TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
  );

  -- 5. KALENDER KATEGORIEN
  CREATE TABLE IF NOT EXISTS kalender_kategorien (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL,
    name     TEXT NOT NULL,
    farbe    TEXT DEFAULT 'blue',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 6. EVENTS
  CREATE TABLE IF NOT EXISTS events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    titel        TEXT NOT NULL,
    beschreibung TEXT,
    start_datum  TEXT NOT NULL,
    end_datum    TEXT,
    farbe        TEXT DEFAULT '#3B82F6',
    ort          TEXT,
    dauer        INTEGER DEFAULT 60,
    wiederholung TEXT DEFAULT 'none',
    ganztag      INTEGER DEFAULT 0,
    erinnerung   TEXT DEFAULT 'keine',
    erstellt     TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 7. NOTIZEN
  CREATE TABLE IF NOT EXISTS notizen (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL,
    titel    TEXT NOT NULL,
    inhalt   TEXT,
    farbe    TEXT DEFAULT '#FFFFFF',
    todo_id  INTEGER,
    event_id INTEGER,
    erstellt TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 8. ORDNER
  CREATE TABLE IF NOT EXISTS ordner (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT NOT NULL,
    farbe      TEXT DEFAULT 'color-sand',
    erstellt   TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 9. DOKUMENTE
  CREATE TABLE IF NOT EXISTS dokumente (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    ordner_id    INTEGER,
    titel        TEXT NOT NULL,
    typ          TEXT,
    dateiname    TEXT NOT NULL,
    gespeichert  TEXT NOT NULL,
    groesse      TEXT,
    ist_bild     INTEGER DEFAULT 0,
    bereich      TEXT,
    todo_id      INTEGER,
    event_id     INTEGER,
    notiz_id     INTEGER,
    erstellt     TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ordner_id) REFERENCES ordner(id) ON DELETE SET NULL
  );

  -- 10. POMODORO-SITZUNGEN
  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    todo_id         INTEGER,
    duration_seconds INTEGER NOT NULL,
    completed_at    TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE SET NULL
  );

  -- 11. ZEITERFASSUNG
  CREATE TABLE IF NOT EXISTS time_entries (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    todo_id          INTEGER,
    start_time       TEXT NOT NULL,
    end_time         TEXT,
    duration_seconds INTEGER DEFAULT 0,
    description      TEXT,
    created_at       TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE SET NULL
  );
`);

// Schema-Migrationen für bestehende Datenbanken
const migrations = [
  "ALTER TABLE notizen ADD COLUMN ordner_id INTEGER REFERENCES ordner(id)",
  "ALTER TABLE notizen ADD COLUMN aktualisiert TEXT",
  "ALTER TABLE events ADD COLUMN ort TEXT",
  "ALTER TABLE events ADD COLUMN dauer INTEGER DEFAULT 60",
  "ALTER TABLE events ADD COLUMN wiederholung TEXT DEFAULT 'none'",
  "ALTER TABLE events ADD COLUMN ganztag INTEGER DEFAULT 0",
  "ALTER TABLE events ADD COLUMN erinnerung TEXT DEFAULT 'keine'",
  "ALTER TABLE ordner ADD COLUMN farbe TEXT DEFAULT 'color-sand'",
  "ALTER TABLE todos ADD COLUMN prioritaet TEXT DEFAULT 'mittel'",
  "ALTER TABLE users ADD COLUMN wallpaper TEXT DEFAULT NULL",
  "ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL",
  "ALTER TABLE todos ADD COLUMN schritte TEXT DEFAULT '[]'",
  "ALTER TABLE events ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL",
  "ALTER TABLE notizen ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL",
  "CREATE TABLE IF NOT EXISTS dashboard_widgets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, typ TEXT NOT NULL, position INTEGER NOT NULL, config TEXT DEFAULT '{}', FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)",
  "CREATE TABLE IF NOT EXISTS time_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, todo_id INTEGER, start_time TEXT NOT NULL, end_time TEXT, duration_seconds INTEGER DEFAULT 0, description TEXT, created_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE SET NULL)",
];
for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch (_) {
    // Spalte existiert bereits
  }
}

console.log("✅ Datenbank bereit (mindful.db) ohne E-Mail-Pflicht");

module.exports = db;
