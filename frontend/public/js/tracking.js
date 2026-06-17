let _trackingTimer = null;
let _trackingEntryId = null;

async function initTracking() {
  const user = await checkAuthStatus();
  if (!user) return;
  renderUserInfo(user);
  await loadTasks();
  await loadActive();
  await loadToday();
}

async function loadTasks() {
  try {
    const res = await authFetch(`${API_BASE}/todos?status=alle`);
    if (!res) return;
    const data = await res.json();
    const sel = document.getElementById("trackingTaskSelect");
    sel.innerHTML = '<option value="">– Aufgabe wählen –</option>';
    data.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.titel;
      if (t.workspace_name) opt.textContent += ` (${t.workspace_name})`;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error("Fehler beim Laden der Aufgaben:", err);
  }
}

async function loadActive() {
  try {
    const res = await authFetch(`${API_BASE}/zeit/active`);
    if (!res) return;
    const data = await res.json();
    if (data && data.id) {
      _trackingEntryId = data.id;
      showActiveTimer(data);
    } else {
      hideActiveTimer();
    }
  } catch {}
}

function showActiveTimer(data) {
  const card = document.getElementById("trackingTimerCard");
  const taskEl = document.getElementById("trackingTimerTask");
  const timeEl = document.getElementById("trackingTimerTime");
  const startCard = document.getElementById("trackingStartCard");

  if (!card || !timeEl) return;
  card.style.display = "flex";
  if (startCard) startCard.style.display = "none";
  taskEl.textContent = data.todo_titel || data.description || "Keine Aufgabe";
  const start = new Date(data.start_time);

  clearInterval(_trackingTimer);
  _trackingTimer = setInterval(() => {
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    timeEl.textContent = formatDuration(diff);
  }, 1000);
}

function hideActiveTimer() {
  const card = document.getElementById("trackingTimerCard");
  const startCard = document.getElementById("trackingStartCard");
  if (card) card.style.display = "none";
  if (startCard) startCard.style.display = "block";
  clearInterval(_trackingTimer);
  _trackingTimer = null;
  _trackingEntryId = null;
}

window.startTracking = async function () {
  const sel = document.getElementById("trackingTaskSelect");
  const custom = document.getElementById("trackingCustomTask");
  const desc = document.getElementById("trackingDescription");
  const customTask = custom.value.trim();
  const todoId = sel.value || null;
  const note = desc.value.trim() || null;

  let description;
  if (todoId) {
    description = note;
  } else if (customTask) {
    description = customTask;
    if (note) description += " — " + note;
  } else {
    showToast("Bitte wähle eine Aufgabe aus oder gib einen Namen ein.", "error");
    return;
  }

  const res = await authFetch(`${API_BASE}/zeit/start`, {
    method: "POST",
    body: JSON.stringify({ todo_id: todoId, description }),
  });
  if (res && res.ok) {
    const data = await res.json();
    _trackingEntryId = data.id;
    showActiveTimer(data);
    custom.value = "";
    desc.value = "";
  } else if (res) {
    const err = await res.json().catch(() => ({}));
    showToast(err.error || "Fehler beim Starten", "error");
  }
};

window.stopTracking = async function () {
  const res = await authFetch(`${API_BASE}/zeit/stop`, {
    method: "POST",
  });
  if (res && res.ok) {
    showToast("Zeit gestoppt", "success");
    hideActiveTimer();
    await loadToday();
  }
};

async function loadToday() {
  try {
    const res = await authFetch(`${API_BASE}/zeit/today`);
    if (!res) return;
    const data = await res.json();
    renderEntries(data.entries);
    const total = document.getElementById("trackingTotalTime");
    if (total) total.textContent = formatDurationShort(data.total_seconds);
  } catch {}
}

function renderEntries(entries) {
  const list = document.getElementById("trackingEntriesList");
  if (!list) return;

  if (!entries || entries.length === 0) {
    list.innerHTML = '<div class="empty-entries"><i class="fas fa-clock"></i><p>Heute noch keine Einträge</p></div>';
    return;
  }

  list.innerHTML = entries.map(e => {
    const isActive = !e.end_time;
    const dur = isActive ? 0 : (e.duration_seconds || 0);
    const start = new Date(e.start_time);
    const timeStr = start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const isCustom = !e.todo_titel && e.description;
    const title = e.todo_titel || e.description || "Keine Aufgabe";
    const metaDesc = isCustom ? "" : e.description;
    return `<div class="tracking-entry${isActive ? " active" : ""}">
      <div class="tracking-entry-icon ${isActive ? "" : "stopped"}">
        <i class="fas ${isActive ? "fa-play" : "fa-stop"}"></i>
      </div>
      <div class="tracking-entry-body">
        <div class="tracking-entry-title${e.todo_titel ? "" : " empty"}">${escHtml(title)}</div>
        <div class="tracking-entry-meta">${timeStr} ${metaDesc ? "· " + escHtml(metaDesc) : ""}</div>
      </div>
      <span class="tracking-entry-duration">${isActive ? "Läuft" : formatDurationShort(dur)}</span>
      <button class="tracking-entry-delete" onclick="deleteEntry(${e.id})" title="Löschen"><i class="fas fa-trash"></i></button>
    </div>`;
  }).join("");
}

window.deleteEntry = async function (id) {
  if (!confirm("Eintrag löschen?")) return;
  const res = await authFetch(`${API_BASE}/zeit/${id}`, { method: "DELETE" });
  if (res && res.ok) {
    showToast("Eintrag gelöscht", "success");
    await loadToday();
    await loadActive();
  }
};

function formatDuration(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDurationShort(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

document.addEventListener("DOMContentLoaded", initTracking);
