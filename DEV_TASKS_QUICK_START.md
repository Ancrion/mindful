# Development Tasks System - Quick Start Guide

## For Team Members 👥

### Viewing Your Tasks
```
1. Open mindful_github
2. Click "Entwicklungsplan" in sidebar
3. See all development tasks
4. Filter by "assignee" to see YOUR tasks
```

### Understanding a Task
```
Title           → What needs to be done
Description     → Why and how to do it
File Path       → Where in codebase (backend/routes/todos.js)
Lines           → Exact location ([18:50] = lines 18 to 50)
Assignee        → Who it's assigned to
Status          → open / in_progress / done
Priority        → high / medium / low
Phase           → Phase 1, 2, 3, 4, 5, or 6
```

### Viewing Code
```
1. Find task in list
2. Click "Code anzeigen" button
3. Modal opens with actual code
4. Use "Kopieren" button to copy
5. Paste into your editor
```

### Searching
```
Search field → Find by title, description, or file path
Filter assignee → See only YOUR assigned tasks
Filter status → See only OPEN or IN_PROGRESS tasks
Filter phase → See only specific phase
```

---

## For Admins 🔧

### Creating a Task
```
1. Go to /dev-tasks-admin
2. Click "Neue Aufgabe" tab
3. Fill in:
   - Title (required)
   - Description (optional)
   - File Path (required, e.g., "backend/routes/todos.js")
   - Start Line (optional, e.g., 18)
   - End Line (optional, e.g., 50)
   - Action Type (add/modify/delete/refactor)
   - Assignee (ilhan/jaro/team)
   - Status (open/in_progress/done)
   - Priority (high/medium/low)
   - Phase (Phase 1-5)
4. Click "Aufgabe erstellen"
```

### Managing Tasks
```
1. Go to /dev-tasks-admin
2. Click "Alle Aufgaben" tab
3. See all tasks with metadata
4. Click "Löschen" to delete task
5. Edit functionality coming soon
```

### Viewing Statistics
```
1. Go to /dev-tasks-admin
2. Click "Statistiken" tab
3. See:
   - Total/Open/In Progress/Done counts
   - Breakdown per assignee
   - Breakdown per phase
```

---

## Common Use Cases

### "How do I know what to do next?"
1. Go to /entwicklungsplan
2. Filter by assignee = your name
3. Filter by status = open
4. Read the task description
5. Click "Code anzeigen" to see code

### "Where in the code do I make this change?"
1. Find task in /entwicklungsplan
2. Read file path and line numbers
3. Click "Code anzeigen" to see exact code
4. Copy code with button
5. Jump to that location in your editor

### "I'm done with this task"
1. Tell admin to mark task as "done"
2. Admin goes to /dev-tasks-admin
3. Task will show as complete in /entwicklungsplan

### "I need to create a task"
1. Go to /dev-tasks-admin
2. Click "Neue Aufgabe"
3. Specify file path and lines
4. Click "Aufgabe erstellen"
5. Task appears in /entwicklungsplan

### "I want to see all open tasks"
1. Go to /entwicklungsplan
2. Filter status = "Offen"
3. See all unfinished work

### "What's my team working on?"
1. Go to /entwicklungsplan
2. Leave all filters on "Alle"
3. See full overview
4. Check "Statistiken" at the bottom

---

## File Path Examples

### Backend Routes
```
backend/routes/todos.js        → Todo management
backend/routes/kalender.js     → Calendar management
backend/routes/notizen.js      → Notes management
backend/routes/pomodoro.js     → Pomodoro timer
backend/routes/zeiterfassung.js → Time tracking
backend/routes/auth-routes.js  → Authentication
backend/routes/workspace.js    → Workspace management
```

### Database
```
backend/database/db.js         → Database schema
```

### Frontend Views
```
frontend/views/todo.ejs        → Todo page
frontend/views/calendar.ejs    → Calendar page
frontend/views/notes.ejs       → Notes page
frontend/views/dashboard.ejs   → Dashboard page
```

### Frontend Scripts
```
frontend/public/js/index.js    → Main app logic
frontend/public/js/todo.js     → Todo functionality
frontend/public/js/calendar.js → Calendar functionality
```

---

## API Examples (Advanced)

### Get All Tasks
```bash
curl http://localhost:3000/api/development-tasks
```

### Get Open Tasks
```bash
curl http://localhost:3000/api/development-tasks?status=open
```

### Get YOUR Tasks
```bash
curl http://localhost:3000/api/development-tasks?assignee=jaro
```

### Get Single Task with Code
```bash
curl http://localhost:3000/api/development-tasks/1
```

### Get Statistics
```bash
curl http://localhost:3000/api/development-tasks/stats/summary
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Close Code Modal | ESC (coming soon) |
| Copy Code | Cmd+C (after clicking Copy button) |
| Go to Entwicklungsplan | / + e in spotlight search (Cmd+K) |
| Go to Admin Panel | / + d + t + a in spotlight search (Cmd+K) |

---

## Colors & Status

### Status Indicators
- ⭕ **Open** - Not started
- 🔄 **In Progress** - Currently being worked on
- ✅ **Done** - Completed

### Priority Colors (Visual)
- 🔴 **High** - Important, do first
- 🟡 **Medium** - Important but not urgent
- 🔵 **Low** - Nice to have

### Phase System
- **Phase 1** - Database & Foundation
- **Phase 2** - Authentication & Core
- **Phase 3** - Main Features (Todos, Calendar, Notes)
- **Phase 4** - Dashboard & Advanced UI
- **Phase 5** - Additional Features
- **Phase 6** - Development Tooling

---

## Troubleshooting

### "I can't see the Entwicklungsplan link"
- You need to be logged in
- You need to be an admin
- Check /dev-tasks-admin is accessible

### "Code snippet isn't showing"
- Check the file path is correct
- Check line numbers are valid
- The file might not exist
- Try viewing in modal

### "I can't create a task"
- You need admin access
- Check file path is relative to project root
- Check file actually exists
- Check line numbers are valid

### "Filters aren't working"
- Make sure values exactly match:
  - Assignee: ilhan, jaro, or team
  - Status: open, in_progress, or done
  - Phase: Phase 1, Phase 2, etc.
- Try clearing filters and try again

### "Can't copy code"
- Try the Copy button in the modal
- Use Cmd+C / Ctrl+C after clicking Copy
- Code appears in your clipboard

---

## Support

For issues or questions:
1. Check the full guide: `DEVELOPMENT_TASKS_GUIDE.md`
2. Check the implementation: `DEVELOPMENT_TASKS_IMPLEMENTATION.md`
3. Ask an admin or check Slack

---

## Summary

**For Team Members:**
1. Go to `/entwicklungsplan`
2. Filter for your tasks
3. Click to see code
4. Copy and implement

**For Admins:**
1. Go to `/dev-tasks-admin`
2. Create/manage tasks
3. Track progress
4. Monitor team work

That's it! 🎉
