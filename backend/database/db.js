const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "mindful.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Migration: parent_id für Workspace-Hierarchie
try {
  db.exec("ALTER TABLE workspaces ADD COLUMN parent_id INTEGER DEFAULT NULL");
} catch (e) {
  // Spalte existiert bereits
}

// Migration: seite für Bug-Reports
try {
  db.exec("ALTER TABLE bug_reports ADD COLUMN seite TEXT DEFAULT NULL");
} catch (e) {
  // Spalte existiert bereits
}

// Migration: UNIQUE-Index auf changelog.version für INSERT OR IGNORE
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_changelog_version ON changelog(version)");
} catch (e) {
  // Index existiert bereits
}

// Migration: erledigt_at Spalte für Leaderboard-Tracking
try {
  db.exec("ALTER TABLE todos ADD COLUMN erledigt_at TEXT DEFAULT NULL");
} catch (e) {
  // Spalte existiert bereits
}

// Migration: is_admin Spalte für Role-Based Authorization
try {
  db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0");
} catch (e) {
  // Spalte existiert bereits
}

// Migration: completed_at für Zeit-Einträge (Leaderboard-Tracking)
try {
  db.exec("ALTER TABLE time_entries ADD COLUMN completed_at TEXT DEFAULT NULL");
} catch (e) {
  // Spalte existiert bereits
}

// Migration: Set first user as admin (for backward compatibility)
try {
  const adminExists = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_admin = 1").get();
  if (adminExists.count === 0) {
    // Setze den ältesten User als Admin
    db.prepare("UPDATE users SET is_admin = 1 WHERE id = (SELECT MIN(id) FROM users)").run();
  }
} catch (e) {
  // No users yet or error
}

db.exec(`
  -- 1. BENUTZER
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE DEFAULT NULL,
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
    prioritaet   TEXT DEFAULT 'mittel',
    schritte     TEXT DEFAULT '[]',
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
    workspace_id INTEGER,
    erstellt     TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
  );

  -- 7. NOTIZEN
  CREATE TABLE IF NOT EXISTS notizen (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    titel        TEXT NOT NULL,
    inhalt       TEXT,
    farbe        TEXT DEFAULT '#FFFFFF',
    todo_id      INTEGER,
    event_id     INTEGER,
    ordner_id    INTEGER,
    aktualisiert TEXT,
    workspace_id INTEGER,
    erstellt     TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
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

  -- 12. DASHBOARD-WIDGETS
  CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL,
    typ      TEXT NOT NULL,
    position INTEGER NOT NULL,
    config   TEXT DEFAULT '{}',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 13. NACHRICHTEN
  CREATE TABLE IF NOT EXISTS messages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id   INTEGER NOT NULL,
    subject      TEXT NOT NULL,
    body         TEXT,
    read         INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 14. PASSWORT-RESET-TOKEN
  CREATE TABLE IF NOT EXISTS password_resets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    token      TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 15. SIDEBAR-MODULES
  CREATE TABLE IF NOT EXISTS sidebar_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module_key TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 17. HABITS
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'fa-check-circle',
    color TEXT DEFAULT '#6366f1',
    category TEXT,
    priority TEXT DEFAULT 'medium',
    typ TEXT DEFAULT 'daily',
    interval_days INTEGER DEFAULT 1,
    time_start TEXT,
    time_end TEXT,
    reminder_time TEXT,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 18. HABIT-LOGS
  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    datum TEXT NOT NULL,
    completed INTEGER DEFAULT 1,
    notes TEXT,
    completed_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, datum)
  );

  -- 19. BUG-REPORTS
  CREATE TABLE IF NOT EXISTS bug_reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    titel       TEXT NOT NULL,
    beschreibung TEXT,
    seite       TEXT DEFAULT NULL,
    status      TEXT DEFAULT 'offen',
    erledigt    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 18. CHANGELOG
  CREATE TABLE IF NOT EXISTS changelog (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    version  TEXT NOT NULL,
    datum    TEXT NOT NULL,
    titel    TEXT NOT NULL,
    features TEXT DEFAULT '[]',
    fixes    TEXT DEFAULT '[]',
    commits  TEXT DEFAULT '[]',
    erstellt TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Seed: Fehlende Changelog-Einträge nachtragen (inkrementell)
// Add unique constraint for sidebar_modules (user_id + module_key)
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_sidebar_modules_user_key ON sidebar_modules(user_id, module_key)");
} catch (e) {}

// Seed default sidebar modules for existing users (will be created on first API call instead)
const insert = db.prepare("INSERT OR IGNORE INTO changelog (version, datum, titel, features, fixes, commits) VALUES (?, ?, ?, ?, ?, ?)");
const seed = [
    ["0.1.0", "2026-06-09", "Initiale Entwicklung", '["Dashboard mit Widget-System","To-Do-Listen mit Workspaces und Prioritäten","Kalender mit Kategorien und Events","Notizen mit Markdown-Editor und Kategorien","Pomodoro-Timer","Zeiterfassung mit Dashboard-Statistiken","Sidebar-Navigation mit Workspace-Filter","Dark Mode","Globale Spotlight-Suche (Strg+K)","Dokumenten-Upload und -Verwaltung"]', '[]', '["f7ec37c","2cc4c60","c2d91cb","2bf8706","fcf9c96","c521c45","52ad5ad"]'],
    ["0.2.0", "2026-06-09", "Community & Kommunikation", '["Rangliste (Leaderboard) mit Todo-/Pomodoro-/Tracking-Punkten","Benutzerprofile mit individuellen Avataren und Wallpapern","Nachrichtensystem mit User-Suche und Privatchats","Überarbeitete Notizen-Oberfläche mit Live-Vorschau"]', '["Notizen-Toolbar deaktiviert sich bei Inaktivität"]', '["4452441","909d6d4","9721fdb","2abbef2","1effffa","8db4ad9","e64941d","5d2ca21","8f973e0"]'],
    ["0.3.0", "2026-06-09", "Projektplan & Entwicklungs-Dashboard", '["Entwicklungsplan-Seite mit Aufgabenverteilung (Team-Übersicht)","Interaktive Aufgabenliste mit Checkboxen und localStorage","Code-Snippet-Viewer mit 1:1-Projektdatei-Kopien","34 exakte Code-Snippets für alle Teammitglieder","Dynamische Aufgaben-Filter (offen/erledigt)"]', '["EJS-Escaping von Spezialzeichen (</script>, <%=)","Schema-Migrationen in einen einzelnen db.exec-Block vereinheitlicht","Alle Snippets auf exakte 1:1-Kopien umgestellt"]', '["55e6be5","df51583","c047569","94cbb5b","e6d3f26","6bdc076","61dd482","779ffb4","54ffb87","5bf4b1f","87d5128","51b436c","2f358b9","90e1587"]'],
    ["1.0.0", "2026-06-10", "Passwort-Reset & E-Mail-System", '["Passwort-vergessen-Funktion mit Token-Link","E-Mail-Feld bei Registrierung und im Profil","Sicherer Passwort-Zurücksetzen-Flow mit gültigem Zeitfenster","Professionelles HTML-E-Mail-Template im Mindful-Design","Flexibles E-Mail-System: SMTP (Gmail/Brevo) oder sendmail","sendmail als Fallback auf dem VPS installiert"]', '["Globaler Timer nur noch bei aktivem Pomodoro sichtbar","Pomodoro-Timer überlebt Seitenwechsel via localStorage","stopGlobalTimer() vor Logout eingebaut – keine JS-Fehler mehr"]', '["e30464c","d3e6a0e","0d15197","5e8876e","148f666","7d7455c"]'],
    ["1.1.0", "2026-06-10", "Bug-Report-System", '["Bug-Melden-Seite mit Formular und Kachel-Ansicht","Kanban-Board mit 3 Spalten: Offen / In Arbeit / Abgeschlossen","Drag & Drop zum Verschieben zwischen Status-Spalten","Löschen per rotem X (nur Admin jaro)","Berechtigungssystem: jaro verwaltet, alle anderen melden","Echtzeit-Count pro Status-Spalte"]', '[]', '["1578c48","4e66369"]'],
    ["1.2.0", "2026-06-10", "Workspace-Hierarchie", '["Workspace-Baum mit Eltern/Kind-Struktur (parent_id)","Sidebar mit Expand/Collapse und Einrückung","Drag & Drop zum Verschieben von Workspaces in der Hierarchie","Todo-Filter zeigt alle Todos aus Unter-Workspaces an","Neue Workspaces werden als Kind des ausgewählten erstellt","Beim Löschen werden Kinder an den Großeltern-Workspace gehängt"]', '[]', '["0a40bfb"]'],
    ["1.3.0", "2026-06-10", "Versionsverlauf & Changelog", '["Professionelle Changelog-Seite mit Timeline-Design","Automatische Seed-Einträge aus der Git-Historie (v0.1.0 bis v1.3.0)","Admin-Interface (jaro) zum Erstellen/Bearbeiten/Löschen von Einträgen","Feature-Liste (blau) und Bugfix-Liste (grün) pro Version","Einklappbare Commit-Hashes pro Eintrag","Aktuellste Version wird optisch hervorgehoben","Sidebar-Link für alle sichtbar – kein Login nötig"]', '["Drag & Drop in der Workspace-Hierarchie repariert (addEventListener statt Inline-Handler)"]', '["f5187aa","b214064"]'],
    ["1.3.1", "2026-06-10", "Seitenauswahl bei Bug-Reports", '["Dropdown zur Auswahl der betroffenen Seite im Bug-Formular (Dashboard, To-Do, Notizen, Kalender, Pomodoro, Zeiterfassung, Rangliste, Nachrichten, Profil, Projektplan, Bugs, Versionsverlauf)","Seiten-Badge auf jeder Bug-Karte (z.B. Dashboard, To-Do)"]', '["Changelog v1.3.0 nachgetragen","Entwicklungsplan team-3 nachgetragen"]', '["c10e62c"]'],
    ["1.3.2", "2026-06-10", "Bug-Formular-Redesign", '["Komplett überarbeitetes Bug-Formular: Card-Design mit Kopfzeile, Bug-Icon und abgesetzter Hintergrundfläche","Custom-Select mit benutzerdefiniertem Chevron-Pfeil","Senden-Button im Accent-Design mit Hover-Effekt (translateY + Box-Shadow) und Papierflieger-Icon","Größere Abrundungen (10px) und weichere Fokus-Rahmen für alle Inputs","Button rechtsbündig im Footer der Karte"]', '[]', '["3ecc272"]'],
    ["1.3.3", "2026-06-10", "Kontextmenü für Todos & Workspace-DnD-Fix", '["Rechtsklick-Kontextmenü für Aufgaben (Bearbeiten/Erledigt umschalten/Löschen)","Kontextmenü per addEventListener statt oncontextume – zuverlässiger bei dynamisch gerenderten Elementen","Drag & Drop in der Workspace-Hierarchie repariert (Inline-Handler + addEventListener)","Changelog-UI vereinfacht: kein Admin-Modal mehr, Einträge nur noch per Seed"]', '[]', '["434350c","4f85ce9"]'],
    ["1.4.0", "2026-06-10", "Workspace-Kontextmenü & DnD auf allen Seiten", '["Rechtsklick-Kontextmenü für Workspaces in der Sidebar und im Todo-Dropdown (Unter-Workspace, Umbenennen, Löschen, Zu root machen)","Workspace-DnD funktioniert jetzt auch im Todo-Dropdown","Drop auf \"Alle\" setzt parent_id=null (root)","Drag-Visual-Fix: ws-dragging-Klasse wird auf beiden Elementtypen korrekt gesetzt und bereinigt"]', '["Naming-Konflikt loadWorkspaces zwischen app.js/todo.js behoben – Sidebar-Baum wurde auf Todo-Seite nie gerendert","wsDragStart nutzt e.currentTarget statt e.target.closest – crashte auf .workspace-item","dragend bereinigt jetzt auch .workspace-item","Drop auf \"Alle\" löst move mit parent_id=null aus"]', '["4f85ce9","004d84e","9288e67"]'],
    ["1.4.1", "2026-06-10", "Workspace-Filter & Sidebar-Sync Fix", '["Workspace-Filter auf Todo-Seite funktioniert jetzt direkt nach Seiten-Lade (currentWorkspaceId aus localStorage restore)","Auswahl eines Workspace im Todo-Dropdown syncronisiert jetzt die Sidebar (selectWsSidebar statt loadWorkspaces)","Inline-Event-Handler für DnD durch addEventListener ersetzt – e.currentTarget funktioniert zuverlässiger","Visuelles Feedback bei wsDragOver: vorherige Highlights werden vor dem Setzen bereinigt","Todo-Dropdown wird nach jedem workspacechange-Event aktualisiert (auch bei DnD ohne ID-Wechsel)"]', '["workspacechange-Event wurde zu früh dispatched (vor todo.js-Listener) – initialer Filter fehlte","selectWorkspace rief nur loadWorkspaces() statt selectWsSidebar() – Sidebar blieb auf \'Alle\' stehen","wsDragOver häufte ws-drag-over auf allen besuchten Items an – cleanup vor add","Kein Syntax-Fehler – node -c bestätigt gültiges JS"]', '["e3409eb","e1d24cf"]'],
    ["1.5.0", "2026-06-10", "Bug-Seite Full-Screen-Redesign", '["Bug-Seite füllt jetzt die gesamte Bildschirmhöhe","Layout linksbündig (margin: 0 auto entfernt)","Kanban-Spalten scrollen einzeln (overflow-y: auto)","bugs-content + kanban nutzen flex: 1 für dynamische Höhenverteilung"]', '["bugs-main hatte fixe max-width: 1200px ohne flex: 1 – Kanban wuchs nie über Inhalt","kanban-cards hatten min-height: 80px und kein overflow – Karten quollen über","bugs-content hatte kein flex: 1 – Formular und Kanban verteilten sich nicht"]', '["24f0d15","44cfe94"]'],
     ["1.6.0", "2026-06-10", "Kalender-DnD & Sidebar-Buttons", '["Events in der Tages-/Wochenansicht vertikal verschieben (Startzeit ändert sich)","Events zwischen Tagen in Wochen-/Tagesansicht verschieben","Events in der Monatsansicht zwischen Datumszellen verschieben (Datum ändert sich, Uhrzeit bleibt)","Visuelles Feedback während des Drags (Opacity) + blaue Hervorhebung der Drop-Zone","Zeit-Raster-Snapping (5-Minuten-Intervalle)","All-Day-Events korrekt in der Monatsansicht verschiebbar","Optionen-Button (Zahnrad) + Abmelden-Button in der Sidebar unten","Dashboard-Widget „Termine\" überarbeitet: Uhrzeit bei allen Events + Gruppierung in Heute/Morgen/Diese Woche/Nächste Woche","Dashboard-Widget „Kalender\": Mini-Monatskalender mit Termin-Dots und Monatsnavigation"]', '["Klick auf Events nach Drag & Drop unterdrückt (kein ungewolltes Modal-Öffnen)","Drag-Start auf Resize-Handle verhindert (Konflikt mit Höhenänderung)","Altes Abmelden-Link aus User-Info entfernt (keine Dublette)","Fixed-height-Sidebar wieder rückgängig – Sidebar scrollt jetzt normal mit der Seite mit (Buttons bleiben bei kurzen Seiten unten, scrollen bei langen Seiten mit)"]', '[]'],
     ["1.6.1", "2026-06-10", "Security & Bug-Fixes", '[]', '["Fehlende Auth-Middleware auf Changelog-Routes hinzugefügt (CRITICAL: Authorization-Bypass)","Password-Reset-Token aus JavaScript entfernt (XSS-Risiko) – jetzt in Hidden-Input","Leaderboard: erledigt_at Feld hinzugefügt für korrekte Todo-Completion-Tracking (Timestamp statt Boolean)","Hardcoded \'jaro\'-Checks durch role-based is_admin Authorization ersetzt (adminOnly-Middleware)","Token-basierter Authorization für alle Admin-Funktionen (Changelog, Entwicklungsplan, Bug-Management)"]', '[]'],
     ["1.6.2", "2026-06-10", "Input Validation & Error Handling", '[]', '["Frontend JSON-Parsing-Fehler: Global safeJson() Helper mit Try-Catch für alle apiFetch() Calls","Workspace-Farbe-Validation: Whitelist mit 8 erlaubten Farben (orange, blue, green, pink, red, purple, teal, yellow)","Zeit-Entry-Validierung: duration_seconds muss zwischen 0-86400 Sekunden liegen","Workspace-Löschung Cascade: Zugehörige Todos, Notizen, Events werden automatisch gelöscht","Leaderboard Timestamp: time_entries.completed_at für korrekte tägliche Verfolgung","Leaderboard Query: Nutzt completed_at statt created_at für korrekte Auswertung"]', '[]'],
     ["1.6.3", "2026-06-10", "Security Hardening & Standardization", '[]', '["Rate Limiting auf Auth-Endpoints: 5 Anmeldeversuche pro 15 Min, 3 Passwort-Reset-Versuche pro Stunde (DoS-Schutz)","Email-Format-Validierung: RFC 5322 Regex + Max 254 Zeichen","Datei-Upload-Limits: Multer limits (100 MB), isValidFileSize() für verschiedene Dateitypen","Search-Query-Validierung: Max 200 Zeichen (ReDoS-Prävention)","Security Headers hinzugefügt: X-Content-Type-Options, X-XSS-Protection, X-Frame-Options, CSP, Referrer-Policy","Error Response Standardisierung: Alle Fehler als {error: \"message\"}, keine internen Details im 500er","Global Error Handler: Behandelt unerwartete Fehler einheitlich","Null-Safety Guards: user?.name statt user.name (optional chaining)"]', '[]'],
      ["1.6.4", "2026-06-10", "Code Quality & Infrastructure", '[]', '["API Pagination: offset/limit für Search + Leaderboard mit hasMore-Flag","Strukturiertes Logging: JSON-Format statt console.error für alle Fehler","CORS Configuration: Whitelist-basiert via CORS_ORIGIN env-var","XSS Prevention: onclick-Handler in documents.js durch addEventListener ersetzt","Config Module: Zentrale Verwaltung von uploadDir, maxFileSize, corsOrigin via Env-Vars","Leaderboard Query: LIMIT + OFFSET für pagination-ready Queries"]', '[]'],
      ["1.6.5", "2026-06-10", "Bug-Fixes: Admin-Setup & Template-Escape", '[]', '["Admin-Autodetection: Erster User wird automatisch zum Admin statt hardcoded \'jaro\'-Name (flexibel für verschiedene Deployments)","EJS Template-Escape: Code-Snippets in entwicklungsplan.ejs mit HTML-Entities escaped (verhindert EJS-Interpretation)","Bug-Seite: Admin kann Bugs jetzt korrekt löschen und verschieben (isJaro Flag korrekt gesetzt)"]', '[]'],
      ["1.6.6", "2026-06-10", "Weather Widget Autocomplete", '[]', '["Wetter-Widget: Stadt-Eingabe mit Live-Autocomplete-Suggestions","Dropdown-Liste zeigt bis zu 5 Stadt-Vorschläge während des Tippens (ab 2 Zeichen)","Klick auf Vorschlag: Stadt wird automatisch ausgewählt und Wetter wird geladen","Suggestions-Styling: Map-Icon, Stadt-Name, Admin1-Region (Bundesland), Hover-Effekt","Autocomplete arbeitet mit Open-Meteo Geocoding API (kostenlos, keine API-Key nötig)","HTML-Struktur erweitert: weather-search-wrapper für relative Positionierung, weather-suggestions-list für Dropdown"]', '[]'],
      ["1.7.0", "2026-06-10", "Professional Design System v2.0 - COMPLETE REDESIGN", '[]', '["🎨 PHASE 1: Design System Foundation - 25+ CSS Custom Properties (Colors, Typography, Spacing, Shadows, Radius, Transitions, Z-Index)","🎨 PHASE 2: Component Library - 40+ standardized components (Buttons, Forms, Cards, Modals, Navigation, Lists, Tables, Badges, Alerts)","🎨 PHASE 3: Visual Polish - Glassmorphism, Gradient Effects, Enhanced Shadows, Neumorphic Effects, Border Treatments, Blur Effects","🎨 PHASE 4: Accessibility - WCAG 2.1 AA compliance, Focus states, Keyboard navigation, Screen reader support, Color contrast","🎨 Layout System - 12-column responsive grid, Flexbox layouts, Sidebar system, Split layout, Stack layout, Container system","🎨 Animation System - 30+ animations (Fade, Slide, Scale, Zoom, Spin, Bounce, Shake), Transition utilities, Hover effects, Loading states","🎨 Dark Mode - Complete dark theme with all semantic colors for light and dark modes, consistent contrast ratios"]', '[]'],
      ["1.7.1", "2026-06-10", "Kalender Widget kompakter & kleiner + Ansichtswahl", '["Widget-Größen einzelner Widget-Typen optimiert (S2 für Kalender)","Grid-only-Monatsansicht ohne fixe Raster","Wochen-Ansicht (Montag–Sonntag mit Datum)","Tages-Ansicht mit Event-Liste","Ansichtsumschaltung zwischen Monat/Woche/Tag über Button-Leiste in der Kopfzeile","Kompaktere Darstellung: kleinere Abstände + reduzierte Font-Größen","Gleiche Widget-Rendering-Architektur wie andere Dashboard-Widgets"]', '[]', '["6bf4582","fe9d29c"]'],
      ["1.7.2", "2026-06-10", "Flexibles Widget-System mit Auto-Fit & Dense Grid", '["Dynamische Größenanpassung: _autoFitWidget() passt Widget-Breite beim Verschieben automatisch an verfügbaren Platz an","Grid-auto-flow: dense – Lücken werden automatisch gefüllt","Resize-Handle + Maus-/Touch-Unterstützung zum manuellen Ändern der Widget-Größe (S1–S4)","Tastatur-Navigation: Pfeiltasten zum Verschieben, Shift+Pfeiltasten zum Größe ändern","Fokus-Management mit visuellem Fokus-Ring"]', '[]', '["cd7b7c7"]'],
      ["1.7.3", "2026-06-10", "Kalender Widget Ansichtswahl in Kopfzeile + Datum-Fix", '["View-Switcher (Monat/Woche/Tag) in die Kalender-Kopfzeile integriert (neben Monat-Jahr-Titel und Navigation)","Doppeltes Datum in Tagesansicht entfernt (title + body zeigten zweimal das Datum – jetzt zentrale Anzeige nur im title)"]', '[]', '["6d210f1"]'],
      ["1.7.4", "2026-06-10", "Willkommen-Text bündig zu Widgets + verschoben", '["Willkommen-Text von padding-top: 24px auf 32px erhöht, padding-bottom von 16px auf 24px – Text schwebt mittig zwischen Breadcrumb und erstem Widget","Responsive Anpassung: 24px/16px bei <768px Bildschirmbreite"]', '[]', '["c674ad5"]'],
      ["1.7.5", "2026-06-10", "Kalender Widget Ansichtswahl in Header-Leiste zentriert", '["Ansichtswahl in der Kalender-Header-Leiste: Monat/Woche/Tag-Buttons jetzt in .widget-header (neben Kalender-Titel)","Absolute Zentrierung per position:absolute + left:50% + transform:translateX(-50%)","Größere Buttons (0.6rem + padding 3px 8px + border-radius 8px)","Keine doppelten Buttons mehr – cal-view-switch nur noch im Header"]', '[]', '["38c96a1"]'],
      ["1.7.6", "2026-06-10", "Kalender füllt Card-Höhe + Drag-Drop Reflow", '["Kalender dehnt sich auf volle Card-Höhe (display:flex + height:100%)","Grid-Reihen verteilen gleichmäßig (grid-auto-rows:1fr)","Monat/Woche/Tag-Views füllen die verfügbare Höhe","Leerer-Status zentriert (flex + align-items:center)"]', '["Widget Drag-Drop repariert: grid-auto-flow:dense entfernt → DOM-Reihenfolge = visuelle Ordnung","_reflowAll() scannt ALLE Widgets nach Drop/Resize/Tastatur","Shrink-vor-Wrap: Widget wird verkleinert bevor es umbricht → keine Lücken mehr","Widgets passen sich beim Verschieben automatisch aneinander an"]', '["45f002f","94bf4f2"]'],
      ["1.7.7", "2026-06-10", "Widget-System Smooth Drag-Drop & UX-Verbesserungen", '[]', '["Smooth Drag-Drop-Animationen: Placeholder pulst, 0.3s Transitions, größere Box-Shadow beim Dragging","Bessere visuelle Feedback: 3px Accent-Border bei drag-over, 0.5 Opacity + 0.95 Scale beim Dragging","Intelligente Placeholder-Logik: 50ms Delay verhindert Flackern, Position basiert auf Cursor relativ zur Ziel-Karte","Cursor-Position-basierte Insertion: Placeholder vor/nach je nach Maus-Position (Mitte teilt)","Fade-out beim Drop (0.25s) statt Hartem Löschen"]', '["7d17edc"]'],
      ["1.7.7-Hotfix", "2026-06-10", "Widget Drag-Drop Fehler-Handling & Undo", '[]', '["Undo-Logik bei Drop-Fehler: Speichert originalOrder + Größen, reverted bei API-Fehler","Robustes _setWidgetSize(): Optimistic Update mit Rollback","_saveOrder() auch mit Undo für Tastatur-Navigation","Validiert API-Response auf res.ok (nicht nur error-Feld)","Widgets springen nicht mehr zurück bei Netzwerkfehler"]', '["f63471d"]'],
      ["1.7.7-Final", "2026-06-10", "Widget Drag-Drop System komplett rewritten", '[]', '["Neuer _dragState statt mehrere Variablen → klarer und weniger Fehler","Einfacheres State-Management: nur {id, draggedElement}","Placeholder wird IMMER in Grid eingefügt (nicht this.parentNode)","Speichert originalHTML + originalSizes VOR jeder Änderung für Undo","Re-attach Event-Listener nach Undo ✅","Robuste insertBefore Logik mit klaren Bedingungen (dragIdx < targetIdx)"]', '["8f5636a"]'],
    ];
  const tx = db.transaction(() => {
    for (const row of seed) insert.run(...row);
  });
  tx();

module.exports = db;
