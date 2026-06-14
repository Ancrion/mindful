/**
 * Seed Development Tasks
 * Run with: node backend/database/seed-dev-tasks.js
 */

const db = require('./db');

const tasks = [
  {
    title: 'Database Schema: Users, Sessions, Workspaces',
    description: 'Erstelle die Datenbanktabellen für Benutzer, Sessions und Workspaces mit Hierarchie-Support (parent_id).',
    file_path: 'backend/database/db.js',
    line_start: 63,
    line_end: 90,
    action_type: 'add',
    assignee: 'ilhan',
    status: 'done',
    priority: 'high',
    phase: 'Phase 1'
  },
  {
    title: 'Database Schema: Todos, Events, Notes, Documents',
    description: 'Implementiere die Tabellen für Todos (mit Schritte-Array), Events (mit Kalender-Integration), Notizen (mit Markdown-Support) und Dokumente (mit File-Upload).',
    file_path: 'backend/database/db.js',
    line_start: 92,
    line_end: 183,
    action_type: 'add',
    assignee: 'ilhan',
    status: 'done',
    priority: 'high',
    phase: 'Phase 1'
  },
  {
    title: 'Authentication Routes: Register & Login',
    description: 'Sichere User-Registrierung mit bcrypt-Hashing, JWT-basierte Login-Tokens mit Expiration, Email-Validierung (RFC 5322), Rate-Limiting (5 Versuche/15 Min).',
    file_path: 'backend/routes/auth-routes.js',
    line_start: 1,
    line_end: 100,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 2'
  },
  {
    title: 'Authentication Routes: Password Reset with Email',
    description: 'Implementiere "Passwort vergessen" Flow mit Token-Link, Token-Validierung mit TTL (15 Minuten), HTML-Email-Template mit Mindful-Design, SMTP/sendmail Integration.',
    file_path: 'backend/routes/auth-routes.js',
    line_start: 200,
    line_end: 300,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 2'
  },
  {
    title: 'Workspace Routes: CRUD with Hierarchy Support',
    description: 'GET/POST workspaces mit parent_id Hierarchie, PUT für Rename/Move-Operations, DELETE mit Cascade-Handling (Child-Workspaces an Grandparent verschieben), Sidebar DnD Support (v1.4.0+).',
    file_path: 'backend/routes/workspace.js',
    line_start: 1,
    line_end: 80,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 2'
  },
  {
    title: 'Todo Routes: Full CRUD with Multi-Step Support',
    description: 'GET todos mit status/workspace filtering, POST new todo mit schritte JSON Array, PUT updates mit priority/status/erledigt_at für Leaderboard-Tracking, DELETE with cascade.',
    file_path: 'backend/routes/todos.js',
    line_start: 1,
    line_end: 100,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 3'
  },
  {
    title: 'Calendar Routes: Event Management with DnD',
    description: 'GET/POST events mit start_datum/end_datum, PUT updates mit Drag-Drop-Support (v1.6.0+), Time-grid snapping (5-Min-Intervalle), All-day events, Recurrence-Patterns (täglich/wöchentlich/monatlich).',
    file_path: 'backend/routes/kalender.js',
    line_start: 1,
    line_end: 120,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 3'
  },
  {
    title: 'Notes Routes: Markdown Editor with Folders',
    description: 'GET/POST notizen mit markdown-unterstütztem inhalt, Color-coded notes (8 Farben), Folder-organisation (ordner), Cross-linking zu todos/events, Live-Markdown-Preview (v0.2.0+).',
    file_path: 'backend/routes/notizen.js',
    line_start: 1,
    line_end: 100,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 3'
  },
  {
    title: 'Dashboard Widgets: CRUD + DnD Order Management',
    description: 'GET widgets ordered by position, POST new widget mit type+config JSON, PUT /widgets/order für Drag-Drop-Reordering, PUT widget config updates, DELETE widget. Supports Stats/Tasks/Pomodoro/Calendar/Weather.',
    file_path: 'backend/routes/dashboard_widgets.js',
    line_start: 1,
    line_end: 91,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 4'
  },
  {
    title: 'Weather Widget: Open-Meteo Integration with Autocomplete',
    description: 'GET /dashboard/widgets/weather/data für Stadt-Wetter-Daten, Open-Meteo Geocoding API (kostenlos, kein Key), Autocomplete-Suggestions mit Stadt/Region, Temperature+Condition Display mit Icons.',
    file_path: 'backend/routes/dashboard_widgets.js',
    line_start: 75,
    line_end: 91,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'medium',
    phase: 'Phase 4'
  },
  {
    title: 'Habit Tracker: CRUD with Streaks & Completion Logs',
    description: 'GET/POST habits mit name/icon/color/interval_days, PUT für Active/Pause-Status, DELETE mit cascade zu habit_logs, Completion-Logging mit erledigt-Flag und Timestamp.',
    file_path: 'backend/routes/habits.js',
    line_start: 1,
    line_end: 80,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 5'
  },
  {
    title: 'Pomodoro Timer: Session CRUD + Global State Management',
    description: 'POST new pomodoro_session (25 Min), PUT zum Stoppen mit duration_seconds, localStorage für globalen Timer-State, stopGlobalTimer() vor Logout, Seitenwechsel-Persistierung.',
    file_path: 'backend/routes/pomodoro.js',
    line_start: 1,
    line_end: 60,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 5'
  },
  {
    title: 'Time Tracking: Hours Logging + Leaderboard Integration',
    description: 'POST time_entry (start_time, end_time, auto-duration), GET entries mit date-filtering für Leaderboard, completed_at-Timestamp für tägliches Tracking, Validierung (0-86400 Sekunden).',
    file_path: 'backend/routes/zeit.js',
    line_start: 1,
    line_end: 70,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 5'
  },
  {
    title: 'Leaderboard: Points Calculation & User Rankings',
    description: 'GET /api/leaderboard mit user points (todos + pomodoros + time-tracking), Aggregation von completed todos (erledigt_at), Pomodoro-Summen, Zeit-Summen, User-Ranking nach Punkten.',
    file_path: 'backend/routes/leaderboard.js',
    line_start: 1,
    line_end: 80,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'high',
    phase: 'Phase 5'
  },
  {
    title: 'Bug Report System: Kanban Board with Status Updates',
    description: 'POST bug_report mit titel/beschreibung/seite, PUT zum Verschieben zwischen Status (offen/in_progress/done), DELETE für Admin-only, Real-time Status-Count pro Spalte.',
    file_path: 'backend/routes/bugs.js',
    line_start: 1,
    line_end: 90,
    action_type: 'add',
    assignee: 'jaro',
    status: 'done',
    priority: 'medium',
    phase: 'Phase 5'
  },
  {
    title: 'Development Tasks API: Full CRUD Implementation',
    description: 'GET /development-tasks mit Filterung (assignee/status/phase/search), POST new task mit file-validation, PUT updates, DELETE task, GET stats/summary für Dashboard.',
    file_path: 'backend/routes/development-tasks.js',
    line_start: 1,
    line_end: 150,
    action_type: 'add',
    assignee: 'jaro',
    status: 'open',
    priority: 'high',
    phase: 'Phase 6'
  },
  {
    title: 'Entwicklungsplan: Dynamic Task Display from API',
    description: 'Lade Tasks dynamisch von /api/development-tasks, Gruppierung nach Phase/Assignee/Status, Code-Snippets mit Syntax-Highlighting, Suche/Filter-Funktionalität, Expandable Code-Snippets.',
    file_path: 'frontend/views/entwicklungsplan.ejs',
    line_start: 1,
    line_end: 100,
    action_type: 'modify',
    assignee: 'jaro',
    status: 'open',
    priority: 'high',
    phase: 'Phase 6'
  },
  {
    title: 'Dev Tasks Admin Panel: Create/Edit/Delete Tasks',
    description: 'Form zum Erstellen von Aufgaben (title/description/file_path/line_start/line_end/action_type/assignee/priority/phase), Code-Preview beim Ausfüllen, Task-Liste mit Edit/Delete-Buttons, Statistiken-Tab.',
    file_path: 'frontend/views/dev-tasks-admin.ejs',
    line_start: 1,
    line_end: 150,
    action_type: 'add',
    assignee: 'jaro',
    status: 'open',
    priority: 'high',
    phase: 'Phase 6'
  }
];

try {
  const insert = db.prepare(`
    INSERT INTO development_tasks 
    (title, description, file_path, line_start, line_end, action_type, assignee, status, priority, phase, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
  `);

  const tx = db.transaction(() => {
    for (const task of tasks) {
      insert.run(
        task.title,
        task.description,
        task.file_path,
        task.line_start || null,
        task.line_end || null,
        task.action_type,
        task.assignee,
        task.status,
        task.priority,
        task.phase
      );
    }
  });

  tx();
  console.log(`✅ ${tasks.length} development tasks seeded successfully!`);
} catch (err) {
  console.error('Error seeding development tasks:', err);
}
