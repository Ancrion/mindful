let currentStatusFilter = "offen";
let currentWorkspaceId = null;
let workspaceCache = [];
let dragTaskId = null;

function effectiveFilter() {
  return currentStatusFilter;
}

async function init() {
  await setupUser();
  await loadWorkspaces();
  showSkeleton();
  await loadTodos();

  document.querySelectorAll("#wsNewColors .ws-color-dot").forEach((el) => {
    el.addEventListener("click", function () {
      document.querySelectorAll("#wsNewColors .ws-color-dot").forEach((d) => d.classList.remove("active"));
      this.classList.add("active");
    });
  });

  document.getElementById("wsNewName").addEventListener("keydown", function (e) {
    if (e.key === "Enter") quickCreateWorkspace();
  });

  document.getElementById("wsSearch").addEventListener("keydown", function (e) {
    e.stopPropagation();
  });

  document.getElementById("taskTitle").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTask();
    }
  });

  setupStatusDnD();
  document.getElementById("dpSubInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addSubtask();
  });

  // Global sidebar workspace change → local
  window.addEventListener("workspacechange", (e) => {
    const globalId = e.detail.workspaceId;
    if (globalId !== currentWorkspaceId) {
      currentWorkspaceId = globalId;
      const ids = e.detail.workspaceIds || [];
      if (ids.length) localStorage.setItem("mindful_workspace_ids", JSON.stringify(ids));
      document.getElementById("wsSearch").value = "";
      showSkeleton();
      loadWorkspaces();
      loadTodos();
    }
  });
}

function showSkeleton() {
  document.getElementById("skeletonList").style.display = "flex";
  document.getElementById("taskList").innerHTML = "";
}

function hideSkeleton() {
  document.getElementById("skeletonList").style.display = "none";
}

async function loadTodos() {
    let url = `${API_BASE}/todos?status=${effectiveFilter()}`;
    if (currentWorkspaceId) {
      // Nutze workspace_ids aus localStorage (vom Sidebar-Selektions-Event gesetzt)
      const stored = localStorage.getItem("mindful_workspace_ids");
      if (stored) {
        const ids = JSON.parse(stored);
        if (ids.length) url += `&workspace_ids=${ids.join(",")}`;
      } else {
        url += `&workspace_id=${currentWorkspaceId}`;
      }
    }

  const res = await authFetch(url);
  if (!res || !res.ok) return;

  const todos = await res.json();
  const list = document.getElementById("taskList");

  if (todos.length === 0) {
    hideSkeleton();
    const isFiltered = currentWorkspaceId || currentStatusFilter !== "offen";
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><i class="fas fa-check-circle"></i></div>
      <h3>Alles erledigt!</h3>
      <p>${isFiltered ? "Keine offenen Aufgaben gefunden" : "Noch keine Aufgaben vorhanden"}</p>
      <button class="btn btn-primary" onclick="openEditor()">
        <i class="fas fa-plus"></i> Erste Aufgabe erstellen
      </button>
    </div>`;
    document.getElementById("taskCountText").textContent = "0 Aufgaben";
    return;
  }

  const now = new Date();
  list.innerHTML = todos
    .map((todo) => {
      const wsc = WORKSPACE_COLORS[todo.workspace_farbe] || "#d0c8bc";
      const prio = todo.prioritaet || "mittel";
      const isOverdue = todo.faellig && new Date(todo.faellig) < now && todo.status !== "erledigt";
      const dueDate = todo.faellig ? todo.faellig.split("T")[0] : "";
      return `
    <div class="task-item" draggable="true" data-id="${todo.id}" data-priority="${prio}" onclick='editTask(${JSON.stringify(todo).replace(/"/g, "&quot;").replace(/'/g, "&#39;")}, event)'>
      <div class="task-check${todo.status === "erledigt" ? " checked" : ""}" data-id="${todo.id}" onclick="event.stopPropagation(); toggleDone(${todo.id})">
        <i class="fas fa-check"></i>
      </div>
      <div class="task-body">
        <div class="task-row1">
          <span class="task-title${todo.status === "erledigt" ? " done" : ""}">${todo.titel}</span>
          ${dueDate ? `<span class="task-due-tag${isOverdue ? " overdue" : ""}"><i class="far fa-calendar"></i> ${dueDate}</span>` : ""}
        </div>
        ${todo.beschreibung ? `<div class="task-desc">${todo.beschreibung}</div>` : ""}
        <div class="task-meta">
          <span class="task-ws-tag">
            <span class="task-ws-tag-dot" style="background:${wsc}"></span>
            ${todo.workspace_name || "Allgemein"}
          </span>
        </div>
      </div>
    </div>
  `;
    })
    .join("");

  hideSkeleton();
  document.getElementById("taskCountText").textContent =
    `${todos.length} Aufgabe${todos.length !== 1 ? "n" : ""}`;

  applyTaskDnD();
}

function applyTaskDnD() {
  document.querySelectorAll(".task-item").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      dragTaskId = el.dataset.id;
      el.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.id);
    });
    el.addEventListener("dragend", () => {
      dragTaskId = null;
      el.classList.remove("dragging");
      document.querySelectorAll(".status-tile.drag-over").forEach((t) => t.classList.remove("drag-over"));
    });
  });
}

function setupStatusDnD() {
  document.querySelectorAll(".status-tile").forEach((tile) => {
    tile.addEventListener("dragover", (e) => {
      if (!dragTaskId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      tile.classList.add("drag-over");
    });
    tile.addEventListener("dragleave", () => {
      tile.classList.remove("drag-over");
    });
    tile.addEventListener("drop", (e) => {
      e.preventDefault();
      tile.classList.remove("drag-over");
      const id = dragTaskId;
      if (!id) return;
      const status = tile.dataset.status;
      if (!status) return;
      moveTaskToStatus(parseInt(id), status);
    });
  });
}

async function moveTaskToStatus(id, status) {
  const res = await authFetch(`${API_BASE}/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  if (res && res.ok) {
    showToast(`Aufgabe verschoben`, "success");

    if (status === "in arbeit") {
      const todo = await fetchTodoById(id);
      if (todo) openDetailPanel(todo);
    }

    loadTodos();
    loadStatusCounts();
  }
}

function switchFilter(status) {
  currentStatusFilter = status;
  document.querySelectorAll(".status-tile").forEach((t) => t.classList.remove("active"));
  const tile = document.querySelector(`.status-tile[data-status="${status}"]`);
  if (tile) tile.classList.add("active");
  document.getElementById("currentViewTitle").textContent =
    status === "offen" ? "Offene Aufgaben" :
    status === "in arbeit" ? "In Arbeit" :
    status === "erledigt" ? "Erledigt" : "Aufgaben";
}

async function fetchTodoById(id) {
  const res = await authFetch(`${API_BASE}/todos?status=alle`);
  if (!res || !res.ok) return null;
  const todos = await res.json();
  return todos.find((t) => t.id == id) || null;
}

async function toggleDone(id) {
  const url = `${API_BASE}/todos?status=alle`;
  const res = await authFetch(url);
  if (!res || !res.ok) return;
  const allTodos = await res.json();
  const todo = allTodos.find((t) => t.id == id);
  if (!todo) return;

  const newStatus = todo.status === "erledigt" ? "offen" : "erledigt";
  const saveRes = await authFetch(`${API_BASE}/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status: newStatus }),
  });
  if (saveRes && saveRes.ok) {
    showToast(newStatus === "erledigt" ? "Aufgabe erledigt" : "Aufgabe wieder geöffnet", "success");
    loadTodos();
    loadStatusCounts();
  }
}

async function saveTask() {
  const id = document.getElementById("editTaskId").value;
  const prioInput = document.querySelector('input[name="prio"]:checked');
  const todoData = {
    titel: document.getElementById("taskTitle").value,
    beschreibung: document.getElementById("taskDesc").value,
    workspace_id: document.getElementById("taskWorkspaceSelect").value || null,
    prioritaet: prioInput ? prioInput.value : "mittel",
    status: document.getElementById("taskStatus").value,
    faellig: document.getElementById("taskDueDate").value || null,
  };

  if (!todoData.titel.trim()) {
    showToast("Bitte einen Titel eingeben", "error");
    return;
  }

  const res = await authFetch(
    id ? `${API_BASE}/todos/${id}` : `${API_BASE}/todos`,
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(todoData),
    },
  );

  if (res && res.ok) {
    showToast(id ? "Aufgabe aktualisiert" : "Aufgabe erstellt", "success");
    closeEditor();
    loadTodos();
    loadStatusCounts();
  } else {
    const err = res ? await res.json().catch(() => ({})) : {};
    showToast(err.error || "Fehler beim Speichern", "error");
  }
}

async function deleteTask() {
  const id = document.getElementById("editTaskId").value;
  if (!id) return;
  if (!confirm("Wirklich löschen?")) return;

  const res = await authFetch(`${API_BASE}/todos/${id}`, { method: "DELETE" });
  if (res && res.ok) {
    showToast("Aufgabe gelöscht", "success");
    closeEditor();
    loadTodos();
    loadStatusCounts();
  }
}

function editTask(todo, event) {
  if (event && event.target.closest(".task-check")) return;

  if (todo.status === "in arbeit") {
    document.querySelectorAll(".task-item").forEach((el) => el.classList.remove("active"));
    const item = event?.target?.closest?.(".task-item");
    if (item) item.classList.add("active");
    openDetailPanel(todo);
    return;
  }

  document.getElementById("editTaskId").value = todo.id;
  document.getElementById("taskTitle").value = todo.titel;
  document.getElementById("taskDesc").value = todo.beschreibung || "";
  document.getElementById("taskWorkspaceSelect").value = todo.workspace_id || "";
  document.getElementById("taskStatus").value = todo.status || "offen";
  document.getElementById("taskDueDate").value = todo.faellig ? todo.faellig.split("T")[0] : "";
  document.getElementById("deleteBtn").style.display = "block";
  document.getElementById("editorTitle").textContent = "Aufgabe bearbeiten";

  const prioRadio = document.querySelector(`input[name="prio"][value="${todo.prioritaet || "mittel"}"]`);
  if (prioRadio) prioRadio.checked = true;

  document.querySelectorAll(".task-item").forEach((el) => el.classList.remove("active"));
  const item = event?.target?.closest?.(".task-item");
  if (item) item.classList.add("active");

  openEditor();
}

function openEditor() {
  if (!document.getElementById("editTaskId").value) {
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDesc").value = "";
    document.getElementById("taskDueDate").value = "";
    document.getElementById("taskWorkspaceSelect").value = currentWorkspaceId || "";
    document.getElementById("taskStatus").value = "offen";
    document.getElementById("deleteBtn").style.display = "none";
    document.getElementById("editorTitle").textContent = "Neue Aufgabe";
    const midRadio = document.querySelector('input[name="prio"][value="mittel"]');
    if (midRadio) midRadio.checked = true;
  }
  document.getElementById("modalOverlay").classList.add("open");
  setTimeout(() => document.getElementById("taskTitle").focus(), 100);
}

function closeEditor() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.getElementById("editTaskId").value = "";
  document.querySelectorAll(".task-item").forEach((el) => el.classList.remove("active"));
}

async function setupUser() {
  const res = await authFetch(`${API_BASE}/auth/me`);
  if (res && res.ok) {
    const user = await res.json();
    const nameEl = document.getElementById("userName");
    if (nameEl) nameEl.textContent = user.name;
  }
}

async function loadWorkspaces() {
  const res = await authFetch(`${API_BASE}/workspaces`);
  if (!res || !res.ok) return;
  const workspaces = await res.json();
  workspaceCache = workspaces;

  const select = document.getElementById("taskWorkspaceSelect");
  select.innerHTML =
    '<option value="">Kein Workspace</option>' +
    workspaces
      .map((w) => `<option value="${w.id}">${w.name}</option>`)
      .join("");

  const makeItem = (id, label, color, isActive) => `
    <div class="workspace-item${isActive ? " active" : ""}" onclick="selectWorkspace(${id})">
      <span class="ws-item-dot" style="background:${color}"></span>
      <span class="workspace-name">${label}</span>
      <span class="ws-item-check"><i class="fas fa-check"></i></span>
    </div>`;

  let wsHtml = makeItem(null, "Alle", "#999", !currentWorkspaceId);

  wsHtml += workspaces
    .map((w) =>
      makeItem(w.id, w.name, WORKSPACE_COLORS[w.farbe] || "#ccc", currentWorkspaceId == w.id),
    )
    .join("");

  document.getElementById("workspaceList").innerHTML = wsHtml;

  if (currentWorkspaceId) {
    const active = workspaces.find((w) => w.id == currentWorkspaceId);
    if (active) {
      document.getElementById("wsSelDot").style.background = WORKSPACE_COLORS[active.farbe] || "#999";
      document.getElementById("wsSelName").textContent = active.name;
    }
  } else {
    document.getElementById("wsSelDot").style.background = "#999";
    document.getElementById("wsSelName").textContent = "Alle";
  }

  await loadStatusCounts();
}

async function loadStatusCounts() {
  let url = `${API_BASE}/todos?status=alle`;
  if (currentWorkspaceId) {
    const stored = localStorage.getItem("mindful_workspace_ids");
    if (stored) {
      const ids = JSON.parse(stored);
      if (ids.length) url += `&workspace_ids=${ids.join(",")}`;
    } else {
      url += `&workspace_id=${currentWorkspaceId}`;
    }
  }
  const res = await authFetch(url);
  if (!res || !res.ok) return;
  const todos = await res.json();

  const openCount = todos.filter((t) => t.status === "offen").length;
  const progressCount = todos.filter((t) => t.status === "in arbeit").length;
  const doneCount = todos.filter((t) => t.status === "erledigt").length;
  const total = openCount + progressCount + doneCount;

  document.getElementById("countOpen").textContent = openCount;
  document.getElementById("countProgress").textContent = progressCount;
  document.getElementById("countDone").textContent = doneCount;

  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  document.getElementById("progressPct").textContent = `${pct}%`;
  document.getElementById("progressFill").style.width = `${pct}%`;
}

window.filterWorkspaces = function () {
  const q = document.getElementById("wsSearch").value.toLowerCase();
  document.querySelectorAll("#workspaceList .workspace-item").forEach((el) => {
    const name = el.querySelector(".workspace-name")?.textContent?.toLowerCase() || "";
    el.style.display = name.includes(q) ? "flex" : "none";
  });
};

window.quickCreateWorkspace = async function () {
  const name = document.getElementById("wsNewName").value.trim();
  const activeDot = document.querySelector("#wsNewColors .ws-color-dot.active");
  const farbe = activeDot ? activeDot.dataset.color : "orange";
  if (!name) {
    showToast("Bitte einen Namen eingeben", "error");
    return;
  }

  const res = await authFetch(`${API_BASE}/workspaces`, {
    method: "POST",
    body: JSON.stringify({ name, farbe }),
  });
  if (res && res.ok) {
    document.getElementById("wsNewName").value = "";
    showToast("Workspace erstellt", "success");
    const data = await res.json();
    currentWorkspaceId = data.id;
    loadWorkspaces();
    loadTodos();
    document.getElementById("wsDropdown").classList.remove("open");
    document.getElementById("wsSelector").classList.remove("open");
  }
};

window.selectWorkspace = (id) => {
  if (currentWorkspaceId === id) {
    currentWorkspaceId = null;
  } else {
    currentWorkspaceId = id;
  }
  document.getElementById("wsSearch").value = "";
  const active = id ? workspaceCache.find((w) => w.id == id) : null;
  document.getElementById("currentViewTitle").textContent =
    active ? `${active.name} — Aufgaben` : "Aufgaben";
  document.querySelectorAll(".status-tile").forEach((t) => t.classList.remove("active"));
  document.querySelector('.status-tile[onclick*="offen"]')?.classList.add("active");
  showSkeleton();
  loadWorkspaces();
  loadTodos();
  document.getElementById("wsDropdown").classList.remove("open");
  document.getElementById("wsSelector").classList.remove("open");
};

window.filterStatus = (status, event) => {
  currentStatusFilter = status;
  document.querySelectorAll(".status-tile").forEach((t) => t.classList.remove("active"));
  event.currentTarget.classList.add("active");
  document.getElementById("currentViewTitle").textContent =
    status === "offen" ? "Offene Aufgaben" :
    status === "in arbeit" ? "In Arbeit" :
    status === "erledigt" ? "Erledigt" : "Aufgaben";
  showSkeleton();
  loadTodos();
};

window.saveTask = saveTask;
window.deleteTask = deleteTask;
window.closeEditor = closeEditor;
window.openEditor = openEditor;
window.editTask = editTask;
window.toggleDone = toggleDone;

/* ====== KONTEXTMENÜ ====== */
(function () {
  let ctxTaskId = null;

  function closeCtxMenu() {
    const menu = document.getElementById("ctxMenu");
    if (menu) menu.classList.remove("open");
    ctxTaskId = null;
  }

  document.addEventListener("click", closeCtxMenu);

  document.addEventListener("contextmenu", (e) => {
    const taskEl = e.target.closest(".task-item");
    if (!taskEl) { closeCtxMenu(); return; }
    e.preventDefault();
    e.stopPropagation();

    const taskId = parseInt(taskEl.dataset.id);
    const isDone = taskEl.classList.contains("done") || taskEl.querySelector(".task-check.checked") !== null;
    ctxTaskId = taskId;

    document.getElementById("ctxToggleLabel").textContent = isDone ? "Wieder öffnen" : "Als erledigt markieren";

    const menu = document.getElementById("ctxMenu");
    menu.querySelector("[data-action='edit']").onclick = () => {
      closeCtxMenu();
      taskEl.click();
    };
    menu.querySelector("[data-action='toggle-done']").onclick = () => {
      closeCtxMenu();
      toggleDone(taskId);
    };
    menu.querySelector("[data-action='delete']").onclick = () => {
      closeCtxMenu();
      document.getElementById("editTaskId").value = taskId;
      deleteTask();
    };

    const x = Math.min(e.clientX, window.innerWidth - menu.offsetWidth - 8);
    const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 8);
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.classList.add("open");
  });
})();

/* ====== DETAIL PANEL ====== */
let currentDetailTask = null;

window.openDetailPanel = function (todo) {
  currentDetailTask = todo;

  document.getElementById("dpStatusBadge").textContent = todo.status;
  document.getElementById("dpStatusBadge").className = "dp-status-badge " + (todo.status === "in arbeit" ? "in-arbeit" : todo.status);
  document.getElementById("dpTitle").textContent = todo.titel;
  document.getElementById("dpDesc").textContent = todo.beschreibung || "Keine Beschreibung";
  document.getElementById("dpDesc").style.display = todo.beschreibung ? "block" : "none";

  renderSubtasks(todo.schritte);

  document.getElementById("taskListCard").classList.add("hidden");
  document.getElementById("detailPanel").classList.add("open");
  document.getElementById("pomoPanel").classList.add("open");
  window.startGlobalTimer(todo);
};

window.closeDetailPanel = function () {
  currentDetailTask = null;
  document.getElementById("taskListCard").classList.remove("hidden");
  document.getElementById("detailPanel").classList.remove("open");
  document.getElementById("pomoPanel").classList.remove("open");
  stopGlobalTimer();
};

/* ====== SUBTASKS ====== */
function renderSubtasks(schritte) {
  const list = document.getElementById("dpSubtaskList");
  if (!schritte || schritte.length === 0) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted)">Keine Schritte</div>';
    return;
  }
  list.innerHTML = schritte
    .map(
      (s, i) => `
    <div class="dp-subtask-item">
      <div class="dp-sub-check${s.done ? " done" : ""}" onclick="toggleSubtask(${i})">
        ${s.done ? '<i class="fas fa-check"></i>' : ""}
      </div>
      <span class="dp-sub-text${s.done ? " done" : ""}">${s.text}</span>
      <button class="dp-sub-del" onclick="deleteSubtask(${i})"><i class="fas fa-times"></i></button>
    </div>
  `,
    )
    .join("");
}

window.toggleSubtask = async function (idx) {
  if (!currentDetailTask) return;
  const schritte = currentDetailTask.schritte || [];
  if (!schritte[idx]) return;
  schritte[idx].done = !schritte[idx].done;
  await saveSubtasks(schritte);
};

window.deleteSubtask = async function (idx) {
  if (!currentDetailTask) return;
  const schritte = currentDetailTask.schritte || [];
  schritte.splice(idx, 1);
  await saveSubtasks(schritte);
};

window.addSubtask = async function () {
  if (!currentDetailTask) return;
  const input = document.getElementById("dpSubInput");
  const text = input.value.trim();
  if (!text) return;
  const schritte = currentDetailTask.schritte || [];
  schritte.push({ text, done: false });
  input.value = "";
  await saveSubtasks(schritte);
};

async function saveSubtasks(schritte) {
  if (!currentDetailTask) return;
  currentDetailTask.schritte = schritte;
  renderSubtasks(schritte);
  await authFetch(`${API_BASE}/todos/${currentDetailTask.id}`, {
    method: "PUT",
    body: JSON.stringify({ schritte: JSON.stringify(schritte) }),
  });
}

/* ====== POMODORO TIMER ====== */
let pomoInterval = null;
let pomoRemaining = 1500;
let pomoDuration = 1500;
let pomoRunning = false;

window.togglePomo = function () {
  const btn = document.getElementById("pomoStartBtn");
  if (pomoRunning) {
    clearInterval(pomoInterval);
    pomoRunning = false;
    btn.innerHTML = '<i class="fas fa-play"></i> Start';
    return;
  }
  if (pomoRemaining <= 0) {
    pomoRemaining = pomoDuration;
    updatePomoDisplay();
  }
  pomoRunning = true;
  btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  pomoInterval = setInterval(() => {
    pomoRemaining--;
    if (pomoRemaining <= 0) {
      clearInterval(pomoInterval);
      pomoRunning = false;
      pomoRemaining = 0;
      btn.innerHTML = '<i class="fas fa-play"></i> Start';
      showToast("Pomodoro abgeschlossen!", "success");
      authFetch(`${API_BASE}/pomodoro`, {
        method: "POST",
        body: JSON.stringify({
          todo_id: currentDetailTask ? currentDetailTask.id : null,
          duration_seconds: pomoDuration,
        }),
      });
    }
    updatePomoDisplay();
  }, 1000);
};

window.resetPomo = function () {
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoRemaining = pomoDuration;
  document.getElementById("pomoStartBtn").innerHTML = '<i class="fas fa-play"></i> Start';
  updatePomoDisplay();
};

window.setPomoTime = function (seconds) {
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoDuration = seconds;
  pomoRemaining = seconds;
  document.getElementById("pomoStartBtn").innerHTML = '<i class="fas fa-play"></i> Start';
  document.querySelectorAll(".pomo-dur-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.pomo-dur-btn[onclick*="${seconds}"]`)?.classList.add("active");
  updatePomoDisplay();
};

function updatePomoDisplay() {
  const m = String(Math.floor(pomoRemaining / 60)).padStart(2, "0");
  const s = String(pomoRemaining % 60).padStart(2, "0");
  document.getElementById("pomoTime").textContent = `${m}:${s}`;

  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - pomoRemaining / pomoDuration);
  document.getElementById("pomoRing").style.strokeDashoffset = offset;
}

window.finishTask = async function () {
  if (!currentDetailTask) return;
  const res = await authFetch(`${API_BASE}/todos/${currentDetailTask.id}`, {
    method: "PUT",
    body: JSON.stringify({ status: "erledigt" }),
  });
  if (res && res.ok) {
    showToast("Aufgabe erledigt!", "success");
    closeDetailPanel();
    loadTodos();
    loadStatusCounts();
  }
};

document.addEventListener("DOMContentLoaded", init);
