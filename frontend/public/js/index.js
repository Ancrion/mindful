let dashboardData = null;
let pomodoroStats = null;
let chartWeek = null;
let _widgets = [];
let _weatherCache = null;

// ─── Widget Registry ───
const WIDGET_TYPES = {
  stats: { name: "Statistiken", icon: "fa-chart-simple", desc: "Zahlen auf einen Blick", color: "#6e8ab8" },
  tasks: { name: "To-Do", icon: "fa-tasks", desc: "Anstehende Aufgaben", color: "#3b82f6" },
  notes: { name: "Notizen", icon: "fa-file-alt", desc: "Letzte Notizen", color: "#22c55e" },
  events: { name: "Termine", icon: "fa-calendar-day", desc: "Heutige Termine", color: "#f59e0b" },
  docs: { name: "Dokumente", icon: "fa-file", desc: "Neueste Dokumente", color: "#8b5cf6" },
  pomodoro: { name: "Pomodoro", icon: "fa-clock", desc: "Fokus-Statistiken & Chart", color: "#ec4899" },
  weather: { name: "Wetter", icon: "fa-cloud-sun", desc: "Aktuelles Wetter & 5-Tage-Vorhersage", color: "#06b6d4" },
  calendar: { name: "Kalender", icon: "fa-calendar", desc: "Monatsübersicht mit Termin-Dots", color: "#8b5cf6" },
};

// ─── API Helper ───
async function apiFetch(endpoint, options = {}) {
  try {
    const url = `${API_BASE}/${endpoint}`;
    if (!options.method) options.method = "GET";
    const res = await authFetch(url, options);
    if (!res) {
      console.error(`apiFetch: No response for ${endpoint}`);
      return null;
    }
    if (!res.ok) {
      console.error(`apiFetch: ${res.status} ${res.statusText} for ${endpoint}`);
      return null;
    }
    const data = await res.json();
    if (!data) {
      console.error(`apiFetch: Empty response for ${endpoint}`);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`apiFetch Fehler (${endpoint}):`, err.message);
    return null;
  }
}

// ─── Initialization ───
async function initDashboard() {
  try {
    const [data, pData] = await Promise.all([
      apiFetch("dashboard"),
      apiFetch("pomodoro/stats"),
    ]);
    if (!data) return;
    dashboardData = data;
    if (pData) pomodoroStats = pData;
    renderUser(data);
    await loadWidgets();
  } catch (err) {
    console.error("Dashboard Fehler:", err);
  }
}

// ─── Widget Loading ───
async function loadWidgets() {
  let widgets = await apiFetch("dashboard/widgets");
  if (!widgets || widgets.length === 0) {
    const defaults = [
      { typ: "stats", config: {} },
      { typ: "tasks", config: {} },
      { typ: "pomodoro", config: {} },
    ];
    for (const w of defaults) {
      await apiFetch("dashboard/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(w),
      });
    }
    widgets = await apiFetch("dashboard/widgets");
  }
  _widgets = widgets || [];
  renderWidgets();
}

function renderWidgets() {
   const grid = document.getElementById("widgetGrid");
   if (!grid) return;
   grid.innerHTML = "";
   _widgets.sort((a, b) => a.position - b.position);
   if (_widgets.length === 0) {
     grid.innerHTML = `<div class="widget-empty">
       <i class="fas fa-puzzle-piece"></i>
       <p>Noch keine Widgets vorhanden.</p>
       <button class="btn-primary" onclick="document.getElementById('widgetManageBtn').click()">
         <i class="fas fa-plus"></i> Widget hinzufügen
       </button>
     </div>`;
     return;
   }
   for (const w of _widgets) {
     const card = _buildCard(w);
     if (card) grid.appendChild(card);
   }
   
   // Initialize grid as drop target
   _initGridDragDrop(grid);
 }
 
 function _initGridDragDrop(grid) {
   // Grid selbst braucht dragover und drop Listener
   grid.addEventListener("dragover", (e) => {
     e.preventDefault();
     e.dataTransfer.dropEffect = "move";
   });
   
    grid.addEventListener("drop", (e) => {
      e.preventDefault();
      
      if (!_drag) return;
      
      const { element } = _drag;
      const dropTarget = e.target.closest(".widget-card");
      
      console.log("🔻 DROP", {
        draggedId: element.dataset.widgetId,
        dropTarget: dropTarget?.dataset?.widgetId,
        eTarget: e.target.className?.slice(0, 60),
        domBefore: [...grid.querySelectorAll(".widget-card")].map(c => c.dataset.widgetId)
      });
      
      // Remove dragging state
      element.classList.remove("dragging");
      
      if (dropTarget && dropTarget !== element) {
        const allCards = [...grid.querySelectorAll(".widget-card")];
        const draggedIdx = allCards.indexOf(element);
        const targetIdx = allCards.indexOf(dropTarget);
        
        console.log("📍 SWAP", {
          draggedId: element.dataset.widgetId,
          targetId: dropTarget.dataset.widgetId,
          draggedIdx,
          targetIdx,
          insertAfter: targetIdx > draggedIdx
        });
        
        element.remove();
        if (targetIdx > draggedIdx) {
          // dragged was BEFORE target → insert AFTER target
          grid.insertBefore(element, dropTarget.nextSibling);
        } else {
          // dragged was AFTER target → insert BEFORE target
          grid.insertBefore(element, dropTarget);
        }
        
        console.log("✅ DOM after:", [...grid.querySelectorAll(".widget-card")].map(c => c.dataset.widgetId));
      } else {
        console.log("⏭️ No valid drop target", { dropTarget, same: dropTarget === element });
      }
      
      // Reflow
      _reflowAll();
      
      // Save order
      const newOrder = [...grid.querySelectorAll(".widget-card")].map((el, i) => ({
        id: parseInt(el.dataset.widgetId),
        position: i
      }));
      
      apiFetch("dashboard/widgets/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder })
      })
        .then(res => {
          if (!res) throw new Error("No response");
          newOrder.forEach(o => {
            const w = _widgets.find(x => x.id == o.id);
            if (w) w.position = o.position;
          });
        })
        .catch(err => {
          console.error("💥 Widget order save failed:", err);
        });
      
      document.querySelectorAll(".widget-card.drag-over").forEach(el => {
        el.classList.remove("drag-over");
      });
      
      _drag = null;
    });
 }

function _rerenderWidget(typ) {
  const idx = _widgets.findIndex((w) => w.typ === typ);
  if (idx === -1) return;
  const grid = document.getElementById("widgetGrid");
  if (!grid) return;
  if (typ === "pomodoro" && chartWeek) {
    chartWeek.destroy();
    chartWeek = null;
  }
  const existing = grid.querySelector(`.widget-${typ}`);
  const nextSibling = existing ? existing.nextSibling : null;
  if (existing) existing.remove();
  const info = WIDGET_TYPES[typ];
  if (info) {
    const card = _buildCard(_widgets[idx]);
    if (card) {
      if (nextSibling && nextSibling.parentNode === grid) {
        grid.insertBefore(card, nextSibling);
      } else {
        grid.appendChild(card);
      }
    }
  }
}

function _buildCard(widget) {
  const info = WIDGET_TYPES[widget.typ];
  if (!info) return null;
  const grid = document.getElementById("widgetGrid");
  if (!grid) return null;

  const DEFAULT_SIZES = { stats: 4, tasks: 2, notes: 2, events: 2, docs: 2, pomodoro: 3, weather: 2, calendar: 2 };
  const config = widget.config ? (typeof widget.config === "string" ? JSON.parse(widget.config) : widget.config) : {};
  const size = config.size || DEFAULT_SIZES[widget.typ] || 2;

  const card = document.createElement("div");
  card.className = `widget-card widget-${widget.typ} widget-s${size}`;
  card.draggable = true;
  card.dataset.widgetId = widget.id;
  card.dataset.widgetSize = size;

  // Render body via the registry
  const bodyHTML = _getWidgetBody(widget);
  card.innerHTML = `
    <div class="widget-header">
      <span class="widget-handle"><i class="fas fa-grip-vertical"></i></span>
      <h3 class="widget-title"><i class="fas ${info.icon}"></i> ${info.name}</h3>
      ${widget.typ === "calendar" ? `<div class="cal-view-switch">${["month","week","day"].map(v =>
        `<button class="cal-view-btn${_calendarWidgetView === v ? " active" : ""}" data-view="${v}">${v === "month" ? "Monat" : v === "week" ? "Woche" : "Tag"}</button>`
      ).join("")}</div>` : ""}
      <button class="widget-remove" title="Widget entfernen">&times;</button>
    </div>
    <div class="widget-body">${bodyHTML}</div>
    <span class="widget-resize-handle" title="Größe ändern"><i class="fas fa-grip-lines"></i></span>
  `;

  card.querySelector(".widget-remove").addEventListener("click", (e) => {
    e.stopPropagation();
    _removeWidget(widget.id);
  });

  // Drag & Drop
  card.addEventListener("dragstart", _onDragStart);
  card.addEventListener("dragend", _onDragEnd);
  card.addEventListener("dragover", _onDragOver);

  // Resize (mouse + touch)
  const resizeHandle = card.querySelector(".widget-resize-handle");
  resizeHandle.addEventListener("mousedown", (e) => _startResize(e, card, widget));
  resizeHandle.addEventListener("touchstart", (e) => _startResize(e, card, widget), { passive: false });

  // Keyboard
  _setupKeyboard(card, widget);

  // Auto-refresh
  _startAutoRefresh();

  // Context menu on dashboard items inside widget
  card.addEventListener("contextmenu", (e) => {
    const item = e.target.closest("[data-dash-id]");
    if (!item) return;
    e.preventDefault();
    const id = parseInt(item.dataset.dashId);
    const type = item.dataset.dashType;
    const cache = _getDashCache(type);
    if (cache && cache[id]) {
      closeCtxMenu();
      showDashCtxMenu(e, type, cache[id]);
    }
  });

  // Post-render hook for special widgets (chart, weather fetch)
  const postRender = _getPostRender(widget);
  if (postRender) setTimeout(postRender, 50);

  return card;
}

function _getWidgetBody(widget) {
  switch (widget.typ) {
    case "stats": return _buildStatsBody();
    case "tasks": return _buildTasksBody();
    case "notes": return _buildNotesBody();
    case "events": return _buildEventsBody();
    case "docs": return _buildDocsBody();
    case "pomodoro": return _buildPomoBody();
    case "weather": return _buildWeatherBody(widget);
    case "calendar": return _buildCalendarBody();
    default: return "";
  }
}

function _getPostRender(widget) {
  switch (widget.typ) {
    case "pomodoro": return () => {
      const canvas = document.getElementById("chartWeek");
      const s = pomodoroStats || { week: [] };
      if (canvas) renderWeekChart(s.week, canvas);
    };
    case "weather": {
      const config = widget.config ? (typeof widget.config === "string" ? JSON.parse(widget.config) : widget.config) : {};
      if (config.lat && config.lon) {
        return () => _fetchWeather(widget, config.lat, config.lon);
      }
       return () => {
         const card = document.querySelector(`.widget-weather[data-widget-id="${widget.id}"]`);
         if (!card) return;
         const cityBtn = card.querySelector(".weather-city-btn");
         const cityInput = card.querySelector(".weather-city-input");
         const gpsBtn = card.querySelector(".weather-gps-btn");
         if (cityBtn && cityInput) {
           cityBtn.addEventListener("click", () => _searchWeatherCity(widget, cityInput.value));
           cityInput.addEventListener("keydown", (e) => { 
             if (e.key === "Enter") _searchWeatherCity(widget, cityInput.value);
           });
           cityInput.addEventListener("input", (e) => {
             _showWeatherSuggestions(widget, cityInput, e.target.value);
           });
         }
         if (gpsBtn) gpsBtn.addEventListener("click", () => _requestWeatherLocation(widget));
       };
    }
    case "calendar": return () => {
      const grid = document.querySelector(".widget-calendar .cal-wgrid");
      if (grid) {
        grid.addEventListener("click", e => {
          const cell = e.target.closest(".cal-wc");
          if (cell && cell.dataset.date) {
            const d = new Date(cell.dataset.date);
            if (!isNaN(d.getTime())) {
              if (_calendarWidgetView === "day") {
                window.location.href = "/calendar";
              } else {
                _calendarDate = d;
                _calendarWidgetView = "day";
                _rerenderWidget("calendar");
              }
            }
          }
        });
      }
      const navBtns = document.querySelectorAll(".widget-calendar .cal-nav");
      navBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          if (_calendarWidgetView === "month") {
            _calendarDate.setMonth(_calendarDate.getMonth() + parseInt(btn.dataset.dir));
          } else if (_calendarWidgetView === "week") {
            _calendarDate.setDate(_calendarDate.getDate() + 7 * parseInt(btn.dataset.dir));
          } else {
            _calendarDate.setDate(_calendarDate.getDate() + parseInt(btn.dataset.dir));
          }
          _rerenderWidget("calendar");
        });
      });
      const viewBtns = document.querySelectorAll(".widget-calendar .cal-view-btn");
      viewBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          _calendarWidgetView = btn.dataset.view;
          _rerenderWidget("calendar");
        });
      });
      const evItems = document.querySelectorAll(".widget-calendar .cal-wev-item");
      evItems.forEach(item => {
        item.addEventListener("click", () => {
          window.location.href = "/calendar";
        });
      });
    };
    default: return null;
  }
}

// ─── Simple Drag & Drop ───
let _drag = null; // { element, placeholder }

function _reflowAll() {
  const grid = document.getElementById("widgetGrid");
  if (!grid) return;
  const allCards = [...grid.querySelectorAll(".widget-card")];
  let col = 0;
  for (const card of allCards) {
    const cur = parseInt(card.dataset.widgetSize);
    if (col + cur > 4) {
      const avail = 4 - col;
      const best = avail >= 4 ? 4 : avail >= 2 ? 2 : 1;
      if (best !== cur) {
        const w = _widgets.find(x => x.id == parseInt(card.dataset.widgetId));
        if (w) _setWidgetSize(card, w, best);
      }
      col = 4;
    } else {
      col += cur;
    }
    if (col >= 4) col = 0;
  }
}

function _onDragStart(e) {
  const element = this;
  const grid = document.getElementById("widgetGrid");
  
  console.log("🎯 DRAG START:", element.dataset.widgetId);
  console.log("📋 DOM order:", [...grid.querySelectorAll(".widget-card")].map(c => c.dataset.widgetId));
  
  element.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", element.dataset.widgetId);
  
  _drag = { element };
}

function _onDragEnd() {
  const grid = document.getElementById("widgetGrid");
  console.log("❌ DRAG END", {
    _drag: _drag ? "exists" : "null",
    domFinal: grid ? [...grid.querySelectorAll(".widget-card")].map(c => c.dataset.widgetId) : "no grid"
  });
  
  if (_drag?.element) {
    _drag.element.classList.remove("dragging");
  }
  
  document.querySelectorAll(".widget-card.drag-over").forEach(el => {
    el.classList.remove("drag-over");
  });
  
  _drag = null;
}

function _onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  
  if (!_drag) return;
  
  const target = this;
  const { element } = _drag;
  
  if (target !== element) {
    const rect = target.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    
    console.log("🔄 OVER", {
      targetId: target.dataset.widgetId,
      relX: relX.toFixed(2),
      relY: relY.toFixed(2),
      wouldInsertBefore: relX < 0.5
    });
    
    document.querySelectorAll(".widget-card.drag-over").forEach(el => {
      if (el !== target) el.classList.remove("drag-over");
    });
    target.classList.add("drag-over");
  }
}

// ─── Auto-Refresh ───
let _refreshTimers = {};

async function _refreshWidget(typ) {
  if (typ === "weather") {
    const w = _widgets.find((x) => x.typ === "weather");
    if (!w) return;
    const config = w.config ? (typeof w.config === "string" ? JSON.parse(w.config) : w.config) : {};
    if (config.lat && config.lon) await _fetchWeather(w, config.lat, config.lon);
    return;
  }
  if (typ === "stats") {
    const data = await apiFetch("dashboard");
    if (data) { dashboardData = data; _rerenderWidget("stats"); }
  }
}

function _startAutoRefresh() {
  if (!_refreshTimers.weather) _refreshTimers.weather = setInterval(() => _refreshWidget("weather"), 300000);
  if (!_refreshTimers.stats) _refreshTimers.stats = setInterval(() => _refreshWidget("stats"), 30000);
}

function _stopAutoRefresh() {
  Object.values(_refreshTimers).forEach(clearInterval);
  _refreshTimers = {};
}

// ─── Keyboard Accessibility ───
function _setupKeyboard(card, widget) {
  card.setAttribute("tabindex", "0");
  card.addEventListener("keydown", (e) => {
    const grid = document.getElementById("widgetGrid");
    if (!grid) return;
    const allCards = [...grid.querySelectorAll(".widget-card")];
    const idx = allCards.indexOf(card);

    if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      grid.insertBefore(card, allCards[idx - 1]);
      _reflowAll();
      _saveOrder();
      allCards[idx - 1].focus();
    }
    if (e.key === "ArrowRight" && idx < allCards.length - 1) {
      e.preventDefault();
      grid.insertBefore(allCards[idx + 1], card);
      _reflowAll();
      _saveOrder();
      allCards[idx + 1].focus();
    }
    if (e.shiftKey && e.key === "ArrowLeft") {
      e.preventDefault();
      const cur = parseInt(card.dataset.widgetSize);
      if (cur > 1) _setWidgetSize(card, widget, cur - 1);
    }
    if (e.shiftKey && e.key === "ArrowRight") {
      e.preventDefault();
      const cur = parseInt(card.dataset.widgetSize);
      if (cur < 4) _setWidgetSize(card, widget, cur + 1);
    }
  });
  card.addEventListener("focus", () => card.classList.add("focused"));
  card.addEventListener("blur", () => card.classList.remove("focused"));
}

function _saveOrder() {
  const grid = document.getElementById("widgetGrid");
  if (!grid) return;
  
  // Store original order for undo
  const originalCards = [...grid.querySelectorAll(".widget-card")];
  const originalDOM = originalCards.map(el => ({
    id: parseInt(el.dataset.widgetId),
    element: el
  }));
  
  const reordered = [...grid.querySelectorAll(".widget-card")];
  const order = reordered.map((el, i) => ({ id: parseInt(el.dataset.widgetId), position: i }));
  
  apiFetch("dashboard/widgets/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  })
    .then(res => {
      if (!res || !res.ok) throw new Error(res?.error || "Server error");
      // Success - update local positions
      for (const item of order) {
        const w = _widgets.find((x) => x.id == item.id);
        if (w) w.position = item.position;
      }
      console.log("✅ Widget order saved");
    })
    .catch(err => {
      console.error("❌ Failed to save order:", err);
      // Undo: restore original order
      originalDOM.forEach(item => {
        grid.appendChild(item.element);
      });
    });
}

function _setWidgetSize(card, widget, newSize) {
  const cur = parseInt(card.dataset.widgetSize);
  if (cur === newSize) return;
  
  // Store original size for undo
  const originalSize = cur;
  
  // Update UI immediately (optimistic update)
  card.classList.remove(`widget-s${cur}`);
  card.classList.add(`widget-s${newSize}`);
  card.dataset.widgetSize = newSize;
  
  // Update local widget state
  const config = widget.config ? (typeof widget.config === "string" ? JSON.parse(widget.config) : widget.config) : {};
  config.size = newSize;
  widget.config = config;
  
  // Save to server with error handling
  apiFetch(`dashboard/widgets/${widget.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  })
    .then(res => {
      if (!res || !res.ok) throw new Error(res?.error || "Server error");
      console.log(`✅ Widget ${widget.id} size saved to ${newSize}`);
    })
    .catch(err => {
      console.error(`❌ Failed to save widget size: ${err}`);
      // Revert UI on failure
      card.classList.remove(`widget-s${newSize}`);
      card.classList.add(`widget-s${originalSize}`);
      card.dataset.widgetSize = originalSize;
      // Revert local state
      config.size = originalSize;
      widget.config = config;
    });
}

// ─── Resize Widget (Mouse + Touch) ───
let _resizeData = null;

function _getClientX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX;
}

function _startResize(e, card, widget) {
  e.preventDefault();
  e.stopPropagation();
  if (_resizeData) return;

  const grid = document.getElementById("widgetGrid");
  if (!grid) return;
  const rect = grid.getBoundingClientRect();
  const colW = (rect.width - 3 * 20) / 4;
  const cardRect = card.getBoundingClientRect();
  const clientX = _getClientX(e);
  const offsetX = clientX - cardRect.left;

  _resizeData = { card, widget, grid, colW, offsetX, startSize: parseInt(card.dataset.widgetSize) };
  card.classList.add("resizing");

  document.addEventListener("mousemove", _onResizeMove);
  document.addEventListener("mouseup", _onResizeEnd);
  document.addEventListener("touchmove", _onResizeMove, { passive: false });
  document.addEventListener("touchend", _onResizeEnd);
}

function _onResizeMove(e) {
  if (!_resizeData) return;
  e.preventDefault();
  const { card, grid, colW, offsetX } = _resizeData;
  const gridRect = grid.getBoundingClientRect();
  const cardLeft = card.getBoundingClientRect().left - gridRect.left;
  const clientX = _getClientX(e);
  const mouseX = clientX - gridRect.left;
  const relX = mouseX - cardLeft + 16;
  let cols = Math.round(relX / (colW + 20));
  cols = Math.max(1, Math.min(4, cols));
  cols = Math.max(cols, _resizeData.startSize === 4 ? 2 : 1);

  const cur = parseInt(card.dataset.widgetSize);
  if (cur !== cols) {
    card.classList.remove(`widget-s${cur}`);
    card.classList.add(`widget-s${cols}`);
    card.dataset.widgetSize = cols;
  }
}

function _onResizeEnd() {
  document.removeEventListener("mousemove", _onResizeMove);
  document.removeEventListener("mouseup", _onResizeEnd);
  document.removeEventListener("touchmove", _onResizeMove);
  document.removeEventListener("touchend", _onResizeEnd);
  if (!_resizeData) return;
  const { card, widget } = _resizeData;
  card.classList.remove("resizing");

  const newSize = parseInt(card.dataset.widgetSize);
  const config = widget.config ? (typeof widget.config === "string" ? JSON.parse(widget.config) : widget.config) : {};
  config.size = newSize;
  widget.config = config;

  apiFetch(`dashboard/widgets/${widget.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });

  // Reflow all widgets after resize
  _reflowAll();

  _resizeData = null;
}

// ─── Add/Remove Widget ───
async function _addWidget(typ) {
  const w = await apiFetch("dashboard/widgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typ }),
  });
  if (w) {
    _widgets.push(w);
    renderWidgets();
  }
}

async function _removeWidget(id) {
  await apiFetch(`dashboard/widgets/${id}`, { method: "DELETE" });
  _widgets = _widgets.filter((w) => w.id !== id);
  renderWidgets();
}

// ─── Widget Body Builders ───

function _buildStatsBody() {
  const d = dashboardData || { todos: [], notizen: [], events: [], dokumente: [] };
  const openTasks = wsFilter(d.todos).filter((t) => t.status !== "erledigt").length;
  const noteCount = wsFilter(d.notizen).length;
  const todayEvents = wsFilter(d.events).filter(isToday).length;
  const docCount = d.dokumente.length;
  const rate = pomodoroStats ? pomodoroStats.successRate + "%" : "0%";
  return `
    <div class="stats-row">
      <div class="stat-item"><p>Offene Aufgaben</p><h3 id="statTasks">${openTasks}</h3></div>
      <div class="stat-item"><p>Notizen</p><h3 id="statNotes">${noteCount}</h3></div>
      <div class="stat-item"><p>Termine heute</p><h3 id="statEvents">${todayEvents}</h3></div>
      <div class="stat-item"><p>Dokumente</p><h3 id="statDocs">${docCount}</h3></div>
      <div class="stat-item"><p>Erfolgsquote</p><h3 id="statSuccessRate">${rate}</h3></div>
    </div>`;
}

function _buildTasksBody() {
  const tasks = dashboardData ? wsFilter(dashboardData.todos || []).filter((t) => t.status !== "erledigt").slice(0, 5) : [];
  window._dashTasks = {};
  if (tasks.length === 0) {
    return '<ul class="widget-list"><li class="empty-text">Keine anstehenden Aufgaben.</li></ul>';
  }
  const items = tasks.map((t) => {
    window._dashTasks[t.id] = t;
    return `<li data-dash-id="${t.id}" data-dash-type="task">
      <i class="far fa-circle dash-icon tasks"></i>
      <span class="dash-title">${escHtml(t.titel)}</span>
      ${t.workspace_name ? `<span class="dash-badge">${escHtml(t.workspace_name)}</span>` : ""}
      ${t.faellig ? `<span class="dash-meta"><i class="far fa-calendar"></i> ${getRemainingDays(t.faellig)}</span>` : ""}
    </li>`;
  }).join("");
  return `<ul class="widget-list">${items}</ul><a href="/todo" class="widget-link">Alle Aufgaben anzeigen <i class="fas fa-arrow-right"></i></a>`;
}

function _buildNotesBody() {
  const notes = dashboardData ? wsFilter(dashboardData.notizen || []).slice(0, 5) : [];
  window._dashNotes = {};
  if (notes.length === 0) {
    return '<ul class="widget-list"><li class="empty-text">Keine Notizen vorhanden.</li></ul>';
  }
  const items = notes.map((n) => {
    window._dashNotes[n.id] = n;
    return `<li data-dash-id="${n.id}" data-dash-type="note">
      <i class="fas fa-file-alt dash-icon notes"></i>
      <span class="dash-title">${escHtml(n.titel)}</span>
      <span class="dash-meta">${new Date(n.erstellt).toLocaleDateString("de-DE")}</span>
    </li>`;
  }).join("");
  return `<ul class="widget-list">${items}</ul><a href="/notes" class="widget-link">Alle Notizen anzeigen <i class="fas fa-arrow-right"></i></a>`;
}

function _buildEventsBody() {
  const events = dashboardData ? wsFilter(dashboardData.events || []) : [];
  window._dashEvents = {};
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const upcoming = events.filter(e => {
    if (!e.start_datum) return false;
    const d = new Date(e.start_datum.split("T")[0] || e.start_datum);
    return d >= today;
  }).sort((a,b) => new Date(a.start_datum) - new Date(b.start_datum));
  
  if (upcoming.length === 0) {
    return '<ul class="widget-list"><li class="empty-text">Keine Termine anstehend.</li></ul>';
  }
  
  let html = '', lastGroup = null;
  upcoming.slice(0, 12).forEach(e => {
    window._dashEvents[e.id] = e;
    const d = new Date(e.start_datum.split("T")[0] || e.start_datum);
    const diff = Math.round((d - today) / (1000*60*60*24));
    
    let group;
    if (diff === 0) group = "Heute";
    else if (diff === 1) group = "Morgen";
    else if (diff >= 2 && diff <= 6) group = "Diese Woche";
    else group = "Nächste Woche";
    
    if (group !== lastGroup) {
      if (lastGroup !== null) html += '</ul>';
      html += `<div class="widget-section-header">${group}</div><ul class="widget-list">`;
      lastGroup = group;
    }
    
    const timeStr = e.ganztag ? "ganztags"
      : (e.start_datum ? new Date(e.start_datum).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "");
    html += `<li data-dash-id="${e.id}" data-dash-type="event">
      <i class="fas fa-calendar-day dash-icon events"></i>
      <span class="dash-title">${escHtml(e.titel)}</span>
      <span class="dash-meta">${timeStr}</span>
    </li>`;
  });
  
  html += '</ul>';
  html += '<a href="/calendar" class="widget-link">Alle Termine anzeigen <i class="fas fa-arrow-right"></i></a>';
  return html;
}

let _calendarDate = new Date();
let _calendarWidgetView = "month";

function _getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { mon, sun };
}

function _buildWidgetMonthView(year, month, events, today, months, daysDe) {
  const firstDay = new Date(year, month, 1);
  const startPad = firstDay.getDay();
  const startOff = startPad === 0 ? 6 : startPad - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  let html = `<div class="cal-days">${daysDe.map(d => `<span>${d}</span>`).join("")}</div>
    <div class="cal-wgrid">`;

  for (let i = startOff - 1; i >= 0; i--)
    html += `<div class="cal-wc other-month"><span class="cal-wd">${daysInPrev - i}</span></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const isToday = date.toDateString() === today.toDateString();
    const hasEv = events.some(e => {
      if (!e.start_datum) return false;
      const ed = new Date(e.start_datum.split("T")[0] || e.start_datum);
      return ed.toDateString() === date.toDateString();
    });
    html += `<div class="cal-wc${isToday ? " today" : ""}" data-date="${dateStr}">
      <span class="cal-wd">${d}</span>${hasEv ? '<span class="cal-dot"></span>' : ''}
    </div>`;
  }

  const total = startOff + daysInMonth;
  const rem = (7 - total % 7) % 7;
  for (let i = 1; i <= rem; i++)
    html += `<div class="cal-wc other-month"><span class="cal-wd">${i}</span></div>`;

  html += `</div>`;
  return html;
}

function _buildWidgetWeekView(year, month, events, today, months, daysDe) {
  const { mon, sun } = _getWeekRange(_calendarDate);
  const monStr = `${mon.getDate()}. ${months[mon.getMonth()]}`;
  const sunStr = `${sun.getDate()}. ${months[sun.getMonth()]} ${sun.getFullYear()}`;

  let html = `<div class="cal-days">${daysDe.map(d => `<span>${d}</span>`).join("")}</div>
    <div class="cal-wgrid">`;

  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const isToday = d.toDateString() === today.toDateString();
    const hasEv = events.some(e => {
      if (!e.start_datum) return false;
      const ed = new Date(e.start_datum.split("T")[0] || e.start_datum);
      return ed.toDateString() === d.toDateString();
    });
    html += `<div class="cal-wc${isToday ? " today" : ""}" data-date="${dateStr}">
      <span class="cal-wd">${d.getDate()}</span>${hasEv ? '<span class="cal-dot"></span>' : ''}
    </div>`;
  }

  html += `</div>`;
  return html;
}

function _buildWidgetDayView(year, month, events, today, months, daysDe) {
  const eventsToday = events.filter(e => {
    if (!e.start_datum) return false;
    const ed = new Date(e.start_datum.split("T")[0] || e.start_datum);
    return ed.toDateString() === _calendarDate.toDateString();
  });

  let html = `<div class="cal-wev-list">`;

  if (eventsToday.length === 0) {
    html += `<div class="cal-wev-empty">Keine Termine</div>`;
  } else {
    eventsToday.slice(0, 5).forEach(e => {
      const timeStr = e.ganztag ? "ganztags"
        : (e.start_datum ? new Date(e.start_datum).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "");
      const color = e.farbe || "var(--accent)";
      html += `<div class="cal-wev-item" data-date="${_calendarDate.toISOString().split("T")[0]}">
        <span class="cal-wev-dot" style="background:${color}"></span>
        <span class="cal-wev-title">${escHtml(e.titel)}</span>
        <span class="cal-wev-time">${timeStr}</span>
      </div>`;
    });
    if (eventsToday.length > 5)
      html += `<div class="cal-wev-more">+${eventsToday.length - 5} weitere</div>`;
  }

  html += `</div>`;
  return html;
}

function _buildCalendarBody() {
  const year = _calendarDate.getFullYear();
  const month = _calendarDate.getMonth();
  const today = new Date();
  today.setHours(0,0,0,0);

  const months = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const daysDe = ["Mo","Di","Mi","Do","Fr","Sa","So"];
  const weekdaysDe = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

  const events = dashboardData ? wsFilter(dashboardData.events || []) : [];

  let title;
  if (_calendarWidgetView === "month") {
    title = `${months[month]} ${year}`;
  } else if (_calendarWidgetView === "week") {
    const { mon, sun } = _getWeekRange(_calendarDate);
    title = `${mon.getDate()}. – ${sun.getDate()}. ${months[sun.getMonth()]} ${year}`;
  } else {
    const wd = weekdaysDe[_calendarDate.getDay()];
    title = `${wd}, ${_calendarDate.getDate()}. ${months[month]} ${year}`;
  }

  const viewBtns = ["month","week","day"].map(v =>
    `<button class="cal-view-btn${_calendarWidgetView === v ? " active" : ""}" data-view="${v}">${v === "month" ? "Monat" : v === "week" ? "Woche" : "Tag"}</button>`
  ).join("");

  let bodyHtml;
  if (_calendarWidgetView === "month") {
    bodyHtml = _buildWidgetMonthView(year, month, events, today, months, daysDe);
  } else if (_calendarWidgetView === "week") {
    bodyHtml = _buildWidgetWeekView(year, month, events, today, months, daysDe);
  } else {
    bodyHtml = _buildWidgetDayView(year, month, events, today, months, daysDe);
  }

  return `<div class="cal-widget">
    <div class="cal-head">
      <div class="cal-head-row">
        <button class="cal-nav" data-dir="-1"><i class="fas fa-chevron-left"></i></button>
        <span class="cal-title">${title}</span>
        <button class="cal-nav" data-dir="1"><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
    ${bodyHtml}
  </div>`;
}

function _buildDocsBody() {
  const docs = dashboardData ? (dashboardData.dokumente || []).slice(0, 5) : [];
  window._dashDocs = {};
  if (docs.length === 0) {
    return '<ul class="widget-list"><li class="empty-text">Keine Dokumente vorhanden.</li></ul>';
  }
  const items = docs.map((d) => {
    window._dashDocs[d.id] = d;
    return `<li data-dash-id="${d.id}" data-dash-type="doc">
      <i class="fas fa-file dash-icon docs"></i>
      <span class="dash-title">${escHtml(d.titel)}</span>
      <span class="dash-meta">${(d.dateiname || "").split(".").pop().toUpperCase()}</span>
    </li>`;
  }).join("");
  return `<ul class="widget-list">${items}</ul><a href="/notes" class="widget-link">Alle Dokumente anzeigen <i class="fas fa-arrow-right"></i></a>`;
}

function _buildPomoBody() {
  const s = pomodoroStats || { today: { sessions: 0 }, week: [], totalFocusSeconds: 0, successRate: 0 };
  const weekTotal = s.week.reduce((sum, d) => sum + d.count, 0);
  return `
    <div class="pomo-stats-summary">
      <div class="pomo-stat-card"><span class="stats-num" id="statsTodaySessions">${s.today.sessions}</span><span class="stats-label">Heute</span></div>
      <div class="pomo-stat-card"><span class="stats-num" id="statsWeekSessions">${weekTotal}</span><span class="stats-label">Diese Woche</span></div>
      <div class="pomo-stat-card"><span class="stats-num" id="statsTotalHours">${(s.totalFocusSeconds / 3600).toFixed(1)}</span><span class="stats-label">Fokus (h)</span></div>
      <div class="pomo-stat-card"><span class="stats-num" id="statsSuccessNum">${s.successRate}%</span><span class="stats-label">Erfolg</span></div>
    </div>
    <div class="chart-wrap"><canvas id="chartWeek"></canvas></div>`;
}

function _buildWeatherBody(widget) {
  const config = widget.config ? (typeof widget.config === "string" ? JSON.parse(widget.config) : widget.config) : {};
  if (config.lat && config.lon) {
    return '<div class="spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  }
  return `
    <div class="weather-config">
      <div class="weather-search-wrapper">
        <input type="text" class="weather-city-input" placeholder="Stadt eingeben..." value="${escHtml(config.city || "")}" autocomplete="off" />
        <ul class="weather-suggestions-list" style="display:none;"></ul>
      </div>
      <button class="weather-city-btn"><i class="fas fa-search"></i></button>
      <button class="weather-gps-btn"><i class="fas fa-crosshairs"></i></button>
    </div>`;
}

async function _fetchWeather(widget, lat, lon) {
  const cacheKey = lat + "_" + lon;
  if (_weatherCache && _weatherCache.key === cacheKey && Date.now() - _weatherCache.time < 600000) {
    _renderWeatherData(widget, _weatherCache.data);
    return;
  }
  try {
    const data = await apiFetch(`dashboard/widgets/weather/data?lat=${lat}&lon=${lon}`);
    if (!data || data.error) throw new Error("No data");
    _weatherCache = { key: cacheKey, data, time: Date.now() };
    _renderWeatherData(widget, data);
  } catch {
    _updateWidgetBody(widget, '<p style="color:var(--text-muted);text-align:center;">Wetter konnte nicht geladen werden.</p>');
  }
}

function _renderWeatherData(widget, data) {
  const current = data.current;
  const daily = data.daily;
  const weatherCodes = {
    0: "fa-sun", 1: "fa-sun", 2: "fa-cloud-sun", 3: "fa-cloud",
    45: "fa-smog", 48: "fa-smog",
    51: "fa-cloud-rain", 53: "fa-cloud-rain", 55: "fa-cloud-rain",
    61: "fa-cloud-showers-heavy", 63: "fa-cloud-showers-heavy", 65: "fa-cloud-showers-heavy",
    71: "fa-snowflake", 73: "fa-snowflake", 75: "fa-snowflake",
    80: "fa-cloud-rain", 81: "fa-cloud-rain", 82: "fa-cloud-rain",
    95: "fa-bolt", 96: "fa-bolt", 99: "fa-bolt",
  };
  const icon = weatherCodes[current.weather_code] || "fa-cloud";

  const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  let forecast = "";
  if (daily) {
    forecast = daily.time.map((date, i) => {
      const d = new Date(date + "T12:00:00");
      const dayIcon = weatherCodes[daily.weather_code[i]] || "fa-cloud";
      return `<div class="weather-day">
        <div class="weather-day-label">${i === 0 ? "Heute" : dayNames[d.getDay()]}</div>
        <div class="weather-day-icon"><i class="fas ${dayIcon}"></i></div>
        <div class="weather-day-temps">
          <span class="weather-day-high">${Math.round(daily.temperature_2m_max[i])}°</span>
          <span class="weather-day-low">${Math.round(daily.temperature_2m_min[i])}°</span>
        </div>
      </div>`;
    }).join("");
  }

  const body = `
    <div class="weather-current">
      <div class="weather-icon"><i class="fas ${icon}"></i></div>
      <div>
        <div class="weather-temp">${Math.round(current.temperature_2m)}°C</div>
        <div class="weather-desc">Wind: ${current.wind_speed_10m} km/h</div>
      </div>
    </div>
    <div class="weather-forecast">${forecast}</div>
  `;
  _updateWidgetBody(widget, body);
}

async function _searchWeatherCity(widget, city) {
  if (!city || !city.trim()) return;
  _updateWidgetBody(widget, '<div class="spinner"><i class="fas fa-spinner fa-spin"></i></div>');
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=5&language=de&format=json`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      _updateWidgetBody(widget, '<p style="color:var(--text-muted);text-align:center;">Stadt nicht gefunden.</p>' + _weatherConfigHTML(widget));
      return;
    }
    const loc = data.results[0];
    const config = { lat: loc.latitude, lon: loc.longitude, city: loc.name };
    apiFetch(`dashboard/widgets/${widget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    widget.config = config;
    _rerenderWidget("weather");
  } catch {
    _updateWidgetBody(widget, '<p style="color:var(--text-muted);text-align:center;">Fehler bei der Suche.</p>' + _weatherConfigHTML(widget));
  }
}

function _weatherConfigHTML(widget) {
  const config = widget.config ? (typeof widget.config === "string" ? JSON.parse(widget.config) : widget.config) : {};
  return `<div class="weather-config">
    <div class="weather-search-wrapper">
      <input type="text" class="weather-city-input" placeholder="Stadt eingeben..." value="${escHtml(config.city || "")}" autocomplete="off" />
      <ul class="weather-suggestions-list" style="display:none;"></ul>
    </div>
    <button class="weather-city-btn"><i class="fas fa-search"></i></button>
    <button class="weather-gps-btn"><i class="fas fa-crosshairs"></i></button>
  </div>`;
}

async function _showWeatherSuggestions(widget, inputEl, query) {
  const suggestionsList = inputEl.parentElement.querySelector(".weather-suggestions-list");
  if (!suggestionsList) return;
  
  if (!query || query.trim().length < 2) {
    suggestionsList.style.display = "none";
    suggestionsList.innerHTML = "";
    return;
  }
  
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=de&format=json`);
    const data = await res.json();
    
    if (!data.results || data.results.length === 0) {
      suggestionsList.style.display = "none";
      return;
    }
    
    suggestionsList.innerHTML = data.results.map(r => `
      <li class="weather-suggestion-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${escHtml(r.name)}">
        <i class="fas fa-map-marker-alt"></i>
        <span>${escHtml(r.name)}</span>
        ${r.admin1 ? `<small>${escHtml(r.admin1)}</small>` : ""}
      </li>
    `).join("");
    
    suggestionsList.style.display = "block";
    
    suggestionsList.querySelectorAll(".weather-suggestion-item").forEach(item => {
      item.addEventListener("click", () => {
        const lat = item.dataset.lat;
        const lon = item.dataset.lon;
        const name = item.dataset.name;
        
        inputEl.value = name;
        suggestionsList.style.display = "none";
        
        // Save and fetch weather
        const config = { lat: parseFloat(lat), lon: parseFloat(lon), city: name };
        apiFetch(`dashboard/widgets/${widget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });
        widget.config = config;
        _rerenderWidget("weather");
      });
    });
  } catch (err) {
    console.error("Wetter-Suggestions Fehler:", err);
    suggestionsList.style.display = "none";
  }
}

function _requestWeatherLocation(widget) {
  if (!navigator.geolocation) {
    alert("Geolocation wird von deinem Browser nicht unterstützt.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const config = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      apiFetch(`dashboard/widgets/${widget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      widget.config = config;
      _rerenderWidget("weather");
    },
    () => alert("Standortzugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen."),
  );
}

function _updateWidgetBody(widget, bodyHTML) {
  const card = document.querySelector(`.widget-${widget.typ}[data-widget-id="${widget.id}"]`);
  if (!card) return;
  const body = card.querySelector(".widget-body");
  if (body) body.innerHTML = bodyHTML;
}

// ─── Helpers ───
function _getDashCache(type) {
  const map = {
    task: "_dashTasks",
    note: "_dashNotes",
    event: "_dashEvents",
    doc: "_dashDocs",
  };
  return window[map[type]];
}

// ─── Externally used functions (from app.js or globals) ───
window.updateStats = function (data) {
  dashboardData = data;
  const openTasks = wsFilter(data.todos || []).filter((t) => t.status !== "erledigt").length;
  const noteCount = wsFilter(data.notizen || []).length;
  const todayEvents = wsFilter(data.events || []).filter(isToday).length;
  const docCount = (data.dokumente || []).length;
  for (const [id, val] of Object.entries({ statTasks: openTasks, statNotes: noteCount, statEvents: todayEvents, statDocs: docCount })) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
};

function renderUser(data) {
  const user = data.user;
  if (!user) return;
  const greeting = document.getElementById("userGreeting");
  if (greeting) greeting.textContent = user.name.split(" ")[0];
}

function wsFilter(items) {
  if (!window.currentWorkspaceId) return items;
  return items.filter((i) => i.workspace_id == window.currentWorkspaceId);
}

function getRemainingDays(dateStr) {
  if (!dateStr) return "";
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0,0,0,0);
  due.setHours(0,0,0,0);
  const diff = Math.round((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Überfällig (${Math.abs(diff)}d)`;
  if (diff === 0) return "Heute";
  if (diff === 1) return "Morgen";
  return `Noch ${diff} Tage`;
}

function isToday(item) {
  if (!item.start_datum) return false;
  const today = new Date();
  const d = new Date(item.start_datum.split("T")[0] || item.start_datum);
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function renderWeekChart(weekData, canvas) {
  if (chartWeek) {
    chartWeek.destroy();
    chartWeek = null;
  }
  if (!canvas) canvas = document.getElementById("chartWeek");
  if (!canvas) return;

  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const map = {};
  weekData.forEach((d) => { map[d.day] = d; });

  const labels = [];
  const minutes = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    labels.push(days[d.getDay()] + " " + d.getDate() + "." + (d.getMonth() + 1));
    const entry = map[key];
    minutes.push(entry ? Math.round(entry.total_seconds / 60) : 0);
  }

  const ctx = canvas.getContext("2d");
  chartWeek = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Fokus (min)",
        data: minutes,
        backgroundColor: "#6e8ab8",
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 10 } },
        x: { grid: { display: false } },
      },
    },
  });
}

// ─── Context Menu ───
function closeCtxMenu() {
  const m = document.getElementById("ctxMenu");
  if (m) m.classList.remove("open");
}

function showDashCtxMenu(e, type, item) {
  e.preventDefault();
  e.stopPropagation();
  closeCtxMenu();

  const menu = document.getElementById("ctxMenu");
  const editItem = menu.querySelector('[data-action="edit"]');
  const toggleItem = menu.querySelector('[data-action="toggle"]');
  const deleteItem = menu.querySelector('[data-action="delete"]');
  const toggleLabel = document.getElementById("ctxToggleLabel");

  const pages = { task: "/todo", note: "/notes", event: "/kalender", doc: "/dokumente" };
  const hashes = { task: true, note: true, event: true };

  editItem.style.display = "flex";
  editItem.onclick = () => {
    closeCtxMenu();
    const base = pages[type] || "/";
    window.location.href = hashes[type] ? `${base}#${item.id}` : base;
  };

  if (type === "task") {
    toggleItem.style.display = "flex";
    const isDone = item.status === "erledigt";
    toggleLabel.textContent = isDone ? "Wieder öffnen" : "Als erledigt markieren";
    toggleItem.onclick = async () => {
      closeCtxMenu();
      try {
        const newStatus = isDone ? "offen" : "erledigt";
        const token = localStorage.getItem("token");
        await fetch(`/api/todos/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include",
        });
        if (dashboardData && dashboardData.todos) {
          dashboardData.todos = dashboardData.todos.map((t) => t.id === item.id ? { ...t, status: newStatus } : t);
          _rerenderWidget("tasks");
          window.updateStats(dashboardData);
        }
      } catch (err) {
        console.error("Fehler:", err);
      }
    };
  } else {
    toggleItem.style.display = "none";
  }

  deleteItem.onclick = async () => {
    closeCtxMenu();
    try {
      const endpoints = { task: `/api/todos/${item.id}`, note: `/api/notizen/${item.id}`, event: `/api/kalender/${item.id}`, doc: `/api/dokumente/${item.id}` };
      const token = localStorage.getItem("token");
      await fetch(endpoints[type], {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      const keys = { task: "todos", note: "notizen", event: "events", doc: "dokumente" };
      if (dashboardData) {
        dashboardData[keys[type]] = (dashboardData[keys[type]] || []).filter((x) => x.id !== item.id);
      }
      _rerenderWidget(keys[type] === "todos" ? "tasks" : keys[type] === "notizen" ? "notes" : keys[type] === "events" ? "events" : "docs");
      window.updateStats(dashboardData);
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
    }
  };

  const x = Math.min(e.clientX, window.innerWidth - menu.offsetWidth - 8);
  const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 8);
  menu.style.left = x + "px";
  menu.style.top = y + "px";
  menu.classList.add("open");
}

// ─── Widget Manager Modal ───
function openWidgetManager() {
  const modal = document.getElementById("widgetModal");
  if (!modal) return;
  modal.classList.add("open");
  _renderWidgetManager();
}

function closeWidgetManager() {
  const modal = document.getElementById("widgetModal");
  if (modal) modal.classList.remove("open");
}

function _renderWidgetManager() {
  const list = document.getElementById("widgetManagerList");
  if (!list) return;

  const activeTypes = _widgets.map((w) => w.typ);
  const allTypes = Object.entries(WIDGET_TYPES);

  list.innerHTML = allTypes.map(([key, info]) => {
    const isActive = activeTypes.includes(key);
    return `<div class="wm-item ${isActive ? "active" : ""}" data-typ="${key}" draggable="false">
      <span class="wm-handle"><i class="fas fa-grip-vertical"></i></span>
      <span class="wm-icon" style="background:${info.color}"><i class="fas ${info.icon}"></i></span>
      <div class="wm-info">
        <div class="wm-name">${info.name}</div>
        <div class="wm-desc">${info.desc}</div>
      </div>
      <span class="wm-toggle"><i class="fas fa-check"></i></span>
    </div>`;
  }).join("");

  list.querySelectorAll(".wm-item").forEach((el) => {
    el.addEventListener("click", async () => {
      const typ = el.dataset.typ;
      const isActive = el.classList.contains("active");
      if (isActive) {
        const w = _widgets.find((x) => x.typ === typ);
        if (w) await _removeWidget(w.id);
        el.classList.remove("active");
      } else {
        await _addWidget(typ);
        el.classList.add("active");
      }
    });
  });
}

// ─── Events ───
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();

  // Widget manager button
  const mgrBtn = document.getElementById("widgetManageBtn");
  if (mgrBtn) mgrBtn.addEventListener("click", openWidgetManager);

  // Modal close
  const closeBtn = document.getElementById("widgetModalClose");
  if (closeBtn) closeBtn.addEventListener("click", closeWidgetManager);
  document.getElementById("widgetModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeWidgetManager();
  });

  // Workspace change re-render
  window.addEventListener("workspacechange", () => {
    if (dashboardData) {
      _rerenderWidget("tasks");
      _rerenderWidget("notes");
      _rerenderWidget("events");
      _rerenderWidget("calendar");
      _rerenderWidget("stats");
    }
  });

  // Close context menu on click outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".ctx-menu")) closeCtxMenu();
  });
});
