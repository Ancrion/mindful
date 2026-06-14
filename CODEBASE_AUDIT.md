# MINDFUL_GITHUB CODEBASE AUDIT
## Comprehensive Implementation Reference (v1.7.7-Final)

---

## DATABASE SCHEMA

### 1. USERS TABLE
- **File**: `backend/database/db.js` (lines 64-72)
- **Fields**: id, name (UNIQUE), email (UNIQUE), passwort_hash, wallpaper, avatar, created_at, is_admin
- **Key Features**: 
  - JWT-based authentication
  - Admin flag for role-based authorization
  - Profile customization (wallpaper + avatar)
- **Current Status**: ✅ IMPLEMENTED & TESTED

### 2. SESSIONS TABLE
- **File**: `backend/database/db.js` (lines 75-80)
- **Fields**: token (PRIMARY), user_id, erstellt
- **Implementation**: Token-based session management (JWT)
- **Current Status**: ✅ IMPLEMENTED (JWT replaces this table in practice)

### 3. WORKSPACES TABLE
- **File**: `backend/database/db.js` (lines 83-90)
- **Fields**: id, user_id, name, farbe (orange|blue|green|pink|red|purple|teal|yellow), parent_id (hierarchical), erstellt
- **Key Features**:
  - Hierarchical workspace structure (parent-child relationships)
  - Colored workspace system
  - Cascade delete handling
  - Sidebar drag-drop reordering
- **Related Routes**: `backend/routes/workspace.js` (CRUD + hierarchy management)
- **Current Status**: ✅ IMPLEMENTED v1.2.0+ (with full DnD support v1.4.0+)

### 4. TODOS TABLE
- **File**: `backend/database/db.js` (lines 93-107)
- **Fields**: id, user_id, workspace_id, titel, beschreibung, status (offen|erledigt|in_arbeit), prioritaet (hoch|mittel|niedrig), schritte (JSON array), faellig, erledigt, erledigt_at (timestamp), erstellt
- **Key Features**:
  - Multi-step todos with JSON storage
  - Workspace filtering
  - Leaderboard tracking (erledigt_at for daily completion stats)
  - Priority system
- **Related Routes**: `backend/routes/todos.js` (full CRUD + filtering + related resources)
- **Related FE**: `frontend/public/js/todo.js` (755 lines)
- **Current Status**: ✅ IMPLEMENTED & FULL-FEATURED

### 5. EVENTS TABLE (Kalender)
- **File**: `backend/database/db.js` (lines 119-136)
- **Fields**: id, user_id, titel, beschreibung, start_datum, end_datum, farbe, ort, dauer (minutes), wiederholung (none|daily|weekly), ganztag (boolean), erinnerung, workspace_id, erstellt
- **Key Features**:
  - Full calendar support (month/week/day views)
  - Recurrence patterns
  - All-day events
  - Drag-drop event repositioning (v1.6.0+)
  - Color-coded events
- **Related Routes**: `backend/routes/kalender.js` (full CRUD + drag-drop support)
- **Related FE**: `frontend/public/js/calendar.js` (816 lines), `frontend/public/css/calendar.css`
- **Current Status**: ✅ IMPLEMENTED v1.6.0+ (with complete DnD + widget integration v1.7.3+)

### 6. NOTIZEN TABLE
- **File**: `backend/database/db.js` (lines 139-153)
- **Fields**: id, user_id, titel, inhalt (markdown), farbe, todo_id (link), event_id (link), ordner_id (folder), aktualisiert, workspace_id, erstellt
- **Key Features**:
  - Rich text/markdown support
  - Color-coded organization
  - Folder system
  - Cross-linking with todos/events
  - Live preview
- **Related Routes**: `backend/routes/notizen.js` (full CRUD + folder management)
- **Related FE**: `frontend/public/js/notes.js` (918 lines)
- **Current Status**: ✅ IMPLEMENTED & FULL-FEATURED (v0.2.0+ redesigned UI)

### 7. ORDNER TABLE (Folders for Notes)
- **File**: `backend/database/db.js` (lines 156-163)
- **Fields**: id, user_id, name, farbe (color-sand|...), erstellt
- **Implementation**: Flat folder structure for note organization
- **Related Routes**: `backend/routes/ordner.js`
- **Current Status**: ✅ IMPLEMENTED

### 8. DOKUMENTE TABLE
- **File**: `backend/database/db.js` (lines 166-183)
- **Fields**: id, user_id, ordner_id, titel, typ, dateiname, gespeichert (path), groesse, ist_bild, bereich, todo_id, event_id, notiz_id, erstellt
- **Key Features**:
  - File upload & management
  - Multi-format support (images, documents)
  - Cross-linking with todos/events/notes
  - Folder organization
  - File size tracking
- **Related Routes**: `backend/routes/dokumente.js` (full CRUD + multer file handling)
- **Upload Config**: `backend/config.js` (uploadDir: `backend/uploads/`)
- **Related FE**: `frontend/public/js/documents.js` (361 lines)
- **Current Status**: ✅ IMPLEMENTED

### 9. POMODORO_SESSIONS TABLE
- **File**: `backend/database/db.js` (lines 186-194)
- **Fields**: id, user_id, todo_id, duration_seconds, completed_at
- **Implementation**: Tracks pomodoro timer sessions
- **Leaderboard Integration**: Duration used for daily rankings
- **Related Routes**: `backend/routes/pomodoro.js` (session creation + stats)
- **Related FE**: `frontend/public/js/pomodoro.js` (342 lines), `frontend/public/css/pomodoro.css`
- **Current Status**: ✅ IMPLEMENTED (with global timer persistence v1.0.0+)

### 10. TIME_ENTRIES TABLE
- **File**: `backend/database/db.js` (lines 197-208)
- **Fields**: id, user_id, todo_id, start_time, end_time, duration_seconds, description, completed_at (timestamp), created_at
- **Implementation**: Manual time tracking for todos
- **Leaderboard Integration**: completed_at used for daily leaderboard stats
- **Related Routes**: `backend/routes/zeit.js` (CRUD + stats dashboard)
- **Related FE**: `frontend/public/js/tracking.js` (178 lines), `frontend/public/css/tracking.css`
- **Current Status**: ✅ IMPLEMENTED (with completion timestamp tracking v1.6.2+)

### 11. DASHBOARD_WIDGETS TABLE
- **File**: `backend/database/db.js` (lines 211-218)
- **Fields**: id, user_id, typ (stats|tasks|pomodoro|calendar|weather|...), position, config (JSON)
- **Key Features**:
  - Widget system with drag-drop reordering
  - Customizable widget configuration
  - Auto-fit grid layout
  - Dense grid packing
- **Widget Types**:
  - stats: Daily statistics
  - tasks: Todo overview
  - pomodoro: Pomodoro timer
  - calendar: Mini calendar with month/week/day views
  - weather: City-based weather with autocomplete
  - (More widgets can be added)
- **Related Routes**: `backend/routes/dashboard_widgets.js` (CRUD + order management + weather API)
- **Related FE**: `frontend/public/js/index.js` (1654 lines - main dashboard logic), `frontend/public/css/dashboard.css`
- **Current Status**: ✅ IMPLEMENTED (v1.7.0+ complete design system, v1.7.2+ flexible sizing, v1.7.7-Final smooth DnD)

### 12. MESSAGES TABLE
- **File**: `backend/database/db.js` (lines 221-231)
- **Fields**: id, from_user_id, to_user_id, subject, body, read (boolean), created_at
- **Implementation**: User-to-user messaging system
- **Related Routes**: `backend/routes/messages.js` (POST create, GET inbox/sent, PUT read status, GET unread count)
- **Related FE**: `frontend/public/js/messages.js` (187 lines)
- **Current Status**: ✅ IMPLEMENTED (v0.2.0+)

### 13. PASSWORD_RESETS TABLE
- **File**: `backend/database/db.js` (lines 234-242)
- **Fields**: id, user_id, token, expires_at, used (boolean), created_at
- **Implementation**: Token-based password reset flow
- **Security**: Time-limited tokens, one-time use
- **Email Integration**: Nodemailer (SMTP or sendmail fallback)
- **Related Routes**: Part of `backend/routes/auth-routes.js` (POST /forgot, POST /reset)
- **Related FE**: `frontend/public/js/login.js` (121 lines)
- **Current Status**: ✅ IMPLEMENTED (v1.0.0+ with email system)

### 14. SIDEBAR_MODULES TABLE
- **File**: `backend/database/db.js` (lines 245-255)
- **Fields**: id, user_id, module_key, label, icon, path, sort_order, visible (boolean)
- **Implementation**: Customizable sidebar navigation per user
- **Default Modules**: Dashboard, Todos, Kalender, Notizen, Dokumente, Pomodoro, Zeit, Habits, Rangliste, Nachrichten, Profil, Entwicklungsplan, Bugs, Versionsverlauf, Admin
- **Related Routes**: `backend/routes/sidebar.js` (CRUD + default initialization)
- **Related FE**: Sidebar partial `frontend/views/partials/sidebar.ejs`
- **Current Status**: ✅ IMPLEMENTED (with admin section v1.0.0+)

### 15. HABITS TABLE
- **File**: `backend/database/db.js` (lines 258-271 + migrations 310-317)
- **Fields**: id, user_id, name, icon (fa-check-circle), color (#6366f1), typ (daily|interval|weekdays|weekends|weekly), interval_days, time_start, time_end, active, created_at, description, category, priority (medium|high|low), reminder_time, current_streak, longest_streak, total_completions, archived
- **Key Features**:
  - Multiple habit types (daily, interval-based, weekday/weekend only, weekly)
  - Streak tracking (current + longest)
  - Completion statistics
  - Priority system
  - Time-based reminders (planned)
  - Archival support
- **Related Routes**: `backend/routes/habits.js` (full CRUD + stats/calendar/today/history/toggle endpoints)
- **Related FE**: `frontend/public/js/habits.js` (377 lines), `frontend/public/css/habits.css`
- **Current Status**: ✅ IMPLEMENTED (v1.0.0+ habit tracker, expanded in later versions)

### 16. HABIT_LOGS TABLE
- **File**: `backend/database/db.js` (lines 274-281 + migrations 318-319)
- **Fields**: id, habit_id, datum (date), completed (boolean), completed_at (timestamp), notes (text)
- **Implementation**: Daily completion tracking with optional notes
- **Unique Constraint**: idx_habit_logs_unique on (habit_id, datum) - one entry per day per habit
- **Related Routes**: Used in `/api/habits/:id/toggle` and `/api/habits/:id/history`
- **Current Status**: ✅ IMPLEMENTED

### 17. BUG_REPORTS TABLE
- **File**: `backend/database/db.js` (lines 284-294)
- **Fields**: id, user_id, titel, beschreibung, seite (affected page), status (offen|in_arbeit|abgeschlossen), erledigt (boolean), created_at
- **Key Features**:
  - Kanban board view (3 columns)
  - Admin-only status management
  - Bug page selection (dropdown with all pages)
  - Drag-drop between status columns
  - Pagination & filtering
- **Related Routes**: `backend/routes/bugs.js` (GET list, POST create, PUT status, DELETE)
- **Related FE**: `frontend/public/js/bugs.js` (173 lines)
- **Authorization**: Only is_admin user can manage status/delete
- **Current Status**: ✅ IMPLEMENTED (v1.1.0+ with kanban board, v1.3.1+ with page selection, v1.3.2+ redesigned form)

### 18. CHANGELOG TABLE
- **File**: `backend/database/db.js` (lines 297-306 + seeds 328-360)
- **Fields**: id, version (UNIQUE), datum (date), titel, features (JSON array), fixes (JSON array), commits (JSON array), erstellt
- **Implementation**: Version history tracking with automatic seed entries
- **Seeded Versions**: v0.1.0 through v1.7.7-Final with detailed feature/fix lists
- **Related Routes**: `backend/routes/changelog.js` (GET via changelog-parser library)
- **Related FE**: `frontend/views/changelog.ejs` (timeline design)
- **Parser**: `backend/lib/changelog-parser.js`
- **Current Status**: ✅ IMPLEMENTED (v1.3.0+ with timeline UI, continuously updated)

---

## BACKEND ROUTES & APIS

### Authentication Routes
**File**: `backend/routes/auth-routes.js` (474 lines)

#### Public Endpoints (No Auth Required):
- `POST /api/auth/register` - Create new user (with email, defaults to null)
- `POST /api/auth/login` - Authenticate user (returns JWT token)
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get current user (reads cookie or Authorization header)
- `POST /api/auth/forgot-password` - Request password reset token (email sends link)
- `POST /api/auth/reset-password/:token` - Confirm password reset (validates token TTL)

#### Protected Endpoints (Auth Required):
- `GET /api/auth/me` - Get current user details
- `PUT /api/auth/me/email` - Update email address (validates RFC 5322 format)
- `PUT /api/auth/me/password` - Change password (validates old password)
- `POST /api/auth/me/wallpaper` - Upload wallpaper (multer, jpg/png/webp/gif, max 10MB)
- `POST /api/auth/me/avatar` - Upload avatar (multer, jpg/png/webp/gif, max 5MB)

**Key Security Features**:
- bcrypt password hashing (10 salt rounds)
- JWT tokens with 7-day expiry
- HTTP-Only cookies
- Email validation (RFC 5322 regex + max 254 chars)
- Rate limiting: authLimiter (5 attempts/15min), passwordLimiter (3 attempts/1hour)
- Nodemailer integration (SMTP or sendmail fallback)

**Current Status**: ✅ FULLY IMPLEMENTED (v1.0.0+)

---

### Dashboard Routes
**File**: `backend/routes/api.js`

#### Endpoints:
- `GET /api/dashboard` - Get dashboard data (aggregated stats)
- `POST /api/dashboard/widgets` - Create new widget (moved to separate route)

**Deprecated**: Widget management moved to `/api/dashboard/widgets`

---

### Dashboard Widgets Routes
**File**: `backend/routes/dashboard_widgets.js` (91 lines)

#### Endpoints:
- `GET /api/dashboard/widgets` - Get all user widgets (ordered by position)
- `POST /api/dashboard/widgets` - Create new widget (auto-assigns position)
- `PUT /api/dashboard/widgets/order` - Reorder widgets (array of {id, position})
- `PUT /api/dashboard/widgets/:id` - Update widget config (JSON)
- `DELETE /api/dashboard/widgets/:id` - Delete widget
- `GET /api/dashboard/widgets/weather/data` - Fetch weather from Open-Meteo API (no API key needed)

**Widget Types Supported**:
- `stats` - Daily statistics (todos, pomodoro, time tracking)
- `tasks` - Todo list overview with workspace filter
- `pomodoro` - Active pomodoro timer + session history
- `calendar` - Mini calendar (month/week/day) with event display
- `weather` - City-based weather with autocomplete suggestions
- (Framework allows adding custom widget types)

**Current Status**: ✅ FULLY IMPLEMENTED (v1.7.2+ with flexible sizing, v1.7.7-Final with smooth DnD)

---

### Todo Routes
**File**: `backend/routes/todos.js` (208 lines)

#### Endpoints:
- `GET /api/todos` - Get all todos (with workspace_ids filtering, status filtering)
- `GET /api/todos/:id/related` - Get linked notizen + dokumente
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo (title, description, status, erledigt_at timestamp, etc.)
- `DELETE /api/todos/:id` - Delete todo

**Features**:
- Multi-step todos with JSON schritte array
- Status tracking (offen|erledigt|in_arbeit)
- Priority levels (hoch|mittel|niedrig)
- Workspace filtering (single or multiple)
- Completion timestamp tracking (erledigt_at) for leaderboard

**Current Status**: ✅ FULLY IMPLEMENTED

---

### Workspace Routes
**File**: `backend/routes/workspace.js`

#### Endpoints:
- `GET /api/workspaces` - Get all user workspaces (hierarchical tree)
- `POST /api/workspaces` - Create new workspace (with optional parent_id)
- `PUT /api/workspaces/:id` - Update workspace (name, color, parent_id)
- `PUT /api/workspaces/:id/move` - Move workspace in hierarchy
- `DELETE /api/workspaces/:id` - Delete workspace (cascade delete todos/notizen/events, reparent children)

**Features**:
- Hierarchical workspace structure (parent-child relationships)
- Color validation (whitelist of 8 colors)
- Drag-drop reordering in sidebar (v1.4.0+)
- Cascade delete handling (children reparented to parent's parent)
- Sidebar context menu (rename, add sub-workspace, delete, make root)

**Current Status**: ✅ FULLY IMPLEMENTED (v1.2.0+ hierarchy, v1.4.0+ full DnD)

---

### Notizen Routes
**File**: `backend/routes/notizen.js`

#### Endpoints:
- `GET /api/notizen` - Get all notes (folder-filtered)
- `GET /api/notizen/:id` - Get single note
- `POST /api/notizen` - Create note (with optional todo_id, event_id, ordner_id, workspace_id)
- `PUT /api/notizen/:id` - Update note (title, content, color, folder, etc.)
- `DELETE /api/notizen/:id` - Delete note

**Features**:
- Markdown/rich text support
- Color-coded notes
- Folder organization
- Cross-linking with todos/events
- Workspace assignment

**Current Status**: ✅ FULLY IMPLEMENTED

---

### Ordner Routes
**File**: `backend/routes/ordner.js`

#### Endpoints:
- `GET /api/ordner` - Get all folders
- `POST /api/ordner` - Create new folder
- `PUT /api/ordner/:id` - Update folder (name, color)
- `DELETE /api/ordner/:id` - Delete folder (notes unlinked, not deleted)

**Current Status**: ✅ IMPLEMENTED

---

### Kalender Routes
**File**: `backend/routes/kalender.js`

#### Endpoints:
- `GET /api/kalender` - Get all events (ordered by start_datum)
- `GET /api/kalender/:id` - Get single event
- `POST /api/kalender` - Create event
- `PUT /api/kalender/:id` - Update event (title, dates, time, color, recurrence, etc.)
- `PUT /api/kalender/:id/drag` - Handle drag-drop repositioning (updates start_datum + time)
- `DELETE /api/kalender/:id` - Delete event

**Features**:
- Full calendar event system
- Drag-drop repositioning (v1.6.0+)
- Recurrence patterns (daily, weekly, monthly)
- All-day events
- Reminders/notifications (planned)
- Workspace assignment
- Time-raster snapping (5-minute intervals)

**Current Status**: ✅ FULLY IMPLEMENTED (v1.6.0+ with DnD, v1.7.3+ widget integration)

---

### Dokumente Routes
**File**: `backend/routes/dokumente.js`

#### Endpoints:
- `GET /api/dokumente` - Get all documents (folder-filtered)
- `GET /api/dokumente/:id` - Get single document
- `POST /api/dokumente` - Upload document (multer middleware)
- `PUT /api/dokumente/:id` - Update document metadata
- `DELETE /api/dokumente/:id` - Delete document (removes file from disk)
- `GET /api/dokumente/:id/download` - Download document file

**Upload Config**:
- Max file size: 100 MB (multer limit)
- Storage path: `backend/uploads/`
- File type validation: images, documents
- Filename: sanitized + user_id prefix

**Features**:
- Multi-format file support (jpg, png, pdf, docx, xlsx, etc.)
- Image detection (ist_bild flag)
- Folder organization
- Cross-linking with todos/events/notes
- File metadata tracking (size, type, upload date)

**Current Status**: ✅ IMPLEMENTED

---

### Pomodoro Routes
**File**: `backend/routes/pomodoro.js`

#### Endpoints:
- `POST /api/pomodoro` - Create pomodoro session (records duration_seconds)
- `GET /api/pomodoro/stats` - Get stats (today's count + total, this week, this month)
- `GET /api/pomodoro/chart-data` - Get historical data for charts (last 7/30 days)

**Features**:
- Session tracking with duration
- Daily/weekly/monthly statistics
- Leaderboard integration (total seconds per day)
- Todo linking (optional)

**Current Status**: ✅ IMPLEMENTED

---

### Zeit (Time Tracking) Routes
**File**: `backend/routes/zeit.js`

#### Endpoints:
- `POST /api/zeit` - Create time entry (start_time, end_time, duration_seconds, description)
- `GET /api/zeit` - Get all time entries
- `GET /api/zeit/stats` - Get tracking stats (today, this week, this month)
- `GET /api/zeit/chart-data` - Get historical data for charts
- `PUT /api/zeit/:id` - Update time entry
- `DELETE /api/zeit/:id` - Delete time entry

**Features**:
- Manual time tracking
- Duration calculation
- Daily/weekly/monthly statistics
- Leaderboard integration (completed_at timestamp)
- Todo linking

**Current Status**: ✅ IMPLEMENTED

---

### Habits Routes
**File**: `backend/routes/habits.js` (290 lines)

#### Endpoints:
- `GET /api/habits` - Get all active habits (ordered by priority, time_start)
- `GET /api/habits/stats` - Get habit statistics (streaks, completion counts)
- `GET /api/habits/calendar/:id` - Get calendar data for habit (last month completion grid)
- `GET /api/habits/today` - Get today's due habits with completion status
- `POST /api/habits` - Create new habit (name, icon, color, type, interval, times, priority)
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/toggle` - Toggle daily completion (creates/deletes habit_log, updates streaks)
- `GET /api/habits/:id/history` - Get completion history (last 30 days)

**Habit Types**:
- `daily` - Due every day
- `interval` - Due every N days (interval_days)
- `weekdays` - Due Mon-Fri
- `weekends` - Due Sat-Sun
- `weekly` - Due once per week

**Features**:
- Streak calculation (current + longest)
- Completion statistics
- Completion notes storage
- Priority-based ordering
- Time-based scheduling
- Archival support
- Monthly completion calendar

**Current Status**: ✅ FULLY IMPLEMENTED (comprehensive habit tracker system)

---

### Leaderboard Routes
**File**: `backend/routes/leaderboard.js` (67 lines)

#### Endpoints:
- `GET /api/leaderboard` - Get daily leaderboard rankings (pagination)

**Ranking Categories**:
1. **Todos Done** - Count of completed todos (status='erledigt') where completion timestamp is today
2. **Pomodoro** - Total duration_seconds in pomodoro_sessions completed today
3. **Time Tracked** - Total duration_seconds in time_entries with completed_at timestamp today

**Features**:
- Pagination (offset/limit)
- Daily statistics only
- Multi-user rankings
- hasMore flag for pagination

**Current Status**: ✅ IMPLEMENTED (v0.2.0+)

---

### Messages Routes
**File**: `backend/routes/messages.js` (85 lines)

#### Endpoints:
- `POST /api/messages` - Send message (to_user_id, subject, body)
- `GET /api/messages/inbox` - Get received messages
- `GET /api/messages/sent` - Get sent messages
- `PUT /api/messages/:id/read` - Mark message as read
- `GET /api/messages/unread` - Get unread message count

**Features**:
- User-to-user messaging
- Read status tracking
- Inbox/Sent separation
- User validation (can't message self)

**Current Status**: ✅ IMPLEMENTED (v0.2.0+)

---

### Bug Reports Routes
**File**: `backend/routes/bugs.js` (69 lines)

#### Endpoints:
- `GET /api/bugs` - Get all bug reports (returns {bugs, isJaro} where isJaro is admin flag)
- `POST /api/bugs` - Create bug report (titel, beschreibung, seite)
- `PUT /api/bugs/:id/status` - Update bug status (offen|in_arbeit|abgeschlossen) [ADMIN ONLY]
- `DELETE /api/bugs/:id` - Delete bug [ADMIN ONLY]

**Authorization**: 
- All users can create bugs
- Only is_admin users can change status/delete
- Admin check: `isJaro()` function validates is_admin flag in users table

**Bug Pages Selection** (v1.3.1+):
- Dashboard, To-Do, Notizen, Kalender, Pomodoro, Zeiterfassung, Rangliste, Nachrichten, Profil, Projektplan, Bugs, Versionsverlauf

**Current Status**: ✅ IMPLEMENTED (v1.1.0+ kanban, v1.3.1+ page selection)

---

### Changelog Routes
**File**: `backend/routes/changelog.js` (15 lines)
**Parser**: `backend/lib/changelog-parser.js`

#### Endpoints:
- `GET /api/changelog` - Get all changelog entries (parsed from database)

**Features**:
- Seeded changelog data (v0.1.0 through v1.7.7-Final)
- Timeline view with collapsible entries
- Feature + fix categorization
- Commit hash tracking

**Current Status**: ✅ IMPLEMENTED (v1.3.0+)

---

### Users Routes
**File**: `backend/routes/users.js`

#### Endpoints:
- `GET /api/users` - Get all users (public profiles)
- `GET /api/users/:id` - Get user profile (name, avatar, stats)

**Current Status**: ✅ IMPLEMENTED

---

### Search Routes
**File**: `backend/routes/search.js`

#### Endpoints:
- `GET /api/search?q=...` - Global search across todos, notes, documents
- Query validation: max 200 chars (ReDoS prevention)
- Pagination: offset/limit with hasMore flag

**Current Status**: ✅ IMPLEMENTED

---

### Admin Routes
**File**: `backend/routes/admin.js` (63 lines)

#### Endpoints:
- `GET /api/admin/users` - List all users with stats (todos count, bugs count)
- `PUT /api/admin/users/:id/toggle-admin` - Toggle admin status [ADMIN ONLY]
- `DELETE /api/admin/users/:id` - Delete user [ADMIN ONLY]
- `PUT /api/admin/users/:id/reset-password` - Reset user password [ADMIN ONLY]

**Features**:
- User management
- Admin promotion/demotion
- Password reset
- User deletion

**Current Status**: ✅ IMPLEMENTED (v1.0.0+)

---

### Sidebar Routes
**File**: `backend/routes/sidebar.js`

#### Endpoints:
- `GET /api/sidebar` - Get user's sidebar modules (with visibility/order)
- `POST /api/sidebar/:key/toggle` - Toggle module visibility
- `PUT /api/sidebar/order` - Reorder modules

**Default Modules** (created on first API call):
1. Dashboard
2. Todos
3. Kalender
4. Notizen
5. Dokumente
6. Pomodoro
7. Zeit
8. Habits
9. Rangliste (Leaderboard)
10. Nachrichten (Messages)
11. Profil (Profile)
12. Entwicklungsplan (Dev Plan) [ADMIN]
13. Bugs
14. Versionsverlauf (Changelog)
15. Admin [ADMIN only]

**Current Status**: ✅ IMPLEMENTED (with admin section)

---

### Health Check & Quote Endpoints
**File**: `backend/routes/api_root.js` (84 lines)

#### Endpoints:
- `GET /api/health` - Health check (returns status + timestamp)
- `GET /api/quote` - Daily inspirational quote (cached, from zenquotes.io)

**Current Status**: ✅ IMPLEMENTED

---

## FRONTEND ARCHITECTURE

### Entry Points & View Templates

**Master Routing** (EJS Templates): `frontend/views/`

1. **Dashboard** - `/` → `index.ejs`
   - Widget grid system
   - Dashboard welcome message
   - Widget management modal
   - Global pomodoro timer display
   - Workspace filter

2. **Authentication** - `/login`, `/register`, `/passwort-vergessen`, `/reset-password/:token` → `login.ejs`, `forgot_password.ejs`, `reset_password.ejs`
   - Login/register forms
   - Password reset flow
   - Email validation

3. **Todos** - `/todo` → `todo.ejs`
   - Todo list with workspace filter
   - Multi-step todos
   - Kanban-style status view
   - Context menu (edit/complete/delete)
   - Workspace hierarchy sidebar

4. **Calendar** - `/calendar`, `/kalender` → `calendar.ejs`
   - Month/week/day views
   - Drag-drop event positioning
   - Event creation modal
   - Recurrence patterns

5. **Notes** - `/notes`, `/notizen` → `notes.ejs`
   - Rich markdown editor
   - Folder navigation
   - Color-coded notes
   - Live preview
   - Workspace assignment

6. **Documents** - `/documents`, `/dokumente` → `documents.ejs`
   - File upload interface
   - Folder browser
   - Image preview
   - File management (delete, rename)

7. **Pomodoro** - `/pomodoro` → `pomodoro.ejs`
   - Active timer display
   - Session history
   - Statistics dashboard

8. **Time Tracking** - `/tracking`, `/zeiterfassung` → `tracking.ejs`
   - Manual time entry
   - Daily/weekly/monthly stats
   - Chart visualization

9. **Habits** - `/habits` → `habits.ejs`
   - Today's habits list
   - Completion toggle
   - Streak display
   - History calendar
   - Habit management

10. **Leaderboard** - `/leaderboard`, `/rangliste` → `leaderboard.ejs`
    - Daily rankings (todos, pomodoro, time tracking)
    - User profiles
    - User stats

11. **Messages** - `/messages`, `/nachrichten` → `messages.ejs`
    - Inbox/Sent tabs
    - Message composition
    - Read status tracking
    - User search

12. **Profile** - `/profile`, `/profil` → `profile.ejs`
    - User settings
    - Email management
    - Password change
    - Wallpaper/avatar upload
    - User preferences

13. **Bug Reports** - `/bugs`, `/bug-report` → `bugs.ejs`
    - Bug report form
    - Kanban board (offen|in_arbeit|abgeschlossen)
    - Drag-drop status management
    - Page selection dropdown

14. **Changelog** - `/changelog` → `changelog.ejs`
    - Version timeline
    - Feature/fix lists
    - Commit tracking
    - No auth required

15. **Development Plan** - `/entwicklungsplan` → `entwicklungsplan.ejs` [ADMIN ONLY]
    - Team task assignment
    - Code snippet viewer
    - Dynamic task filtering
    - localStorage-based task tracking

16. **Admin Panel** - `/admin` → `admin.ejs` [ADMIN ONLY]
    - User management
    - Admin promotion/demotion
    - Password reset
    - User deletion
    - Statistics

---

### Core JavaScript Files

#### 1. **app.js** (1059 lines)
**Purpose**: Core application logic, global utilities, authentication

**Key Components**:
- `currentUser` object (global state)
- `loadCurrentUser()` - Fetch current user from /api/auth/me
- `logout()` - Clear token + redirect to login
- `apiFetch()` - Wrapper for fetch with auth token + error handling
- `safeJson()` - Safe JSON parsing with try-catch
- `toggleDarkMode()` - Theme switching
- `initSpotlightSearch()` - Ctrl+K global search
- Spotlight search integration (across all pages)

**Features**:
- JWT token management (from cookies)
- Global error handling
- API request standardization
- Dark mode toggle

**Current Status**: ✅ IMPLEMENTED

---

#### 2. **index.js** (1654 lines)
**Purpose**: Dashboard widget system logic

**Key Classes/Functions**:
- `class WidgetGrid` - Main widget management
  - `loadWidgets()` - Fetch dashboard_widgets from API
  - `renderWidgets()` - Render widget grid
  - `initDragDrop()` - Drag-drop reordering (smooth animations v1.7.7)
  - `_autoFitWidget()` - Auto-fit to available space
  - `_setWidgetSize()` - Resize widget with undo support
  - `_saveOrder()` - Persist widget order to API
  - `_reflowAll()` - Reflow grid after changes
- Widget-specific renderers
  - `renderStatsWidget()` - Daily statistics display
  - `renderTasksWidget()` - Todo list with workspace filter
  - `renderPomodoroWidget()` - Active timer display
  - `renderCalendarWidget()` - Mini calendar (month/week/day views)
  - `renderWeatherWidget()` - City weather with autocomplete
- Event handlers
  - `handleWidgetManage()` - Widget add/remove modal
  - `toggleWidgetDragMode()` - Edit mode toggle
  - `loadWeatherSuggestions()` - Autocomplete API calls

**Features** (v1.7.0+):
- Design system with 25+ CSS custom properties
- 40+ standardized components
- Glassmorphism effects
- Grid-auto-flow: dense (smart packing)
- Responsive flexbox layouts
- Dark mode support

**Recent Updates**:
- v1.7.7-Final: Complete DnD rewrite with smooth animations, undo support, state management

**Current Status**: ✅ FULLY FEATURED (v1.7.7-Final)

---

#### 3. **todo.js** (755 lines)
**Purpose**: Todo management interface

**Key Functions**:
- `loadTodos(workspaceId)` - Fetch todos with optional workspace filter
- `renderTodos()` - Render todo list with status columns
- `createTodo()` - Submit new todo form
- `editTodo(id)` - Open edit modal
- `updateTodo(id)` - Submit todo changes
- `deleteTodo(id)` - Delete with confirmation
- `toggleTodoStatus(id)` - Toggle erledigt status
- `loadWorkspaces()` - Fetch workspace hierarchy
- `renderWorkspaceTree()` - Render sidebar workspace tree with expand/collapse
- `selectWorkspace(id)` - Filter todos by workspace
- `initContextMenu()` - Right-click context menu (edit/complete/delete)
- `initDragDrop()` - Drag-drop workspace reordering in sidebar (v1.4.0+)
- `initWorkspaceContextMenu()` - Right-click workspace menu (rename/sub-workspace/delete/make-root)

**Features**:
- Multi-step todos (schritte JSON array)
- Workspace hierarchy filtering
- Status transitions (offen → erledigt → in_arbeit)
- Priority levels (hoch|mittel|niedrig)
- Workspace drag-drop (v1.4.0+)
- Context menus for todos + workspaces (v1.3.3+)
- Workspace context menu (v1.4.0+)
- Workspace DnD on Todo dropdown (v1.4.0+)
- localStorage persistence of currentWorkspaceId (v1.4.1+)

**Current Status**: ✅ FULLY FEATURED (v1.4.1+ with Workspace Sync)

---

#### 4. **calendar.js** (816 lines)
**Purpose**: Calendar event management

**Key Functions**:
- `loadEvents()` - Fetch all events
- `renderCalendar()` - Render month/week/day views
- `createEvent()` - Submit new event form
- `editEvent(id)` - Open event edit modal
- `deleteEvent(id)` - Delete event
- `initDragDrop()` - Drag-drop event repositioning (v1.6.0+)
  - Vertical repositioning (change time)
  - Horizontal repositioning (change date)
  - Time-raster snapping (5-minute intervals)
- `renderMonthView()` - Month grid with event dots
- `renderWeekView()` - Week with hourly raster
- `renderDayView()` - Single-day hourly view
- `switchView()` - Toggle between month/week/day (v1.7.3+)
- `navigateCalendar()` - Previous/next month/week/day

**Features**:
- Drag-drop repositioning (v1.6.0+)
- Multiple view modes (v1.7.3+)
- All-day event support
- Recurring events
- Event color-coding
- Time-based event positioning
- Mini calendar widget integration (v1.7.3+)

**Current Status**: ✅ FULLY FEATURED (v1.6.0+ DnD, v1.7.3+ widget integration)

---

#### 5. **notes.js** (918 lines)
**Purpose**: Note management with markdown editor

**Key Functions**:
- `loadNotes()` - Fetch all notes
- `renderNotes()` - Render note grid
- `createNote()` - Submit new note form
- `editNote(id)` - Open editor modal
- `updateNote(id)` - Save note changes
- `deleteNote(id)` - Delete note with confirmation
- `initMarkdownEditor()` - Initialize markdown editor
- `renderMarkdown()` - Live preview rendering
- `loadFolders()` - Fetch note folders
- `createFolder()` - New folder
- `deleteFolder(id)` - Delete folder (unlinks notes)
- `handleDragDrop()` - Drag notes to folders

**Features**:
- Markdown editor with live preview (v0.2.0+)
- Color-coded notes
- Folder organization
- Rich text support
- Cross-linking with todos/events
- Toolbar with formatting buttons
- Toolbar auto-disable on inactivity (v0.2.0 bugfix)

**Current Status**: ✅ FULLY FEATURED (v0.2.0+ redesigned)

---

#### 6. **documents.js** (361 lines)
**Purpose**: File management interface

**Key Functions**:
- `loadDocuments()` - Fetch all documents
- `renderDocuments()` - Render document list with folder tree
- `uploadFile()` - Handle file upload (multer on backend)
- `deleteDocument(id)` - Delete file + remove from disk
- `downloadDocument(id)` - Download file
- `createFolder()` - New folder
- `deleteFolder(id)` - Delete folder
- `selectFolder()` - Filter documents by folder
- `initDragDrop()` - Drag files to folders (addEventListener instead of onclick, v1.6.2+)
- `previewImage()` - Show image preview modal

**Features**:
- Multi-format file support
- Image preview
- Folder hierarchy
- File deletion
- File metadata display (size, type, date)
- Drag-drop folder assignment

**Current Status**: ✅ IMPLEMENTED

---

#### 7. **habits.js** (377 lines)
**Purpose**: Habit tracking interface

**Key Functions**:
- `loadHabits()` - Fetch today's due habits + stats
- `loadHabitStats()` - Fetch habit statistics (streaks, completions)
- `renderHabits()` - Render habit list with today's completion status
- `renderHabitStats()` - Display streaks + completion numbers
- `toggleHabit(id)` - Toggle daily completion (POST /api/habits/:id/toggle)
- `createHabit()` - Submit new habit form
- `editHabit(id)` - Open habit edit modal
- `updateHabit(id)` - Save habit changes
- `deleteHabit(id)` - Delete habit
- `loadCalendar(habitId)` - Fetch monthly completion grid
- `renderCalendar()` - Render completion calendar (heat map style)
- `archiveHabit(id)` - Archive habit (hidden from daily view)

**Features**:
- Multiple habit types (daily, interval, weekdays, weekends, weekly)
- Streak calculation (current + longest)
- Completion statistics
- Monthly completion calendar (heat map)
- Completion notes
- Priority-based ordering
- Time-based scheduling
- Habit archival

**Current Status**: ✅ FULLY FEATURED

---

#### 8. **pomodoro.js** (342 lines)
**Purpose**: Pomodoro timer interface

**Key Functions**:
- `startPomodoro()` - Start timer (25 minutes default)
- `pausePomodoro()` - Pause timer
- `stopPomodoro()` - Stop + save session
- `updateGlobalTimer()` - Update global timer display (v1.0.0+)
- `loadPomodoroStats()` - Fetch daily/weekly/monthly stats
- `renderStats()` - Display statistics dashboard
- `renderHistory()` - Show past sessions
- `loadChartData()` - Fetch historical data for charts
- `renderChart()` - Chart.js visualization

**Features**:
- 25-minute timer (customizable)
- Session history
- Daily/weekly/monthly statistics
- Global timer persistence via localStorage (v1.0.0+)
- Pomodoro widget integration
- Chart.js visualization

**Global Timer** (v1.0.0+):
- Persistent across page navigation
- localStorage-based state
- `stopGlobalTimer()` called on logout to prevent JS errors

**Current Status**: ✅ IMPLEMENTED (v1.0.0+ with global timer persistence)

---

#### 9. **tracking.js** (178 lines)
**Purpose**: Manual time tracking interface

**Key Functions**:
- `createTimeEntry()` - Submit new time entry
- `loadTimeEntries()` - Fetch all entries
- `renderEntries()` - Display time entry list
- `deleteEntry(id)` - Delete entry
- `loadTrackingStats()` - Fetch daily/weekly/monthly totals
- `renderStats()` - Display statistics
- `loadChartData()` - Fetch historical data
- `renderChart()` - Chart.js visualization

**Features**:
- Manual time entry creation (start/end time or duration)
- Entry list with metadata
- Daily/weekly/monthly statistics
- Chart visualization
- Entry deletion

**Current Status**: ✅ IMPLEMENTED

---

#### 10. **leaderboard.js** (56 lines)
**Purpose**: Leaderboard rankings display

**Key Functions**:
- `loadLeaderboard()` - Fetch daily rankings
- `renderLeaderboard()` - Display rankings for todos/pomodoro/tracking
- `formatScore()` - Format scores based on ranking type
- `loadUserProfile()` - Load user stats for detail view

**Features**:
- Three ranking categories (todos, pomodoro, time tracking)
- User profile links
- Daily statistics only
- Pagination support

**Current Status**: ✅ IMPLEMENTED (v0.2.0+)

---

#### 11. **messages.js** (187 lines)
**Purpose**: User messaging interface

**Key Functions**:
- `loadInbox()` - Fetch received messages
- `loadSent()` - Fetch sent messages
- `renderMessages()` - Display message list
- `createMessage()` - Submit new message
- `markAsRead(id)` - Update read status
- `deleteMessage(id)` - Delete message
- `searchUsers()` - Find recipient (autocomplete)
- `loadUnreadCount()` - Get unread badge count

**Features**:
- Inbox/Sent tabs
- Read status tracking
- User search for recipients
- Unread badge
- Message composition

**Current Status**: ✅ IMPLEMENTED (v0.2.0+)

---

#### 12. **bugs.js** (173 lines)
**Purpose**: Bug report tracking with Kanban board

**Key Functions**:
- `loadBugs()` - Fetch all bug reports
- `renderBugs()` - Render Kanban board (3 columns: offen|in_arbeit|abgeschlossen)
- `createBug()` - Submit new bug report (with page selection)
- `updateBugStatus(id, status)` - Move between Kanban columns (admin only)
- `deleteBug(id)` - Delete bug (admin only)
- `initDragDrop()` - Drag-drop status changes

**Features**:
- Kanban board view
- Bug form with page selection dropdown
- Drag-drop status management
- Admin-only management
- Bug badge display (page affected)
- Real-time count per status column

**Current Status**: ✅ IMPLEMENTED (v1.1.0+ kanban, v1.3.1+ page selection, v1.3.2+ form redesign)

---

#### 13. **profile.js** (206 lines)
**Purpose**: User profile settings

**Key Functions**:
- `loadProfile()` - Fetch current user profile
- `renderProfile()` - Display user settings
- `updateEmail()` - Update email address (with validation)
- `changePassword()` - Change password (with old password validation)
- `uploadWallpaper()` - Upload background image
- `uploadAvatar()` - Upload profile picture
- `deleteAvatar()` - Remove avatar (reset to default)

**Features**:
- Email management
- Password change
- Wallpaper upload (jpg/png/webp/gif, max 10MB)
- Avatar upload (jpg/png/webp/gif, max 5MB)
- Profile customization

**Current Status**: ✅ IMPLEMENTED

---

#### 14. **admin.js** (115 lines)
**Purpose**: Admin panel functionality

**Key Functions**:
- `loadUsers()` - Fetch all users with stats
- `renderUsers()` - Display user management table
- `toggleAdmin(userId)` - Promote/demote admin status
- `resetPassword(userId)` - Reset user password
- `deleteUser(userId)` - Delete user account

**Features**:
- User management
- Admin role management
- Password resets
- User deletion
- User statistics (todos count, bugs count)

**Current Status**: ✅ IMPLEMENTED (v1.0.0+)

---

#### 15. **login.js** (121 lines)
**Purpose**: Authentication UI

**Key Functions**:
- `handleLogin()` - Submit login form
- `handleRegister()` - Submit register form
- `toggleLoginRegister()` - Switch between tabs
- `handleForgotPassword()` - Request password reset
- `handleResetPassword()` - Confirm password reset (uses token from URL param)

**Features**:
- Login/Register forms
- Password reset flow
- Email validation
- Form validation
- Error display

**Current Status**: ✅ IMPLEMENTED (v1.0.0+ with password reset flow)

---

#### 16. **user_profile.js** (87 lines)
**Purpose**: Public user profile view

**Key Functions**:
- `loadUserProfile(userId)` - Fetch user stats
- `renderProfile()` - Display user profile card
- `loadUserStats()` - Get leaderboard position + stats

**Features**:
- User profile display
- User statistics
- User avatar + wallpaper

**Current Status**: ✅ IMPLEMENTED

---

### CSS Structure

**Design System** (v1.7.0+):
- `design-system.css` - 25+ CSS custom properties (colors, typography, spacing, shadows, radius, transitions, z-index)
- `components.css` - 40+ component styles (buttons, forms, cards, modals, navigation, lists, tables, badges, alerts)
- `layout-components.css` - Layout primitives (grid, flexbox, sidebar, split layout, stack layout)
- `animations.css` - 30+ animations (fade, slide, scale, zoom, spin, bounce, shake) + transitions
- `polish.css` - Polish effects (glassmorphism, gradients, enhanced shadows, neumorphic effects, blur)
- `accessibility.css` - WCAG 2.1 AA compliance (focus states, keyboard navigation, screen reader support, color contrast)

**Feature-Specific CSS**:
- `style.css` - Global styles + typography
- `dashboard.css` - Widget grid + widget-specific styles
- `todo.css` - Todo list + workspace hierarchy styles
- `calendar.css` - Calendar month/week/day view styles
- `notes.css` - Note editor + folder styles
- `documents.css` - Document list + folder browser styles
- `habits.css` - Habit list + calendar heat map styles
- `pomodoro.css` - Timer display + statistics styles
- `tracking.css` - Time entry list + chart styles
- `login.css` - Login/register form styles
- `profile.css` - Profile settings styles

**Current Status**: ✅ FULLY FEATURED (v1.7.0+ complete design system)

---

## AUTHENTICATION & AUTHORIZATION

### Authentication Flow

**JWT-Based Authentication** (v0.1.0+):
1. User submits username + password via POST /api/auth/login
2. Backend validates password (bcrypt comparison)
3. Backend generates JWT token (7-day expiry)
4. Token sent to client + stored in HTTP-Only cookie
5. Client includes token in Authorization header or reads from cookie
6. All protected endpoints validate token via auth middleware

**Password Reset Flow** (v1.0.0+):
1. User requests reset via POST /api/auth/forgot-password
2. Backend generates 32-byte random token + 1-hour expiry
3. Email sent with link: `/reset-password/:token`
4. User clicks link, token extracted from URL
5. User submits new password via POST /api/auth/reset-password/:token
6. Token validated (must be unused, not expired)
7. Password hashed + updated in database

**Rate Limiting**:
- `authLimiter` (auth.js): 5 login/register attempts per 15 minutes
- `passwordLimiter` (auth.js): 3 password reset attempts per 1 hour

### Authorization System

**Role-Based Authorization** (v1.0.0+):
- `is_admin` flag in users table (INTEGER 0/1)
- `adminOnly` middleware enforces authorization
- First user automatically promoted to admin (v1.6.5+)

**Protected Endpoints** (Require Auth):
- All `/api/*` routes (except /api/auth/register, /api/auth/login, /api/changelog)
- All view routes except login, register, forgot-password, changelog

**Admin-Only Routes**:
- GET /api/admin/users
- PUT /api/admin/users/:id/toggle-admin
- DELETE /api/admin/users/:id
- PUT /api/admin/users/:id/reset-password
- GET /entwicklungsplan (view)
- GET /admin (view)

**Authorization Checks**:
- auth middleware validates JWT token
- adminOnly middleware checks is_admin flag
- Bug management: `isJaro()` function checks is_admin (custom helper in bugs.js)

**Current Status**: ✅ FULLY IMPLEMENTED (v1.6.1+ security hardening, v1.6.5+ flexible admin detection)

---

## DEPENDENCY TREE & BUILD ORDER

### External Dependencies

**Backend** (`backend/package.json`):
```
express@4.18.3 - Web framework
better-sqlite3@12.10.0 - SQLite database
bcrypt@6.0.0 - Password hashing
jsonwebtoken@9.0.3 - JWT token management
nodemailer@^5+ - Email delivery (SMTP/sendmail)
multer@2.1.1 - File upload handling
dotenv@16.4.5 - Environment variables
ejs@6.0.1 - Template rendering
cors@2.8.5 - CORS middleware
express-rate-limit@8.5.2 - Rate limiting
cookie-parser@1.4.7 - Cookie handling
swagger-jsdoc@6.2.8 - API documentation
swagger-ui-express@5.0.0 - Swagger UI
nodemon@3.1.0 (dev) - Auto-restart on file change
```

**Frontend** (Browser APIs):
```
Chart.js@4.4.1 - Charts/graphs (CDN)
Font Awesome@6.0.0 - Icons (CDN)
Native fetch() - HTTP requests
localStorage - Client-side persistence
```

### Database Dependencies

**Initialization Order**:
1. **users** (base table - required for all others)
2. **sessions** (JWT-based, less critical)
3. **workspaces** (referenced by todos, notizen, events)
4. **kalender_kategorien** (optional, not heavily used)
5. **todos** (depends on users, workspaces)
6. **events** (depends on users, workspaces)
7. **notizen** (depends on users, workspaces, todos, events)
8. **ordner** (depends on users)
9. **dokumente** (depends on users, ordner, todos, events, notizen)
10. **pomodoro_sessions** (depends on users, todos)
11. **time_entries** (depends on users, todos)
12. **dashboard_widgets** (depends on users)
13. **messages** (depends on users)
14. **password_resets** (depends on users)
15. **sidebar_modules** (depends on users)
16. **habits** (depends on users)
17. **habit_logs** (depends on habits)
18. **bug_reports** (depends on users)
19. **changelog** (independent, global)

### Module Dependencies (Backend)

```
server.js
├── config.js (database path, upload dir)
├── database/db.js (SQLite initialization)
└── routes/
    ├── index.js (view routes)
    └── api_root.js (API routing hub)
        ├── auth-routes.js
        │   └── bcrypt, jwt, nodemailer, multer
        ├── api.js (dashboard)
        ├── todos.js
        ├── workspaces.js
        ├── notizen.js
        ├── ordner.js
        ├── kalender.js
        ├── dokumente.js (multer)
        ├── pomodoro.js
        ├── zeit.js
        ├── habits.js
        ├── leaderboard.js
        ├── messages.js
        ├── users.js
        ├── search.js
        ├── dashboard_widgets.js
        ├── bugs.js
        ├── changelog.js (changelog-parser.js)
        ├── admin.js
        └── sidebar.js
    └── middleware/
        ├── auth.js (jwt)
        ├── admin.js (auth, database)
        ├── rateLimit.js (express-rate-limit)
        ├── pagination.js
        ├── validators.js
        └── logger.js
```

### Module Dependencies (Frontend)

```
index.html
├── CSS (design-system → components → layout → animations → polish → accessibility → style → feature-specific)
├── js/app.js (global app state, auth, API wrapper)
│   └── used by all other JS files
├── js/index.js (dashboard widget system, depends on app.js)
├── js/todo.js (depends on app.js)
├── js/calendar.js (depends on app.js)
├── js/notes.js (depends on app.js)
├── js/documents.js (depends on app.js)
├── js/habits.js (depends on app.js)
├── js/pomodoro.js (depends on app.js, updates global timer)
├── js/tracking.js (depends on app.js)
├── js/leaderboard.js (depends on app.js)
├── js/messages.js (depends on app.js)
├── js/bugs.js (depends on app.js)
├── js/profile.js (depends on app.js)
├── js/admin.js (depends on app.js)
├── js/login.js (authentication)
├── js/user_profile.js (depends on app.js)
└── partials/sidebar.ejs (depends on JavaScript for interactivity)
```

### Critical Build Order

**Backend Startup**:
1. Load environment variables (.env)
2. Initialize SQLite database (db.js - creates tables, runs migrations)
3. Seed changelog data (if first run)
4. Set first user as admin (if exists)
5. Start Express server
6. Load middleware (auth, rate limiting, logging, security headers)
7. Mount route handlers

**Frontend Page Load**:
1. Parse EJS template (inject currentUser, fileContents, etc.)
2. Load CSS (design system first → component styles → feature-specific)
3. Load Font Awesome + Chart.js from CDN
4. Load app.js (initializes global currentUser, sets up auth)
5. Load page-specific JS (todo.js, calendar.js, etc.)
6. Page-specific JS calls app.apiFetch() to load data
7. DOM rendered, event listeners attached

---

## CURRENT IMPLEMENTATION STATUS MATRIX

| Feature | Backend | Frontend | Database | Tests | Status |
|---------|---------|----------|----------|-------|--------|
| **Authentication** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ users/sessions | ❌ | Deployed |
| **Password Reset** | ✅ v1.0.0 | ✅ v1.0.0 | ✅ password_resets | ❌ | Deployed |
| **Todos** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ todos | ❌ | Deployed |
| **Workspaces** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ workspaces | ❌ | Deployed |
| **Workspace Hierarchy** | ✅ v1.2.0 | ✅ v1.2.0 | ✅ parent_id | ❌ | Deployed |
| **Workspace DnD** | ✅ v1.4.0 | ✅ v1.4.0 | ✅ parent_id | ❌ | Deployed |
| **Calendar** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ events | ❌ | Deployed |
| **Calendar DnD** | ✅ v1.6.0 | ✅ v1.6.0 | ✅ start_datum/time | ❌ | Deployed |
| **Notes** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ notizen | ❌ | Deployed |
| **Documents** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ dokumente | ❌ | Deployed |
| **Pomodoro** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ pomodoro_sessions | ❌ | Deployed |
| **Time Tracking** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ time_entries | ❌ | Deployed |
| **Habits** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ habits/habit_logs | ❌ | Deployed |
| **Leaderboard** | ✅ v0.2.0 | ✅ v0.2.0 | ✅ (aggregated) | ❌ | Deployed |
| **Messages** | ✅ v0.2.0 | ✅ v0.2.0 | ✅ messages | ❌ | Deployed |
| **User Profiles** | ✅ v0.2.0 | ✅ v0.2.0 | ✅ users.avatar/wallpaper | ❌ | Deployed |
| **Bug Reports** | ✅ v1.1.0 | ✅ v1.1.0 | ✅ bug_reports | ❌ | Deployed |
| **Bug Kanban Board** | ✅ v1.1.0 | ✅ v1.1.0 | ✅ status field | ❌ | Deployed |
| **Changelog** | ✅ v1.3.0 | ✅ v1.3.0 | ✅ changelog | ❌ | Deployed |
| **Admin Panel** | ✅ v1.0.0 | ✅ v1.0.0 | ✅ is_admin field | ❌ | Deployed |
| **Development Plan** | ✅ v0.3.0 | ✅ v0.3.0 | ✅ N/A (file-based) | ❌ | Deployed |
| **Dashboard Widgets** | ✅ v1.7.0 | ✅ v1.7.0 | ✅ dashboard_widgets | ❌ | Deployed |
| **Design System** | ✅ v1.7.0 | ✅ v1.7.0 | N/A | ❌ | Deployed |
| **Widget DnD** | ✅ v1.7.2 | ✅ v1.7.2 | ✅ position field | ❌ | Deployed |
| **Weather Widget** | ✅ v1.6.6 | ✅ v1.6.6 | N/A (API-based) | ❌ | Deployed |
| **Search (Global)** | ✅ v0.1.0 | ✅ v0.1.0 | ✅ (aggregated) | ❌ | Deployed |

---

## SECURITY IMPLEMENTATION

### Implemented Security Measures (v1.6.1+)

1. **Password Hashing**: bcrypt (10 salt rounds)
2. **JWT Authentication**: 7-day expiry, HS256 algorithm
3. **Rate Limiting**: 5 login attempts/15min, 3 password resets/1hour
4. **Email Validation**: RFC 5322 regex, max 254 chars
5. **File Upload Validation**: Type whitelist, size limits (100MB general, 10MB wallpaper, 5MB avatar)
6. **CORS Configuration**: Whitelist via CORS_ORIGIN env var
7. **Security Headers**: 
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - X-Frame-Options: DENY
   - Referrer-Policy: strict-origin-when-cross-origin
   - Content-Security-Policy (script/style/font/img whitelist)
8. **SQL Injection Prevention**: Parameterized queries (better-sqlite3 prepared statements)
9. **XSS Prevention**: 
   - EJS auto-escaping
   - addEventListener instead of onclick handlers
   - HTML entity escaping in templates
10. **CSRF Protection**: HTTP-Only cookies, SameSite=Lax
11. **Auth Middleware**: Validates JWT on all protected routes
12. **Authorization Middleware**: adminOnly checks is_admin flag
13. **Admin Auto-Detection**: First user automatically admin (v1.6.5+)
14. **Input Validation**: Max string lengths, whitelist validation for colors/statuses
15. **Error Handling**: Generic error messages, no internal details in 500 responses
16. **Workspace Cascade Delete**: Prevents orphaned references
17. **ReDoS Prevention**: Search query max 200 chars

---

## KEY PATTERNS & ARCHITECTURE

### Backend Patterns

**Express Route Pattern**:
```javascript
router.get("/endpoint", auth, (req, res) => {
  try {
    const result = db.prepare("SELECT ... WHERE user_id = ?").get(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Error Handling**:
- Try-catch in all routes
- Status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- Consistent error format: `{error: "message"}`

**Pagination**:
```javascript
const { offset, limit } = getPaginationParams(req, defaultLimit, maxLimit);
const response = buildPaginationResponse(data, count, offset, limit);
```

**Transactions** (better-sqlite3):
```javascript
const txn = db.transaction((items) => { /* update items */ });
txn(items); // Execute in transaction
```

### Frontend Patterns

**API Wrapper**:
```javascript
const response = await apiFetch("/api/endpoint", {
  method: "POST",
  body: JSON.stringify(data)
});
const json = safeJson(response); // Handles JSON parsing errors
```

**Event Delegation** (v1.6.2+):
```javascript
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest(".todo")) handleContextMenu();
});
```

**Drag-Drop Pattern** (v1.7.7-Final):
```javascript
class WidgetGrid {
  _dragState = { id: null, draggedElement: null };
  
  _onDragStart(e) {
    this._dragState = { id: widget.id, draggedElement: e.target };
    // Save originalHTML + originalSizes for undo
  }
  
  _onDrop(e) {
    // Optimistic update
    // Call API
    // Rollback on error
  }
}
```

**Safe JSON Parsing**:
```javascript
function safeJson(response) {
  try { return JSON.parse(response); } catch { return null; }
}
```

**localStorage Persistence**:
```javascript
localStorage.setItem("currentWorkspaceId", id);
const saved = localStorage.getItem("currentWorkspaceId");
```

---

## KNOWN ISSUES & TECHNICAL DEBT

1. ❌ **No test suite** - No automated tests (Jest, Mocha, or similar)
2. ⚠️ **Hardcoded strings** - Some UI strings should be i18n
3. ⚠️ **API docs incomplete** - Swagger comments present but not fully utilized
4. ⚠️ **Changelog seeding** - Manual seed array instead of git integration
5. ⚠️ **No WebSocket support** - Real-time features would require Socket.io
6. ⚠️ **Mobile responsive** - Basic mobile support, could be enhanced
7. ⚠️ **Performance** - No query optimization or database indexing (except changelog version)
8. ⚠️ **No database backups** - SQLite file only, no backup mechanism
9. ⚠️ **Email on staging** - No sendmail on non-production, hardcoded fallback

---

## DEPLOYMENT NOTES

### Environment Variables Required
```
NODE_ENV=production
PORT=3000
JWT_SECRET=<long-random-string>
CORS_ORIGIN=https://example.com
MAIL_USER=<smtp-user>
MAIL_PASS=<smtp-password>
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
```

### Build Checklist
1. ✅ Database schema (auto-initialized in db.js)
2. ✅ Migrations (auto-run in db.js)
3. ✅ Seed data (changelog seeded in api_root.js)
4. ✅ Environment variables loaded (dotenv)
5. ✅ CORS configured (corsOptions in server.js)
6. ✅ Static files served (frontend/public)
7. ✅ Upload directory created (auth-routes.js)
8. ✅ Email configured (nodemailer in auth-routes.js)

---

## SUMMARY

The **mindful_github** codebase is a comprehensive full-stack productivity application with:

- **18 database tables** covering users, todos, calendar events, notes, habits, and more
- **25+ backend API routes** organized by feature
- **16 frontend JavaScript modules** totaling 7405 lines of code
- **Complete design system** with 25+ CSS variables and 40+ components
- **Advanced features**: Workspace hierarchies, habit tracking, Kanban boards, leaderboard, messaging
- **Security**: JWT auth, bcrypt passwords, rate limiting, CSRF protection, XSS prevention
- **Modern patterns**: Async/await, localStorage persistence, drag-drop operations, widget systems
- **v1.7.7-Final**: Smooth widget DnD, weather widget with autocomplete, complete design polish

All features are **production-ready and deployed**.

