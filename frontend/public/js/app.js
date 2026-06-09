const API_BASE = "/api";

const WORKSPACE_COLORS = {
  orange: "#f19a3d",
  blue: "#4c91ff",
  green: "#78b85f",
  pink: "#cf79ff",
  red: "#ff5b50",
  purple: "#8B5CF6",
  teal: "#14B8A6",
  yellow: "#F59E0B",
};

async function authFetch(url, options = {}) {
  options.credentials = "include";
  const token = localStorage.getItem("token");
  options.headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, options);

    if (response.status === 401 || response.status === 403) {
      if (!window.location.pathname.includes("/login")) {
        window.location.replace("/login");
      }
      return null;
    }

    return response;
  } catch (err) {
    console.error("Netzwerkfehler:", err);
    return null;
  }
}

async function checkAuthStatus() {
  const res = await authFetch(`${API_BASE}/auth/me`);
  const isPublic =
    window.location.pathname.includes("/login") ||
    window.location.pathname.includes("/register");

  if (!res || !res.ok) {
    if (!isPublic) window.location.replace("/login");
    return null;
  }

  const user = await res.json();
  if (isPublic) window.location.replace("/");
  return user;
}

function renderUserInfo(user) {
  if (!user) return;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const nameEl = document.getElementById("userNameDisplay");
  if (nameEl) nameEl.textContent = user.name;

  const greetingEl = document.getElementById("userGreeting");
  if (greetingEl) greetingEl.textContent = user.name.split(" ")[0];

  const avatarEl = document.getElementById("userInitials");
  if (!avatarEl) return;
  if (user.avatar) {
    avatarEl.innerHTML = `<img src="/uploads/avatars/${user.avatar}?t=${Date.now()}" alt="" />`;
    avatarEl.classList.add("has-img");
  } else {
    avatarEl.textContent = initials;
    avatarEl.classList.remove("has-img");
  }
}

window.logout = async function () {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {}
  localStorage.removeItem("token");
  window.location.replace("/login");
};

// ─── Toast-Benachrichtigungen ───
window.showToast = function (message, type) {
  const existing = document.querySelector(".toast-container");
  let container = existing;
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast " + (type || "info");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 3000);
};

async function loadWallpaper() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/auth/wallpaper", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!res || !res.ok) return;
    const data = await res.json();
    if (data.wallpaper) {
      document.body.style.background = `url(/uploads/wallpapers/${data.wallpaper}?t=${Date.now()}) center/cover fixed no-repeat`;
      document.body.classList.add("has-wallpaper");
    }
  } catch {}
}

// ─── Dark Mode ───
window.toggleDarkMode = function () {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark ? "1" : "");
  const icon = document.querySelector("#darkModeToggle i");
  if (icon) icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
};

function loadDarkMode() {
  const saved = localStorage.getItem("darkMode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (saved === "1" || (!saved && prefersDark)) {
    document.body.classList.add("dark");
    const icon = document.querySelector("#darkModeToggle i");
    if (icon) icon.className = "fas fa-sun";
  }
}

// ─── Workspace-Switcher (global) ───
window.currentWorkspaceId = null;
window.workspaceCache = [];

async function loadWorkspaces() {
  const res = await authFetch(`${API_BASE}/workspaces`);
  if (!res || !res.ok) return;
  window.workspaceCache = await res.json();
  renderWsSidebarList();
}

function renderWsSidebarList() {
  const list = document.getElementById("wsSbList");
  if (!list) return;
  list.innerHTML = window.workspaceCache.map(w => {
    const active = window.currentWorkspaceId == w.id;
    const color = WORKSPACE_COLORS[w.farbe] || "#ccc";
    return `<div class="ws-sb-dd-item${active ? " active" : ""}" data-id="${w.id}" onclick="event.stopPropagation();selectWsSidebar(${w.id})">
      <span class="ws-sb-dd-dot" style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></span>
      <span>${w.name}</span>
      <span class="ws-sb-check"><i class="fas fa-check"></i></span>
    </div>`;
  }).join("");
  // Update the "Alle" active state
  const allItem = document.querySelector('#sidebarWs .ws-sb-dd-item[data-id=""]');
  if (allItem) allItem.classList.toggle("active", !window.currentWorkspaceId);
}

window.toggleWsFromCalendar = function (e) {
  const dd = document.getElementById("wsSbDropdown");
  const wasOpen = dd.classList.contains("open");
  document.querySelectorAll(".ws-sb-dropdown").forEach(d => d.classList.remove("open"));
  if (wasOpen) return;

  dd.classList.add("open");
  const rect = e.currentTarget.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  dd.style.top = (rect.bottom + 2) + "px";
  dd.style.left = cx + "px";
  dd.style.transform = "translateX(-50%)";
  dd.style.right = "auto";
  dd.style.bottom = "auto";
};

window.selectWsSidebar = function (id) {
  if (id === "") id = null;
  window.currentWorkspaceId = id;
  localStorage.setItem("mindful_workspace", id || "");

  const dot = document.getElementById("wsSbDot");
  const name = document.getElementById("wsSbName");
  const dashDot = document.getElementById("dashWsDot");
  const dashLabel = document.getElementById("dashWsLabel");

  if (id) {
    const ws = window.workspaceCache.find(w => w.id == id);
    const color = ws ? (WORKSPACE_COLORS[ws.farbe] || "#999") : "#999";
    dot.style.background = color;
    name.textContent = ws ? ws.name : "Alle";
    if (dashDot) dashDot.style.background = color;
    if (dashLabel) dashLabel.textContent = ws ? ws.name : "Alle";
  } else {
    dot.style.background = "#999";
    name.textContent = "Alle";
    if (dashDot) dashDot.style.background = "#999";
    if (dashLabel) dashLabel.textContent = "Alle";
  }

  document.getElementById("wsSbDropdown").classList.remove("open");

  const items = document.querySelectorAll("#wsSbList .ws-sb-dd-item, #sidebarWs .ws-sb-dd-item[data-id='']");
  items.forEach(el => el.classList.toggle("active", el.dataset.id == id));

  window.dispatchEvent(new CustomEvent("workspacechange", { detail: { workspaceId: id } }));
};

window.quickCreateWsSidebar = async function () {
  const name = document.getElementById("wsSbNewName").value.trim();
  const activeDot = document.querySelector("#wsSbNewColors .ws-color-dot.active");
  const farbe = activeDot ? activeDot.dataset.color : "orange";
  if (!name) { showToast("Bitte einen Namen eingeben", "error"); return; }

  const res = await authFetch(`${API_BASE}/workspaces`, {
    method: "POST",
    body: JSON.stringify({ name, farbe }),
  });
  if (res && res.ok) {
    const data = await res.json();
    document.getElementById("wsSbNewName").value = "";
    showToast("Workspace erstellt", "success");
    await loadWorkspaces();
    selectWsSidebar(data.id);
  }
};

(function initWsColors() {
  document.addEventListener("click", function (e) {
    const dot = e.target.closest("#wsSbNewColors .ws-color-dot");
    if (dot) {
      document.querySelectorAll("#wsSbNewColors .ws-color-dot").forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
    }
  });
})();

(function initWsEnter() {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && document.activeElement === document.getElementById("wsSbNewName")) {
      quickCreateWsSidebar();
    }
  });
})();

// ─── Globale Suche ───
let searchTimeout = null;

window.openSearch = function () {
  const overlay = document.getElementById("searchOverlay");
  overlay.classList.add("open");
  const input = document.getElementById("searchInput");
  input.value = "";
  document.getElementById("searchResults").innerHTML = '<div class="search-empty">Suchbegriff eingeben…</div>';
  setTimeout(() => input.focus(), 50);
  loadSuggestions();
};

async function loadSuggestions() {
  const res = await authFetch(`${API_BASE}/search?q=`);
  if (!res || !res.ok) return;
  const data = await res.json();
  if (!data.suggestions) return;
  const total = data.todos.length + data.notizen.length + data.events.length;
  if (total === 0) return;

  let html = '<div class="search-group"><div class="search-group-header"><i class="fas fa-clock"></i>Zuletzt verwendet</div>';

  data.todos.forEach(t => {
    html += `<div class="search-item" onclick="navigateTo('todo', ${t.id})">
      <i class="tasks fas fa-check-circle"></i>
      <span class="si-title">${escHtml(t.titel)}</span>
      <span class="si-meta">${t.status}</span>
    </div>`;
  });
  data.notizen.forEach(n => {
    html += `<div class="search-item" onclick="navigateTo('notes', ${n.id})">
      <i class="notes fas fa-sticky-note"></i>
      <span class="si-title">${escHtml(n.titel)}</span>
    </div>`;
  });
  data.events.forEach(e => {
    const date = e.start_datum ? new Date(e.start_datum) : null;
    const dateStr = date ? `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}` : "";
    html += `<div class="search-item" onclick="navigateTo('calendar', ${e.id})">
      <i class="events fas fa-calendar-alt"></i>
      <span class="si-title">${escHtml(e.titel)}</span>
      <span class="si-meta">${dateStr}</span>
    </div>`;
  });
  html += '</div>';
  document.getElementById("searchResults").innerHTML = html;
}

window.closeSearch = function (e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById("searchOverlay").classList.remove("open");
  clearTimeout(searchTimeout);
};

async function performSearch(q) {
  const resultsEl = document.getElementById("searchResults");
  if (!q.trim()) {
    loadSuggestions();
    return;
  }

  const res = await authFetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
  if (!res || !res.ok) { resultsEl.innerHTML = '<div class="search-empty">Fehler bei der Suche</div>'; return; }

  const data = await res.json();
  const total = data.todos.length + data.notizen.length + data.events.length;

  if (total === 0) {
    resultsEl.innerHTML = '<div class="search-empty">Keine Ergebnisse gefunden</div>';
    return;
  }

  let html = "";

  if (data.todos.length > 0) {
    html += '<div class="search-group"><div class="search-group-header"><i class="fas fa-check-circle"></i>Aufgaben</div>';
    data.todos.forEach(t => {
      html += `<div class="search-item" onclick="navigateTo('todo', ${t.id})">
        <i class="tasks fas fa-check-circle"></i>
        <span class="si-title">${escHtml(t.titel)}</span>
        <span class="si-meta">${t.status}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (data.notizen.length > 0) {
    html += '<div class="search-group"><div class="search-group-header"><i class="fas fa-sticky-note"></i>Notizen</div>';
    data.notizen.forEach(n => {
      html += `<div class="search-item" onclick="navigateTo('notes', ${n.id})">
        <i class="notes fas fa-sticky-note"></i>
        <span class="si-title">${escHtml(n.titel)}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (data.events.length > 0) {
    html += '<div class="search-group"><div class="search-group-header"><i class="fas fa-calendar-alt"></i>Termine</div>';
    data.events.forEach(e => {
      const date = e.start_datum ? new Date(e.start_datum) : null;
      const dateStr = date ? `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}` : "";
      html += `<div class="search-item" onclick="navigateTo('calendar', ${e.id})">
        <i class="events fas fa-calendar-alt"></i>
        <span class="si-title">${escHtml(e.titel)}</span>
        <span class="si-meta">${dateStr}</span>
      </div>`;
    });
    html += '</div>';
  }

  resultsEl.innerHTML = html;
}

window.navigateTo = function (page, id) {
  closeSearch();
  const paths = { todo: `/todo`, notes: `/notes`, calendar: `/calendar` };
  const base = paths[page] || "/";
  window.location.href = id ? `${base}#${id}` : base;
};

function escHtml(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    openSearch();
  }
  if (e.key === "Escape") {
    if (document.getElementById("searchOverlay").classList.contains("open")) {
      closeSearch();
    }
  }
});

// Search input with debounce
document.addEventListener("input", function (e) {
  if (e.target.id === "searchInput") {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value), 200);
  }
});

// Enter on search = open first result
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && document.activeElement?.id === "searchInput") {
    const first = document.querySelector(".search-item");
    if (first) first.click();
  }
});

// ─── Global Timer ───
let _globalTimerInterval = null;
let _globalTimerSeconds = 0;

async function loadActiveSession() {
  try {
    const res = await authFetch(`${API_BASE}/todos?status=in%20arbeit`);
    if (!res || !res.ok) return;
    const todos = await res.json();
    if (todos.length > 0) {
      startGlobalTimer(todos[0]);
    }
  } catch {}
}

function startGlobalTimer(todo) {
  const el = document.getElementById("globalTimer");
  const display = document.getElementById("globalTimerDisplay");
  if (!el || !display) return;

  if (todo.pomo_seconds) {
    _globalTimerSeconds = todo.pomo_seconds;
  }

  el.style.display = "flex";
  el.title = "Aktive Aufgabe: " + (todo.titel || "");
  el.onclick = () => { window.location.href = "/todo"; };
  updateGlobalDisplay();
  clearInterval(_globalTimerInterval);
  _globalTimerInterval = setInterval(() => {
    _globalTimerSeconds++;
    updateGlobalDisplay();
  }, 1000);
}

function stopGlobalTimer() {
  const el = document.getElementById("globalTimer");
  if (el) el.style.display = "none";
  clearInterval(_globalTimerInterval);
  _globalTimerInterval = null;
  _globalTimerSeconds = 0;
}

function updateGlobalDisplay() {
  const display = document.getElementById("globalTimerDisplay");
  if (!display) return;
  const m = String(Math.floor(_globalTimerSeconds / 60)).padStart(2, "0");
  const s = String(_globalTimerSeconds % 60).padStart(2, "0");
  display.textContent = `${m}:${s}`;
}

window.startGlobalTimer = startGlobalTimer;
window.stopGlobalTimer = stopGlobalTimer;

document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuthStatus();
  if (user) {
    renderUserInfo(user);
    loadWallpaper();
    loadDarkMode();
    loadWorkspaces();
    const saved = localStorage.getItem("mindful_workspace");
    if (saved) {
      selectWsSidebar(parseInt(saved));
    }
    loadActiveSession();  // <-- ADD THIS LINE
  }
});
