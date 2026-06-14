# ENTWICKLUNGSPLAN QUICK REFERENCE

## Purpose
The Entwicklungsplan page (`/entwicklungsplan`) is an **admin-only** page that displays:
1. Team member task assignments
2. Code snippets for each assigned feature
3. Dynamically filtered task view (show open/completed tasks)
4. localStorage-based task tracking

## Current Implementation

### Backend Support
**File**: `backend/routes/index.js` (lines 35-54)

```javascript
router.get("/entwicklungsplan", auth, adminOnly, (req, res) => {
  const fileContents = {};
  const root = path.join(__dirname, "..", "..");
  const fileMap = {
    "ilhan-1": "backend/database/db.js",
    "jaro-1": "backend/routes/leaderboard.js",
    "jaro-2": "backend/routes/users.js",
    "jaro-3": "backend/routes/messages.js",
    "jaro-7": "backend/routes/search.js",
    "jaro-13": "backend/routes/auth-routes.js",
  };
  for (const [id, filePath] of Object.entries(fileMap)) {
    try {
      fileContents[id] = fs.readFileSync(path.join(root, filePath), "utf-8");
    } catch (e) {
      fileContents[id] = null;
    }
  }
  res.render("entwicklungsplan", { currentPage: "entwicklungsplan", fileContents });
});
```

### Frontend Template
**File**: `frontend/views/entwicklungsplan.ejs` (153,053 bytes)

- Displays code snippets from backend routes
- Has task checklist with localStorage persistence
- Dynamic filtering (open/completed tasks)
- Uses card-based layout matching design system

## Team Assignment Structure

Current assignments visible in the Changelog seed data:

```javascript
["0.3.0", "2026-06-09", "Projektplan & Entwicklungs-Dashboard", 
  '["Entwicklungsplan-Seite mit Aufgabenverteilung (Team-Übersicht)",
    "Interaktive Aufgabenliste mit Checkboxen und localStorage",
    "Code-Snippet-Viewer mit 1:1-Projektdatei-Kopien",
    "34 exakte Code-Snippets für alle Teammitglieder",
    "Dynamische Aufgaben-Filter (offen/erledigt)"]', ...]
```

## Key Features

1. **Admin-Only Access**
   - Requires is_admin flag (first user automatically promoted)
   - Enforced via `adminOnly` middleware

2. **Code Snippet Display**
   - Maps team member IDs to source files
   - Files injected as `fileContents` object via EJS
   - HTML-escaped in template to prevent XSS

3. **Task Management**
   - Interactive checklist with localStorage
   - Filter buttons (offen/erledigt)
   - Dynamic task count per status

4. **Team Members**
   - ilhan: Database schema (db.js)
   - jaro: Multiple routes (leaderboard, users, messages, search, auth)

## How to Update Tasks

### To Add New Team Member Assignment

1. **Backend** (`backend/routes/index.js`):
   ```javascript
   const fileMap = {
     // ... existing entries
     "new-member-1": "path/to/implementation/file.js",
   };
   ```

2. **EJS Template** (`frontend/views/entwicklungsplan.ejs`):
   - Add new task item for the team member
   - Use corresponding file content in code viewer
   - Task IDs should match fileMap keys

### To Update Task List

Edit the HTML task list in `frontend/views/entwicklungsplan.ejs`:
```html
<div class="task-item" data-id="unique-id">
  <input type="checkbox" class="task-checkbox" /> Task Name
</div>
```

Tasks are persisted in localStorage as JSON:
```javascript
const tasks = JSON.parse(localStorage.getItem("entwicklungsplan-tasks") || "{}");
```

## Integration with Changelog

The Changelog table contains all development milestones:

```javascript
// v0.3.0 entry structure
{
  version: "0.3.0",
  datum: "2026-06-09",
  titel: "Projektplan & Entwicklungs-Dashboard",
  features: ["Task 1", "Task 2", ...],
  fixes: ["Fix 1", ...],
  commits: ["hash1", "hash2", ...]
}
```

These entries serve as:
1. Project milestone tracking
2. Feature list documentation
3. Team task distribution reference

## Database Schema Involved

- **users** table: `is_admin` field for authorization
- **changelog** table: Version history and task tracking (no dedicated tasks table)

## Current API Endpoints Used

- `GET /api/auth/me` - Verify user is logged in
- No direct API calls needed; file contents injected server-side

## Implementation Status

✅ **COMPLETED**: v0.3.0 (2026-06-09)
- Entwicklungsplan page ✅
- Aufgabenverteilung (Team overview) ✅
- Interaktive Aufgabenliste ✅
- Code-Snippet-Viewer ✅
- Dynamische Aufgaben-Filter ✅

## Security Notes

1. **Admin-Only**: `adminOnly` middleware enforces authorization
2. **File Contents**: Read from disk server-side (no API exposure)
3. **XSS Protection**: Code snippets HTML-escaped in EJS template
4. **localStorage**: Task state is client-side only, not persisted to database

## Best Practices for Maintenance

1. Keep fileMap entries synchronized with actual file paths
2. Update task list when new features are completed
3. Use Changelog entries as source of truth for project status
4. Test admin middleware on every update
5. Validate file paths exist before rendering (already done with try-catch)

## Future Enhancements (Not Implemented)

- Database-backed task tracking (would need tasks table)
- Real-time task updates (would need WebSocket)
- Sub-task hierarchies
- Deadline tracking
- Dependency management
- Time estimates
