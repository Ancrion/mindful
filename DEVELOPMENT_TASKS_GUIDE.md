# Development Tasks System - Comprehensive Guide

## Overview

The Development Tasks System is a **complete dynamic task management solution** for the mindful_github project. It allows the Entwicklungsplan page to serve as a comprehensive, searchable code reference where every team member can see exactly what code changes/additions are needed.

## Architecture

### 1. Database Layer (backend/database/db.js)

**Table: `development_tasks`**

```sql
CREATE TABLE development_tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  description  TEXT,
  file_path    TEXT NOT NULL,
  line_start   INTEGER DEFAULT NULL,
  line_end     INTEGER DEFAULT NULL,
  action_type  TEXT DEFAULT 'modify',
  assignee     TEXT,
  status       TEXT DEFAULT 'open',
  priority     TEXT DEFAULT 'medium',
  phase        TEXT DEFAULT 'Phase 1',
  created_at   TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at   TEXT DEFAULT (datetime('now', 'localtime'))
);
```

**Indexes:**
- `idx_dev_tasks_assignee` - Fast filtering by assignee
- `idx_dev_tasks_status` - Fast filtering by status
- `idx_dev_tasks_phase` - Fast filtering by phase
- `idx_dev_tasks_file_path` - Fast filtering by file path

### 2. Backend API (backend/routes/development-tasks.js)

#### Endpoints

**GET /api/development-tasks**
- Returns all development tasks with optional filters
- Query parameters:
  - `assignee` - Filter by assignee (ilhan, jaro, team)
  - `status` - Filter by status (open, in_progress, done)
  - `phase` - Filter by phase (Phase 1, Phase 2, etc.)
  - `file_path` - Search files by path pattern
  - `search` - Full-text search in title and description
- Response: Array of task objects

**GET /api/development-tasks/:id**
- Get a single task with full code snippet
- Returns:
  - All task fields
  - `code_snippet` - Actual code from file (lines line_start to line_end)
  - `full_content` - Entire file contents
  - `total_lines` - Total lines in the file
  - `valid_line_range` - Whether line_start:line_end is valid

**POST /api/development-tasks** *(Admin Only)*
- Create a new development task
- Required fields: `title`, `file_path`
- Optional fields: `description`, `line_start`, `line_end`, `action_type`, `assignee`, `status`, `priority`, `phase`
- Validates file exists and line numbers are within file bounds
- Returns: `{ message, id }`

**PUT /api/development-tasks/:id** *(Admin Only)*
- Update an existing task
- All fields are optional
- Updates `updated_at` timestamp
- Returns: `{ message }`

**DELETE /api/development-tasks/:id** *(Admin Only)*
- Delete a development task
- Returns: `{ message }`

**GET /api/development-tasks/stats/summary**
- Get statistics about all tasks
- Returns:
  - `total` - Total tasks
  - `open` - Open tasks count
  - `in_progress` - In progress tasks count
  - `done` - Completed tasks count
  - `by_assignee` - Array with counts per assignee
  - `by_phase` - Array with counts per phase

### 3. Admin Panel (frontend/views/dev-tasks-admin.ejs)

**Location:** `/dev-tasks-admin` (Admin only)

**Features:**
- **Create New Task Tab**
  - Form with all task fields
  - File path validation
  - Line range selector
  - Action type dropdown (add/modify/delete/refactor)
  - Assignee selection
  - Status selector
  - Priority selector
  - Phase selector
  - Code preview (when file is selected)
  - Form submission with error handling

- **All Tasks Tab**
  - List all created tasks
  - Display with metadata (assignee, status, priority, phase)
  - Edit button (for future implementation)
  - Delete button with confirmation

- **Statistics Tab**
  - Total/Open/In Progress/Done counts
  - Per-assignee statistics
  - Per-phase statistics

### 4. Entwicklungsplan Page (frontend/views/entwicklungsplan.ejs)

**Location:** `/entwicklungsplan` (Authenticated, Admin only)

**Features:**

1. **Dynamic Task Loading**
   - Loads tasks from `/api/development-tasks`
   - Retrieves code snippets from actual files
   - Shows real code with line numbers

2. **Search & Filtering**
   - Search by title/description/file path
   - Filter by assignee
   - Filter by status
   - Filter by phase
   - All filters work together

3. **Task Display**
   - Grouped by phase
   - Color-coded by status (✅ done, 🔄 in progress, ⭕ open)
   - Shows:
     - Title
     - Description
     - File path with line numbers
     - Assignee
     - Status badge
     - Priority badge
     - Action type indicator
   
4. **Code Display**
   - Click "Code anzeigen" to open modal
   - Full code snippet with syntax highlighting
   - Copy button to clipboard
   - Full file path shown in modal header

5. **Statistics Dashboard**
   - Total tasks / Open / In Progress / Done
   - Real-time updates as filters change

6. **Admin Link**
   - Quick link to admin panel for task management

### 5. File System Integration

**Code Snippet Loading:**

The system dynamically reads code from actual project files:

1. Task specifies `file_path`, `line_start`, `line_end`
2. When task is viewed/requested, code is read from:
   - `{project_root}/{file_path}`
3. Lines are extracted and cached
4. Security: Path traversal is prevented (resolves to project root only)

**Example:**
- File: `backend/routes/todos.js`
- Lines: 18-49
- Code: GET endpoint implementation

### 6. Database Seeding

**Seed File:** `backend/database/seed-dev-tasks.js`

Run with:
```bash
node backend/database/seed-dev-tasks.js
```

Comes with 18 pre-populated example tasks covering:
- Phase 1: Database schema (ilhan)
- Phase 2: Authentication & Workspaces (jaro)
- Phase 3: Todos, Calendar, Notes (jaro)
- Phase 4: Dashboard & Widgets (jaro)
- Phase 5: Advanced features (jaro)
- Phase 6: Development Tasks System itself (jaro)

## Usage Examples

### For Team Members

1. **View Development Plan**
   - Navigate to `/entwicklungsplan`
   - See all assigned tasks
   - Click task to expand and view full code

2. **Search for Specific Work**
   - Use search to find by title/description
   - Filter by assignee to see "my tasks"
   - Filter by status to see "what's open"

3. **View Code Reference**
   - Click "Code anzeigen" to see exact code location
   - Copy code directly to clipboard
   - See full file context

### For Admins

1. **Create New Task**
   - Go to `/dev-tasks-admin`
   - Click "Neue Aufgabe" tab
   - Fill in task details
   - Select file and line range
   - Click "Aufgabe erstellen"

2. **Manage Existing Tasks**
   - Click "Alle Aufgaben" tab
   - View all tasks
   - Edit or delete as needed

3. **Track Progress**
   - Click "Statistiken" tab
   - See overview of all work
   - Monitor per-assignee status

## API Integration Example

```javascript
// Fetch all open tasks
const tasks = await fetch('/api/development-tasks?status=open').then(r => r.json());

// Get single task with code
const task = await fetch('/api/development-tasks/1').then(r => r.json());
console.log(task.code_snippet); // Actual code from file

// Create task (admin only)
await fetch('/api/development-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Implement feature X',
    description: 'Add new widget to dashboard',
    file_path: 'backend/routes/dashboard_widgets.js',
    line_start: 100,
    line_end: 150,
    action_type: 'add',
    assignee: 'jaro',
    status: 'open',
    priority: 'high',
    phase: 'Phase 6'
  })
});

// Get statistics
const stats = await fetch('/api/development-tasks/stats/summary').then(r => r.json());
console.log(`Total: ${stats.total}, Open: ${stats.open}, Done: ${stats.done}`);
```

## Features

### ✅ Completed
- [x] Database schema and migrations
- [x] Full CRUD API endpoints with validation
- [x] File reading with security checks
- [x] Line number validation
- [x] Admin-only route protection
- [x] Dynamic Entwicklungsplan page
- [x] Search and filtering
- [x] Code display with syntax highlighting
- [x] Statistics dashboard
- [x] Admin panel for task management
- [x] Database seeding with examples

### 🔄 Future Enhancements
- [ ] Task edit form in admin panel
- [ ] Bulk operations (mark multiple done, reassign)
- [ ] Task dependencies/linking
- [ ] Activity log/audit trail
- [ ] CSV export of tasks
- [ ] Email notifications on task assignment
- [ ] Calendar integration (due dates)
- [ ] Side-by-side diff view for modifications
- [ ] Webhooks for external tools

## Security Considerations

1. **Path Traversal Prevention**
   - All file paths are resolved to project root
   - Prevents access to files outside project

2. **Admin-Only Operations**
   - Task creation/update/delete require admin role
   - Enforced via `adminOnly` middleware

3. **Input Validation**
   - File paths validated before reading
   - Line numbers checked against actual file
   - Email validation on assignee field

4. **Code Injection Prevention**
   - Code snippets read as plain text
   - Rendered with syntax highlighting (safe)
   - No code evaluation or execution

## Performance Notes

1. **Code Caching**
   - Code snippets are read on-demand
   - Full file content cached after first read
   - Can be further optimized with Redis

2. **Database Indexes**
   - Indexes on assignee, status, phase, file_path
   - Fast filtering and searching

3. **Pagination Ready**
   - API supports offset/limit (can be added)
   - Suitable for large task lists

## Files Created/Modified

### New Files
- `backend/routes/development-tasks.js` - API endpoints
- `frontend/views/dev-tasks-admin.ejs` - Admin panel
- `backend/database/seed-dev-tasks.js` - Seed data
- `DEVELOPMENT_TASKS_GUIDE.md` - This file

### Modified Files
- `backend/database/db.js` - Added development_tasks table + indexes
- `backend/routes/api_root.js` - Registered development-tasks routes
- `backend/routes/index.js` - Added /dev-tasks-admin route
- `frontend/views/entwicklungsplan.ejs` - Complete rewrite for dynamic loading

## Troubleshooting

**Tasks not loading?**
- Check `/api/development-tasks` endpoint
- Verify admin authentication
- Check browser console for errors

**Code snippet not showing?**
- Verify file_path is relative to project root
- Check line_start and line_end are valid
- Ensure file exists on disk

**Admin panel not accessible?**
- Confirm current user is admin (is_admin = 1 in database)
- Check authentication token

**Filter not working?**
- Ensure assignee values match (ilhan, jaro, team)
- Status must be: open, in_progress, done
- Phase format: "Phase 1", "Phase 2", etc.

## Contributing

When adding new features:

1. Add database column with migration (db.js)
2. Update API endpoints (development-tasks.js)
3. Update admin panel form (dev-tasks-admin.ejs)
4. Update task display (entwicklungsplan.ejs)
5. Add seed data for examples

## License

Part of mindful_github project. All rights reserved.
