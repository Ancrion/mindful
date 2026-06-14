const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const fs = require("fs");
const path = require("path");

/**
 * Helper: Read code from file and validate line ranges
 */
function readCodeSnippet(filePath, lineStart, lineEnd) {
  try {
    const fullPath = path.join(__dirname, "..", "..", filePath);
    
    // Security: Prevent path traversal
    const resolvedPath = path.resolve(fullPath);
    const projectRoot = path.resolve(__dirname, "..", "..");
    if (!resolvedPath.startsWith(projectRoot)) {
      return { error: "Invalid file path", fullContent: null, snippet: null };
    }

    if (!fs.existsSync(resolvedPath)) {
      return { error: "File not found", fullContent: null, snippet: null };
    }

    const content = fs.readFileSync(resolvedPath, "utf-8");
    const lines = content.split("\n");
    const fullContent = content;

    // Get snippet if line numbers provided
    let snippet = null;
    if (lineStart !== null && lineEnd !== null) {
      const start = Math.max(0, lineStart - 1);
      const end = Math.min(lines.length, lineEnd);
      snippet = lines.slice(start, end).join("\n");
    }

    return {
      error: null,
      fullContent,
      snippet,
      totalLines: lines.length,
      validLineRange: lineStart !== null && lineEnd !== null && lineStart >= 1 && lineEnd <= lines.length
    };
  } catch (err) {
    return { error: err.message, fullContent: null, snippet: null };
  }
}

/**
 * GET /api/development-tasks
 * Get all development tasks with optional filters
 * Query params: assignee, status, phase, file_path, search
 */
router.get("/", auth, (req, res) => {
  try {
    let query = "SELECT * FROM development_tasks WHERE 1=1";
    const params = [];

    if (req.query.assignee && req.query.assignee !== "all") {
      query += " AND assignee = ?";
      params.push(req.query.assignee);
    }

    if (req.query.status && req.query.status !== "all") {
      query += " AND status = ?";
      params.push(req.query.status);
    }

    if (req.query.phase && req.query.phase !== "all") {
      query += " AND phase = ?";
      params.push(req.query.phase);
    }

    if (req.query.file_path) {
      query += " AND file_path LIKE ?";
      params.push(`%${req.query.file_path}%`);
    }

    if (req.query.search) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Sort by phase, then status (open first), then priority
    query += " ORDER BY phase ASC, CASE WHEN status = 'open' THEN 0 WHEN status = 'in_progress' THEN 1 ELSE 2 END ASC, CASE WHEN priority = 'high' THEN 0 WHEN priority = 'medium' THEN 1 ELSE 2 END ASC";

    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching development tasks:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/development-tasks/:id
 * Get single task with full code snippet
 */
router.get("/:id", auth, (req, res) => {
  try {
    const task = db
      .prepare("SELECT * FROM development_tasks WHERE id = ?")
      .get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Read code snippet
    const codeData = readCodeSnippet(task.file_path, task.line_start, task.line_end);

    const response = {
      ...task,
      code_snippet: codeData.snippet,
      full_content: codeData.fullContent,
      code_error: codeData.error,
      total_lines: codeData.totalLines,
      valid_line_range: codeData.validLineRange
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching development task:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/development-tasks
 * Create new development task (admin only)
 */
router.post("/", auth, adminOnly, (req, res) => {
  try {
    const {
      title,
      description,
      file_path,
      line_start,
      line_end,
      action_type,
      assignee,
      status,
      priority,
      phase
    } = req.body;

    // Validate required fields
    if (!title) return res.status(400).json({ error: "Title is required" });
    if (!file_path) return res.status(400).json({ error: "File path is required" });

    // Validate file exists and line numbers if provided
    const codeData = readCodeSnippet(file_path, line_start, line_end);
    if (codeData.error && line_start !== null && line_end !== null) {
      return res.status(400).json({ error: `File error: ${codeData.error}` });
    }

    if (line_start !== null && line_end !== null && !codeData.validLineRange) {
      return res.status(400).json({
        error: `Invalid line range. File has ${codeData.totalLines} lines.`
      });
    }

    const result = db
      .prepare(
        `INSERT INTO development_tasks 
         (title, description, file_path, line_start, line_end, action_type, assignee, status, priority, phase, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`
      )
      .run(
        title,
        description || null,
        file_path,
        line_start || null,
        line_end || null,
        action_type || "modify",
        assignee || null,
        status || "open",
        priority || "medium",
        phase || "Phase 1"
      );

    res.status(201).json({
      message: "Development task created ✅",
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error("Error creating development task:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/development-tasks/:id
 * Update development task (admin only)
 */
router.put("/:id", auth, adminOnly, (req, res) => {
  try {
    const task = db
      .prepare("SELECT * FROM development_tasks WHERE id = ?")
      .get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const {
      title,
      description,
      file_path,
      line_start,
      line_end,
      action_type,
      assignee,
      status,
      priority,
      phase
    } = req.body;

    // Validate file exists if changed
    if (file_path && file_path !== task.file_path) {
      const codeData = readCodeSnippet(file_path, line_start, line_end);
      if (codeData.error && line_start !== null && line_end !== null) {
        return res.status(400).json({ error: `File error: ${codeData.error}` });
      }
    }

    db.prepare(
      `UPDATE development_tasks 
       SET title = ?, description = ?, file_path = ?, line_start = ?, line_end = ?, 
           action_type = ?, assignee = ?, status = ?, priority = ?, phase = ?,
           updated_at = datetime('now', 'localtime')
       WHERE id = ?`
    ).run(
      title !== undefined ? title : task.title,
      description !== undefined ? description : task.description,
      file_path !== undefined ? file_path : task.file_path,
      line_start !== undefined ? line_start : task.line_start,
      line_end !== undefined ? line_end : task.line_end,
      action_type !== undefined ? action_type : task.action_type,
      assignee !== undefined ? assignee : task.assignee,
      status !== undefined ? status : task.status,
      priority !== undefined ? priority : task.priority,
      phase !== undefined ? phase : task.phase,
      req.params.id
    );

    res.json({ message: "Development task updated ✅" });
  } catch (err) {
    console.error("Error updating development task:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/development-tasks/:id
 * Delete development task (admin only)
 */
router.delete("/:id", auth, adminOnly, (req, res) => {
  try {
    const task = db
      .prepare("SELECT * FROM development_tasks WHERE id = ?")
      .get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    db.prepare("DELETE FROM development_tasks WHERE id = ?").run(req.params.id);

    res.json({ message: "Development task deleted ✅" });
  } catch (err) {
    console.error("Error deleting development task:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/development-tasks/stats/summary
 * Get statistics for development tasks
 */
router.get("/stats/summary", auth, (req, res) => {
  try {
    const total = db.prepare("SELECT COUNT(*) as count FROM development_tasks").get();
    const open = db
      .prepare("SELECT COUNT(*) as count FROM development_tasks WHERE status = 'open'")
      .get();
    const inProgress = db
      .prepare("SELECT COUNT(*) as count FROM development_tasks WHERE status = 'in_progress'")
      .get();
    const done = db
      .prepare("SELECT COUNT(*) as count FROM development_tasks WHERE status = 'done'")
      .get();

    const byAssignee = db
      .prepare(
        `SELECT assignee, COUNT(*) as count, 
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
         FROM development_tasks 
         WHERE assignee IS NOT NULL
         GROUP BY assignee`
      )
      .all();

    const byPhase = db
      .prepare(
        `SELECT phase, COUNT(*) as count,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
         FROM development_tasks 
         GROUP BY phase
         ORDER BY phase ASC`
      )
      .all();

    res.json({
      total: total.count,
      open: open.count,
      in_progress: inProgress.count,
      done: done.count,
      by_assignee: byAssignee,
      by_phase: byPhase
    });
  } catch (err) {
    console.error("Error fetching task statistics:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
