// ─── State ───
let _habits = [];
let _todayHabits = [];
let _categories = new Set();

// ─── Init ───
document.addEventListener("DOMContentLoaded", () => {
  loadHabits();
});

async function loadHabits() {
  const [all, today] = await Promise.all([
    apiFetch("habits"),
    apiFetch("habits/today"),
  ]);
  if (all) {
    _habits = all;
    _categories = new Set(all.filter(h => h.category).map(h => h.category));
  }
  if (today) _todayHabits = today;
  renderAll();
  renderToday();
}

function escAttr(v) {
  if (v == null) return "";
  return String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function formatStreak(s) {
  if (!s) return "0";
  if (s === 1) return "1 Tag";
  return s + " Tage";
}

function priorityColor(p) {
  if (p === "high") return "#ef4444";
  if (p === "medium") return "#f59e0b";
  return "#22c55e";
}

function priorityLabel(p) {
  if (p === "high") return "Hoch";
  if (p === "medium") return "Mittel";
  return "Niedrig";
}

// ─── Heute ───
function renderToday() {
  const list = document.getElementById("habitsTodayList");
  if (!list) return;

  if (!_todayHabits.length) {
    list.innerHTML = `<div class="habits-empty">
      <i class="fas fa-star"></i>
      <p>Keine Habits für heute. Gut gemacht!</p>
    </div>`;
    return;
  }

  const now = new Date();
  const curTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  list.innerHTML = _todayHabits.map(h => {
    const isInWindow = (!h.time_start || curTime >= h.time_start) && (!h.time_end || curTime <= h.time_end);
    const windowStr = h.time_start && h.time_end
      ? `${h.time_start}–${h.time_end}`
      : h.time_start
        ? `ab ${h.time_start}`
        : h.time_end
          ? `bis ${h.time_end}`
          : "";
    
    const completed = h.completed ? "done" : "";
    const activeWindow = isInWindow && !h.completed ? "active-window" : "";
    
    return `<div class="habit-card habit-today ${completed} ${activeWindow}" style="--hc:${h.color || "#6366f1"}">
      <div class="hc-left">
        <button class="hc-toggle ${h.completed ? "checked" : ""}" onclick="toggleHabit(${h.id})">
          ${h.completed ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>'}
        </button>
        <i class="fas ${h.icon || "fa-check-circle"}" style="color:${h.color || "#6366f1"}"></i>
        <div class="hc-info">
          <span class="hc-name">${escAttr(h.name)}</span>
          <div class="hc-meta">
            ${windowStr ? `<span class="hc-window"><i class="far fa-clock"></i> ${escAttr(windowStr)}</span>` : ""}
            ${h.current_streak ? `<span class="hc-streak"><i class="fas fa-fire"></i> ${formatStreak(h.current_streak)}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="hc-right">
        ${isInWindow && !h.completed ? '<span class="hc-badge">Jetzt</span>' : ""}
        ${h.completed ? '<span class="hc-done-label"><i class="fas fa-check"></i> Erledigt</span>' : ""}
      </div>
    </div>`;
  }).join("");
}

// ─── Alle Habits ───
function renderAll() {
  const list = document.getElementById("habitsList");
  if (!list) return;

  if (!_habits.length) {
    list.innerHTML = `<div class="habits-empty">
      <i class="fas fa-plus-circle"></i>
      <p>Noch keine Habits angelegt. Klicke auf "Neues Habit" um zu beginnen.</p>
    </div>`;
    return;
  }

  function typLabel(typ, days) {
    if (typ === "daily") return "Täglich";
    if (typ === "interval") return `Alle ${days} Tage`;
    if (typ === "weekdays") return "Wochentage (Mo–Fr)";
    if (typ === "weekends") return "Wochenende (Sa–So)";
    if (typ === "weekly") return "Wöchentlich";
    return typ;
  }

  list.innerHTML = _habits.map(h => {
    const winStr = h.time_start && h.time_end
      ? `${h.time_start} – ${h.time_end}`
      : h.time_start
        ? `ab ${h.time_start}`
        : h.time_end
          ? `bis ${h.time_end}`
          : "Ganztägig";
    
    const priorityBadge = h.priority ? `<span class="habit-priority" style="color:${priorityColor(h.priority)}" title="${priorityLabel(h.priority)}">${["low", "medium", "high"].indexOf(h.priority) === 0 ? "⬤" : ["low", "medium", "high"].indexOf(h.priority) === 1 ? "⬤⬤" : "⬤⬤⬤"}</span>` : "";
    
    return `<div class="habit-card" style="--hc:${h.color || "#6366f1"}">
      <div class="hc-left">
        <i class="fas ${h.icon || "fa-check-circle"}" style="color:${h.color || "#6366f1"}"></i>
        <div class="hc-info">
          <div class="hc-name-row">
            <span class="hc-name">${escAttr(h.name)}</span>
            ${priorityBadge}
          </div>
          <span class="hc-meta">
            <span class="hc-typ">${typLabel(h.typ, h.interval_days)}</span>
            <span class="hc-sep">·</span>
            <span class="hc-window"><i class="far fa-clock"></i> ${escAttr(winStr)}</span>
            ${h.category ? `<span class="hc-sep">·</span><span class="hc-cat"><i class="fas fa-tag"></i> ${escAttr(h.category)}</span>` : ""}
          </span>
          <div class="hc-stats">
            <span><i class="fas fa-fire"></i> ${h.longest_streak || 0}</span>
            <span><i class="fas fa-check"></i> ${h.total_completions || 0}</span>
          </div>
        </div>
      </div>
      <div class="hc-right">
        <button class="hc-edit-btn" onclick="openHabitEditor(${h.id})" title="Bearbeiten">
          <i class="fas fa-pencil-alt"></i>
        </button>
      </div>
    </div>`;
  }).join("");
}

// ─── Toggle ───
async function toggleHabit(id, notes = null) {
  const res = await apiFetch(`habits/${id}/toggle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
  if (res) {
    const h = _todayHabits.find(x => x.id === id);
    if (h) h.completed = res.completed ? 1 : 0;
    renderToday();
  }
}

// ─── Modal ───
function openHabitEditor(id) {
  const modal = document.getElementById("habitModal");
  const title = document.getElementById("habitEditorTitle");
  const deleteBtn = document.getElementById("habitDeleteBtn");
  const hId = document.getElementById("editHabitId");
  const name = document.getElementById("habitName");
  const desc = document.getElementById("habitDesc");
  const typ = document.getElementById("habitTyp");
  const interval = document.getElementById("habitIntervalDays");
  const tStart = document.getElementById("habitTimeStart");
  const tEnd = document.getElementById("habitTimeEnd");
  const reminder = document.getElementById("habitReminderTime");
  const cat = document.getElementById("habitCategory");
  const prio = document.getElementById("habitPriority");

  if (id != null) {
    const h = _habits.find(x => x.id === id);
    if (!h) return;
    title.textContent = "Habit bearbeiten";
    hId.value = h.id;
    name.value = h.name;
    desc.value = h.description || "";
    typ.value = h.typ;
    interval.value = h.interval_days || 2;
    tStart.value = h.time_start || "";
    tEnd.value = h.time_end || "";
    reminder.value = h.reminder_time || "";
    cat.value = h.category || "";
    prio.value = h.priority || "medium";
    deleteBtn.style.display = "";
    document.getElementById("habitIntervalField").style.display = h.typ === "interval" ? "" : "none";
    document.querySelectorAll(".hip-option").forEach(el => {
      el.classList.toggle("active", el.dataset.icon === (h.icon || "fa-check-circle"));
    });
    document.querySelectorAll(".hcp-option").forEach(el => {
      el.classList.toggle("active", el.dataset.color === (h.color || "#6366f1"));
    });
  } else {
    title.textContent = "Neues Habit";
    hId.value = "";
    name.value = "";
    desc.value = "";
    typ.value = "daily";
    interval.value = "2";
    tStart.value = "";
    tEnd.value = "";
    reminder.value = "";
    cat.value = "";
    prio.value = "medium";
    deleteBtn.style.display = "none";
    document.getElementById("habitIntervalField").style.display = "none";
    document.querySelectorAll(".hip-option").forEach((el, i) => el.classList.toggle("active", i === 0));
    document.querySelectorAll(".hcp-option").forEach((el, i) => el.classList.toggle("active", i === 0));
  }
  modal.style.display = "";
  name.focus();

  // Icon picker
  document.querySelectorAll(".hip-option").forEach(el => {
    el.onclick = () => {
      document.querySelectorAll(".hip-option").forEach(e => e.classList.remove("active"));
      el.classList.add("active");
    };
  });
  // Color picker
  document.querySelectorAll(".hcp-option").forEach(el => {
    el.onclick = () => {
      document.querySelectorAll(".hcp-option").forEach(e => e.classList.remove("active"));
      el.classList.add("active");
    };
  });
}

function closeHabitEditor() {
  document.getElementById("habitModal").style.display = "none";
}

function onHabitTypChange() {
  const typ = document.getElementById("habitTyp").value;
  document.getElementById("habitIntervalField").style.display = typ === "interval" ? "" : "none";
}

async function saveHabit() {
  const id = document.getElementById("editHabitId").value;
  const name = document.getElementById("habitName").value.trim();
  if (!name) { alert("Bitte einen Namen eingeben."); return; }

  const description = document.getElementById("habitDesc").value.trim() || null;
  const icon = document.querySelector(".hip-option.active")?.dataset.icon || "fa-check-circle";
  const color = document.querySelector(".hcp-option.active")?.dataset.color || "#6366f1";
  const typ = document.getElementById("habitTyp").value;
  const interval_days = parseInt(document.getElementById("habitIntervalDays").value) || 1;
  const time_start = document.getElementById("habitTimeStart").value || null;
  const time_end = document.getElementById("habitTimeEnd").value || null;
  const reminder_time = document.getElementById("habitReminderTime").value || null;
  const category = document.getElementById("habitCategory").value.trim() || null;
  const priority = document.getElementById("habitPriority").value || "medium";

  const body = { name, description, icon, color, typ, interval_days, time_start, time_end, reminder_time, category, priority };

  let res;
  if (id) {
    res = await apiFetch(`habits/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } else {
    res = await apiFetch("habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  if (res) {
    closeHabitEditor();
    loadHabits();
  }
}

async function deleteHabit() {
  const id = document.getElementById("editHabitId").value;
  if (!id) return;
  if (!confirm("Wirklich löschen? Dies kann nicht rückgängig gemacht werden.")) return;
  const res = await apiFetch(`habits/${id}`, { method: "DELETE" });
  if (res) {
    closeHabitEditor();
    loadHabits();
  }
}

// ─── API helper ───
async function apiFetch(endpoint, options = {}) {
  try {
    const url = `/api/${endpoint}`;
    if (options.body && typeof options.body === "object" && !options.headers?.["Content-Type"]) {
      if (!options.headers) options.headers = {};
      options.headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, {
      ...options,
      credentials: "include",
    });
    if (!res.ok) {
      console.error(`apiFetch: ${res.status} ${res.statusText} for ${endpoint}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`apiFetch Fehler (${endpoint}):`, err);
    return null;
  }
}
