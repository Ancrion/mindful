// ─── State ───
let currentDate = new Date();
let currentView = "month";
let events = [];
let editingEventId = null;

const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const DAYS_DE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const DAYS_FULL = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

// ─── Init ───
document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuthStatus();
  if (!user) return;
  renderUserInfo(user);

  initViewSwitch();
  await loadWorkspacesForCalendar();
  await loadEvents();
  updateWsFilterDisplay();
  initWorkspaceWatcher();

  const hash = window.location.hash.replace("#", "");
  if (hash) {
    const id = parseInt(hash);
    if (id) setTimeout(() => editEvent(id), 100);
  }
});

function getFilteredEvents() {
  if (!window.currentWorkspaceId) return events;
  return events.filter(e => e.workspace_id == window.currentWorkspaceId);
}

function initWorkspaceWatcher() {
  window.addEventListener("workspacechange", () => {
    updateWsFilterDisplay();
    renderView();
  });
}

function updateWsFilterDisplay() {
  // no-op: calendar filter removed
}

async function loadWorkspacesForCalendar() {
  if (window.workspaceCache.length > 0) {
    populateWsSelect();
    return;
  }
  const res = await authFetch(`${API_BASE}/workspaces`);
  if (res && res.ok) {
    window.workspaceCache = await res.json();
    populateWsSelect();
  }
}

function populateWsSelect() {
  const select = document.getElementById("evWorkspace");
  if (!select) return;
  select.innerHTML = '<option value="">Kein Workspace</option>' +
    window.workspaceCache.map(w => `<option value="${w.id}">${w.name}</option>`).join("");
}

window.onWsChange = function () {
  const select = document.getElementById("evWorkspace");
  const wsId = select.value;
  if (wsId) {
    const ws = window.workspaceCache.find(w => w.id == wsId);
    if (ws) {
      const color = WORKSPACE_COLORS[ws.farbe] || "#3B82F6";
      document.querySelectorAll(".color-dot").forEach(dot => {
        dot.classList.toggle("active", dot.dataset.color === color);
      });
    }
  }
};

async function loadEvents() {
  const res = await authFetch("/api/kalender");
  if (!res) return;
  events = await res.json();
  renderView();
}

// ─── View Switching ───
function initViewSwitch() {
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.dataset.view;
      renderView();
    });
  });
}

// ─── Navigation ───
function goToday() {
  currentDate = new Date();
  renderView();
}

function goPrev() {
  if (currentView === "month") currentDate.setMonth(currentDate.getMonth() - 1);
  else if (currentView === "week") currentDate.setDate(currentDate.getDate() - 7);
  else if (currentView === "day") currentDate.setDate(currentDate.getDate() - 1);
  else if (currentView === "year") currentDate.setFullYear(currentDate.getFullYear() - 1);
  renderView();
}

function goNext() {
  if (currentView === "month") currentDate.setMonth(currentDate.getMonth() + 1);
  else if (currentView === "week") currentDate.setDate(currentDate.getDate() + 7);
  else if (currentView === "day") currentDate.setDate(currentDate.getDate() + 1);
  else if (currentView === "year") currentDate.setFullYear(currentDate.getFullYear() + 1);
  renderView();
}

// ─── Master Render ───
function renderView() {
  const vp = document.getElementById("calViewport");
  const title = document.getElementById("calTitle");

  if (currentView === "month") {
    title.textContent = `${MONTHS_DE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    vp.innerHTML = renderMonth();
    bindMonthClicks();
  } else if (currentView === "week") {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const label = `${weekStart.getDate()}. ${MONTHS_DE[weekStart.getMonth()]} – ${weekEnd.getDate()}. ${MONTHS_DE[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
    title.textContent = label;
    vp.innerHTML = renderWeek(weekStart);
    bindWeekClicks();
  } else if (currentView === "day") {
    title.textContent = `${DAYS_FULL[currentDate.getDay()]}, ${currentDate.getDate()}. ${MONTHS_DE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    vp.innerHTML = renderDay(currentDate);
    bindDayClicks();
  } else if (currentView === "year") {
    title.textContent = currentDate.getFullYear();
    vp.innerHTML = renderYear();
    bindYearClicks();
  }
}

// ==========================================================
// MONATSANSICHT
// ==========================================================
function renderMonth() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  let html = `<div class="month-view">
    <div class="month-days-header">
      ${DAYS_DE.map(d => `<span>${d}</span>`).join("")}
    </div>
    <div class="month-grid">`;

  // Padding days from previous month
  for (let p = startPad - 1; p >= 0; p--) {
    const d = daysInPrev - p;
    html += `<div class="month-cell other-month" data-date="${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}"><div class="month-cell-date">${d}</div></div>`;
  }

  // Current month days
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isToday = sameDay(date, today);
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dayEvents = getFilteredEvents().filter(e => evStartsOnDate(e, date));
    html += `<div class="month-cell ${isToday ? "today" : ""}" data-date="${dateStr}">
      <div class="month-cell-date">${d}</div>`;
    dayEvents.slice(0, 3).forEach(ev => {
      const color = ev.farbe || "#3B82F6";
      const title = ev.titel;
      const wsColor = ev.workspace_farbe ? (WORKSPACE_COLORS[ev.workspace_farbe] || null) : null;
      const style = wsColor ? `background:${color};border-left:3px solid ${wsColor}` : `background:${color}`;
      if (ev.ganztag) {
        html += `<div class="month-event-all-day" style="${style}" data-id="${ev.id}">${title}</div>`;
      } else {
        html += `<div class="month-event" style="${style}" data-id="${ev.id}">${title}</div>`;
      }
    });
    if (dayEvents.length > 3) {
      html += `<div style="font-size:11px;color:#999;padding:2px 6px;">+${dayEvents.length-3} mehr</div>`;
    }
    html += `</div>`;
  }

  // Padding days from next month
  const totalCells = startPad + daysInMonth;
  const remaining = (7 - totalCells % 7) % 7;
  for (let d = 1; d <= remaining; d++) {
    html += `<div class="month-cell other-month" data-date="${year}-${String(month+2).padStart(2,"0")}-${String(d).padStart(2,"0")}"><div class="month-cell-date">${d}</div></div>`;
  }

  html += `</div></div>`;
  return html;
}

function bindMonthClicks() {
  document.querySelectorAll(".month-event, .month-event-all-day").forEach(el => {
    el.addEventListener("click", e => {
      if (_isDragging) return;
      e.stopPropagation();
      editEvent(parseInt(el.dataset.id));
    });
  });
  document.querySelectorAll(".month-cell").forEach(el => {
    el.addEventListener("click", () => {
      if (_isDragging) return;
      const d = new Date(el.dataset.date);
      if (!isNaN(d.getTime())) {
        currentDate = d;
        currentView = "week";
        document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
        [...document.querySelectorAll(".view-btn")].find(b => b.dataset.view === "week")?.classList.add("active");
        renderView();
      }
    });
  });
  setTimeout(initEventDrag, 50);
}

// ─── Jetzt-Linie ───
function getNowTop() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

// ─── Drag & Drop (Events verschieben) ───
let _isDragging = false;

function initEventDrag() {
  document.querySelectorAll(".week-event").forEach(el => {
    el.setAttribute("draggable", "true");
    el.addEventListener("dragstart", (e) => {
      if (e.target.closest(".ev-resize-handle")) return;
      _isDragging = true;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.id);
      el.classList.add("ev-dragging");
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("ev-dragging");
      document.querySelectorAll(".ev-drop-target").forEach(c => c.classList.remove("ev-drop-target"));
      setTimeout(() => { _isDragging = false; }, 0);
    });
  });

  document.querySelectorAll(".month-event, .month-event-all-day").forEach(el => {
    el.setAttribute("draggable", "true");
    el.addEventListener("dragstart", (e) => {
      _isDragging = true;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.id);
      el.classList.add("ev-dragging");
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("ev-dragging");
      document.querySelectorAll(".ev-drop-target").forEach(c => c.classList.remove("ev-drop-target"));
      setTimeout(() => { _isDragging = false; }, 0);
    });
  });

  document.querySelectorAll(".week-day-col, .day-col").forEach(el => {
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      el.classList.add("ev-drop-target");
    });
    el.addEventListener("dragleave", () => {
      el.classList.remove("ev-drop-target");
    });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("ev-drop-target");
      const evId = parseInt(e.dataTransfer.getData("text/plain"));
      if (!evId) return;
      const ev = events.find(ev => ev.id === evId);
      if (!ev) return;
      const newDateStr = el.dataset.date;
      if (!newDateStr) return;

      const rect = el.getBoundingClientRect();
      let y = e.clientY - rect.top;
      y = Math.max(0, Math.min(y, 1439));
      const totalMinutes = Math.round(y);
      let hours = Math.floor(totalMinutes / 60);
      let mins = Math.round(totalMinutes % 60 / 5) * 5;
      if (mins >= 60) { mins = 0; hours++; }
      hours = Math.max(0, Math.min(23, hours));

      const newStartStr = `${newDateStr}T${String(hours).padStart(2,"0")}:${String(mins).padStart(2,"0")}:00`;
      const dur = ev.dauer || 60;
      const newEnd = new Date(new Date(newStartStr).getTime() + dur * 60000);
      const newEndStr = `${newDateStr}T${String(newEnd.getHours()).padStart(2,"0")}:${String(newEnd.getMinutes()).padStart(2,"0")}:00`;

      authFetch(`/api/kalender/${evId}`, {
        method: "PUT",
        body: JSON.stringify({ start_datum: newStartStr, end_datum: newEndStr }),
      }).then(res => {
        if (res && res.ok) {
          ev.start_datum = newStartStr;
          ev.end_datum = newEndStr;
          renderView();
        }
      });
    });
  });

  document.querySelectorAll(".month-cell").forEach(el => {
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      el.classList.add("ev-drop-target");
    });
    el.addEventListener("dragleave", () => {
      el.classList.remove("ev-drop-target");
    });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("ev-drop-target");
      const evId = parseInt(e.dataTransfer.getData("text/plain"));
      if (!evId) return;
      const ev = events.find(ev => ev.id === evId);
      if (!ev) return;
      const newDateStr = el.dataset.date;
      if (!newDateStr) return;

      let newStartStr, newEndStr;
      if (ev.ganztag) {
        newStartStr = `${newDateStr}T00:00:00`;
        newEndStr = `${newDateStr}T23:59:59`;
      } else if (ev.start_datum) {
        const oldStart = new Date(ev.start_datum);
        newStartStr = `${newDateStr}T${String(oldStart.getHours()).padStart(2,"0")}:${String(oldStart.getMinutes()).padStart(2,"0")}:00`;
        if (ev.end_datum) {
          const oldEnd = new Date(ev.end_datum);
          newEndStr = `${newDateStr}T${String(oldEnd.getHours()).padStart(2,"0")}:${String(oldEnd.getMinutes()).padStart(2,"0")}:00`;
        } else {
          const dur = ev.dauer || 60;
          const ne = new Date(new Date(newStartStr).getTime() + dur * 60000);
          newEndStr = `${newDateStr}T${String(ne.getHours()).padStart(2,"0")}:${String(ne.getMinutes()).padStart(2,"0")}:00`;
        }
      } else {
        newStartStr = `${newDateStr}T00:00:00`;
        newEndStr = `${newDateStr}T23:59:59`;
      }

      authFetch(`/api/kalender/${evId}`, {
        method: "PUT",
        body: JSON.stringify({ start_datum: newStartStr, end_datum: newEndStr }),
      }).then(res => {
        if (res && res.ok) {
          ev.start_datum = newStartStr;
          ev.end_datum = newEndStr;
          renderView();
        }
      });
    });
  });
}

// ==========================================================
// WOCHENANSICHT
// ==========================================================
function renderWeek(weekStart) {
  const today = new Date();
  let html = `<div class="week-view">
    <div class="week-header">
      <div class="time-gutter"></div>`;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const isToday = sameDay(d, today);
    const name = DAYS_DE[d.getDay()];
    html += `<div class="week-day-header ${isToday ? "today" : ""}">
      <div class="wkd-name">${name}</div>
      <div class="wkd-number">${d.getDate()}</div>
    </div>`;
  }
  html += `</div><div class="week-body">`;

  // Time gutter
  html += `<div class="week-time-gutter">`;
  for (let h = 0; h < 24; h++) {
    html += `<div class="week-time-label" style="top:${h*60}px">${String(h).padStart(2,"0")}:00</div>`;
  }
  html += `<div class="now-line" style="top:${getNowTop()}px"></div>`;
  html += `</div>`;

  // Day columns
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const isToday = sameDay(d, today);
    html += `<div class="week-day-col ${isToday ? "today-col" : ""}" data-date="${fmtDate(d)}">`;
    const dayEvents = getFilteredEvents().filter(e => evStartsOnDate(e, d));
    dayEvents.forEach(ev => {
      const startH = ev.ganztag ? 0 : (ev.start_datum ? new Date(ev.start_datum).getHours() : 8);
      const startM = ev.ganztag ? 0 : (ev.start_datum ? new Date(ev.start_datum).getMinutes() : 0);
      const dur = ev.dauer || 60;
      const top = startH * 60 + startM;
      const height = Math.max(dur, 15);
      const color = ev.farbe || "#3B82F6";
      const wsColor = ev.workspace_farbe ? (WORKSPACE_COLORS[ev.workspace_farbe] || null) : null;
      html += `<div class="week-event" style="top:${top}px;height:${height}px;background:${color}" data-id="${ev.id}">
        ${wsColor ? `<span class="ev-ws-bar" style="background:${wsColor}"></span>` : ""}
        <strong>${ev.titel}</strong>`;
      if (!ev.ganztag && ev.ort) html += `${startH}:${String(startM).padStart(2,"0")} · ${ev.ort}`;
      else if (!ev.ganztag) html += `${startH}:${String(startM).padStart(2,"0")} Uhr`;
      else if (ev.ort) html += `${ev.ort}`;
      html += `</div>`;
    });
    html += `</div>`;
  }

  html += `</div></div>`;
  return html;
}

// ─── Drag Resize Events (Week/Day View) ───
let _resizeEvData = null;

function initEventResize() {
  document.querySelectorAll(".week-event").forEach(el => {
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "ev-resize-handle";
    el.appendChild(resizeHandle);
    
    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      _resizeEvData = {
        el: el,
        id: parseInt(el.dataset.id),
        startY: e.clientY,
        startHeight: el.offsetHeight,
        col: el.parentElement
      };
      document.addEventListener("mousemove", _onEvResizeMove);
      document.addEventListener("mouseup", _onEvResizeEnd);
    });
  });
}

function _onEvResizeMove(e) {
  if (!_resizeEvData) return;
  const dy = e.clientY - _resizeEvData.startY;
  const newHeight = Math.max(30, _resizeEvData.startHeight + dy);
  _resizeEvData.el.style.height = newHeight + "px";
}

function _onEvResizeEnd() {
  document.removeEventListener("mousemove", _onEvResizeMove);
  document.removeEventListener("mouseup", _onEvResizeEnd);
  if (!_resizeEvData) return;
  
  const newDur = Math.round(_resizeEvData.el.offsetHeight);
  const ev = events.find(e => e.id === _resizeEvData.id);
  if (ev && newDur !== (ev.dauer || 60)) {
    authFetch(`/api/kalender/${_resizeEvData.id}`, {
      method: "PUT",
      body: JSON.stringify({ dauer: newDur }),
    });
    ev.dauer = newDur;
  }
  _resizeEvData = null;
}

function bindWeekClicks() {
  document.querySelectorAll(".week-event").forEach(el => {
    el.addEventListener("click", e => {
      if (_isDragging) return;
      e.stopPropagation();
      editEvent(parseInt(el.dataset.id));
    });
  });
  document.querySelectorAll(".week-day-col").forEach(el => {
    el.addEventListener("dblclick", (e) => {
      if (e.target.closest(".week-event")) return;
      const date = el.dataset.date;
      currentDate = new Date(date + "T12:00:00");
      openEventModal();
    });
  });
  const existing = document.querySelectorAll(".ev-resize-handle");
  if (existing.length === 0) setTimeout(initEventResize, 50);
  setTimeout(initEventDrag, 50);
}

// ==========================================================
// TAGESANSICHT
// ==========================================================
function renderDay(date) {
  const today = new Date();
  const isToday = sameDay(date, today);
  const name = DAYS_FULL[date.getDay()];
  let html = `<div class="day-view">
    <div class="day-view-header">
      <div class="dv-name">${name}</div>
      <div class="dv-number">${date.getDate()}. ${MONTHS_DE[date.getMonth()]}</div>
    </div>
    <div class="day-body">
      <div class="day-time-gutter">`;
  for (let h = 0; h < 24; h++) {
    html += `<div class="week-time-label" style="top:${h*60}px">${String(h).padStart(2,"0")}:00</div>`;
  }
  html += `<div class="now-line" style="top:${getNowTop()}px"></div>`;
  html += `</div><div class="day-col ${isToday ? "today-col" : ""}" data-date="${fmtDate(date)}">`;
  const dayEvents = getFilteredEvents().filter(e => evStartsOnDate(e, date));
  dayEvents.forEach(ev => {
    const startH = ev.ganztag ? 0 : (ev.start_datum ? new Date(ev.start_datum).getHours() : 8);
    const startM = ev.ganztag ? 0 : (ev.start_datum ? new Date(ev.start_datum).getMinutes() : 0);
    const dur = ev.dauer || 60;
    const top = startH * 60 + startM;
    const height = Math.max(dur, 15);
    const color = ev.farbe || "#3B82F6";
    const wsColor = ev.workspace_farbe ? (WORKSPACE_COLORS[ev.workspace_farbe] || null) : null;
    html += `<div class="week-event" style="top:${top}px;height:${height}px;background:${color}" data-id="${ev.id}">
      ${wsColor ? `<span class="ev-ws-bar" style="background:${wsColor}"></span>` : ""}
      <strong>${ev.titel}</strong>`;
    if (!ev.ganztag) html += `${startH}:${String(startM).padStart(2,"0")} Uhr`;
    if (ev.ort) html += ` · ${ev.ort}`;
    html += `</div>`;
  });
  html += `</div></div></div>`;
  return html;
}

function bindDayClicks() {
  document.querySelectorAll(".week-event").forEach(el => {
    el.addEventListener("click", e => {
      if (_isDragging) return;
      e.stopPropagation();
      editEvent(parseInt(el.dataset.id));
    });
  });
  document.querySelectorAll(".day-col").forEach(el => {
    el.addEventListener("dblclick", () => {
      currentDate = new Date(el.dataset.date + "T12:00:00");
      openEventModal();
    });
  });
  setTimeout(initEventResize, 50);
  setTimeout(initEventDrag, 50);
}

// ==========================================================
// JAHRESANSICHT
// ==========================================================
function renderYear() {
  const year = currentDate.getFullYear();
  const today = new Date();
  let html = `<div class="year-view"><h2>${year}</h2><div class="year-grid">`;
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const startPad = firstDay.getDay();
    html += `<div class="year-month">
      <h3>${MONTHS_DE[m]}</h3>
      <div class="year-month-days">
        ${DAYS_DE.map(d => `<span class="ym-wday">${d}</span>`).join("")}`;
    for (let p = 0; p < startPad; p++) {
      html += `<span class="ym-day other"></span>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, m, d);
      const isToday = sameDay(dt, today);
      const dayEvents = getFilteredEvents().filter(e => evStartsOnDate(e, dt));
      const dotCount = Math.min(dayEvents.length, 3);
      let dots = "";
      if (dotCount > 0) {
        dots = '<span class="ym-dots">';
        for (let di = 0; di < dotCount; di++) {
          const color = dayEvents[di].farbe || "#3B82F6";
          dots += `<span class="ym-dot" style="background:${color}"></span>`;
        }
        dots += "</span>";
      }
      html += `<span class="ym-day ${isToday ? "today" : ""}" data-date="${fmtDate(dt)}">${d}${dots}</span>`;
    }
    html += `</div></div>`;
  }
  html += `</div></div>`;
  return html;
}

function bindYearClicks() {
  document.querySelectorAll(".ym-day:not(.other)").forEach(el => {
    el.addEventListener("click", () => {
      currentDate = new Date(el.dataset.date + "T12:00:00");
      currentView = "day";
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
      [...document.querySelectorAll(".view-btn")].find(b => b.dataset.view === "day")?.classList.add("active");
      renderView();
    });
  });
}

// ==========================================================
// EVENT MODAL
// ==========================================================
function openEventModal(eventDate, eventHour) {
  editingEventId = null;
  document.getElementById("evTitle").value = "";
  document.getElementById("evDescription").value = "";
  document.getElementById("evLocation").value = "";
  document.getElementById("evDuration").value = "60";
  document.getElementById("evRepeat").value = "none";
  document.getElementById("evReminder").value = "keine";
  document.getElementById("evAllDay").checked = false;
  document.getElementById("evDeleteBtn").style.display = "none";
  document.getElementById("evStartTime").disabled = false;
  document.getElementById("evEndTime").disabled = false;

  const d = eventDate || currentDate;
  document.getElementById("evDate").value = fmtDate(d);
  document.getElementById("evStartTime").value = (eventHour !== undefined ? String(eventHour).padStart(2,"0") : "10") + ":00";
  document.getElementById("evEndTime").value = (eventHour !== undefined ? String(eventHour+1).padStart(2,"0") : "11") + ":00";

  document.querySelectorAll(".color-dot").forEach(dot => dot.classList.remove("active"));
  document.querySelector(".color-dot").classList.add("active");

  document.getElementById("evWorkspace").value = window.currentWorkspaceId || "";

  document.getElementById("eventModalOverlay").classList.add("open");
}

function closeEventModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById("eventModalOverlay").classList.remove("open");
}

async function saveEventModal() {
  const titel = document.getElementById("evTitle").value.trim();
  if (!titel) { alert("Bitte gib einen Titel ein."); return; }

  const date = document.getElementById("evDate").value;
  const startTime = document.getElementById("evStartTime").value;
  const endTime = document.getElementById("evEndTime").value;
  const allDay = document.getElementById("evAllDay").checked;
  const ort = document.getElementById("evLocation").value.trim() || null;
  let dauer = parseInt(document.getElementById("evDuration").value);
  if (isNaN(dauer) || document.getElementById("evDuration").value === "custom") {
    dauer = parseInt(document.getElementById("evCustomDuration").value) || 60;
  }
  const wiederholung = document.getElementById("evRepeat").value;
  const erinnerung = document.getElementById("evReminder").value;
  const beschreibung = document.getElementById("evDescription").value.trim() || null;
  const farbe = document.querySelector(".color-dot.active")?.dataset.color || "#3B82F6";
  const workspace_id = document.getElementById("evWorkspace").value || null;

  const start_datum = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`;
  let end_datum = allDay ? `${date}T23:59:59` : `${date}T${endTime}:00`;

  let url = "/api/kalender";
  let method = "POST";

  if (editingEventId) {
    url = `/api/kalender/${editingEventId}`;
    method = "PUT";
  }

  const res = await authFetch(url, {
    method,
    body: JSON.stringify({ titel, beschreibung, start_datum, end_datum, farbe, ort, dauer, wiederholung, ganztag: allDay ? 1 : 0, erinnerung, workspace_id }),
  });

  if (res && res.ok) {
    closeEventModal();
    await loadEvents();
  } else {
    const err = await res?.json().catch(() => ({}));
    alert("Fehler: " + (err?.error || err?.message || "Unbekannt"));
  }
}

async function editEvent(id) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  editingEventId = id;

  document.getElementById("evTitle").value = ev.titel;
  document.getElementById("evDescription").value = ev.beschreibung || "";
  document.getElementById("evLocation").value = ev.ort || "";
  document.getElementById("evDuration").value = ev.dauer || 60;
  document.getElementById("evRepeat").value = ev.wiederholung || "none";
  document.getElementById("evReminder").value = ev.erinnerung || "keine";
  document.getElementById("evAllDay").checked = ev.ganztag ? true : false;
  document.getElementById("evDeleteBtn").style.display = "inline-block";
  toggleAllDay();

  const sd = ev.start_datum ? new Date(ev.start_datum) : new Date();
  document.getElementById("evDate").value = fmtDate(sd);
  if (!ev.ganztag && ev.start_datum) {
    document.getElementById("evStartTime").value = String(sd.getHours()).padStart(2,"0") + ":" + String(sd.getMinutes()).padStart(2,"0");
  } else {
    document.getElementById("evStartTime").value = "10:00";
  }

  const ed = ev.end_datum ? new Date(ev.end_datum) : new Date(sd.getTime() + 3600000);
  if (!ev.ganztag && ev.end_datum) {
    document.getElementById("evEndTime").value = String(ed.getHours()).padStart(2,"0") + ":" + String(ed.getMinutes()).padStart(2,"0");
  } else {
    document.getElementById("evEndTime").value = "11:00";
  }

  document.querySelectorAll(".color-dot").forEach(dot => {
    dot.classList.toggle("active", dot.dataset.color === (ev.farbe || "#3B82F6"));
  });

  document.getElementById("evWorkspace").value = ev.workspace_id || "";

  document.getElementById("eventModalOverlay").classList.add("open");
}

async function deleteEvent() {
  if (!editingEventId) return;
  if (!confirm("Event wirklich löschen?")) return;

  const res = await authFetch(`/api/kalender/${editingEventId}`, { method: "DELETE" });
  if (res && res.ok) {
    closeEventModal();
    await loadEvents();
  }
}

function toggleAllDay() {
  const checked = document.getElementById("evAllDay").checked;
  document.getElementById("evStartTime").disabled = checked;
  document.getElementById("evEndTime").disabled = checked;
}

function toggleCustomDuration() {
  const val = document.getElementById("evDuration").value;
  const el = document.getElementById("evCustomDuration");
  el.style.display = val === "custom" ? "block" : "none";
}

// Register color picker clicks
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".color-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      document.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
    });
  });
});

// Open modal from toolbar
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".cal-btn-add")?.addEventListener("click", () => openEventModal());
});

// Keyboard support for modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeEventModal();
});

// ==========================================================
// HELPER
// ==========================================================
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getWeekStart(d) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0,0,0,0);
  return copy;
}

function evStartsOnDate(ev, date) {
  if (!ev.start_datum) return false;
  const base = new Date(ev.start_datum);
  if (!ev.wiederholung || ev.wiederholung === "none") {
    return sameDay(base, date);
  }
  // Recurring event: date must be on or after the base date
  if (date < base) return false;

  const diffDays = Math.round((date - base) / (1000 * 60 * 60 * 24));

  switch (ev.wiederholung) {
    case "daily":
      return true;
    case "weekly":
      return diffDays % 7 === 0;
    case "biweekly":
      return diffDays % 14 === 0;
    case "monthly":
      if (date.getDate() === base.getDate()) return true;
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return base.getDate() > lastDay && date.getDate() === lastDay;
    case "yearly":
      return date.getMonth() === base.getMonth() && date.getDate() === base.getDate();
    default:
      return sameDay(base, date);
  }
}
