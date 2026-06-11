const API_BASE = "/api";

// ─── Safe JSON Helper (for all files) ───
async function safeJson(response) {
  if (!response) return null;
  try {
    return await response.json();
  } catch (err) {
    console.error("JSON parsing error:", err);
    return null;
  }
}

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
  const isPublicPage =
    window.location.pathname.includes("/login") ||
    window.location.pathname.includes("/register") ||
    window.location.pathname === "/changelog";

  if (!res || !res.ok) {
    if (!isPublicPage) window.location.replace("/login");
    return null;
  }

  const user = await res.json();
  if (!user) {
    if (!isPublicPage) window.location.replace("/login");
    return null;
  }

  if (window.location.pathname.includes("/login") || window.location.pathname.includes("/register")) {
    window.location.replace("/");
  }
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
  if (nameEl && user?.name) nameEl.textContent = user.name;

  const greetingEl = document.getElementById("userGreeting");
  if (greetingEl && user?.name) greetingEl.textContent = user.name.split(" ")[0];

  const avatarEl = document.getElementById("userInitials");
  if (!avatarEl) return;
  if (user?.avatar) {
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
  stopGlobalTimer();
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

function buildWsTree(flat) {
  const map = {};
  const roots = [];
  flat.forEach(w => { w._children = []; map[w.id] = w; });
  flat.forEach(w => {
    if (w.parent_id && map[w.parent_id]) {
      map[w.parent_id]._children.push(w);
    } else {
      roots.push(w);
    }
  });
  return roots;
}

function flattenWsTree(roots) {
  const result = [];
  function walk(nodes, level) {
    nodes.forEach(n => {
      n._level = level;
      result.push(n);
      if (n._children.length) walk(n._children, level + 1);
    });
  }
  walk(roots, 0);
  return result;
}

function getDescendantIds(id) {
  const ids = [id];
  const childrenMap = {};
  window.workspaceCache.forEach(w => {
    if (!childrenMap[w.parent_id]) childrenMap[w.parent_id] = [];
    childrenMap[w.parent_id].push(w.id);
  });
  function collect(parentId) {
    (childrenMap[parentId] || []).forEach(childId => {
      ids.push(childId);
      collect(childId);
    });
  }
  collect(id);
  return ids;
}

async function loadWorkspaces() {
  const res = await authFetch(`${API_BASE}/workspaces`);
  if (!res || !res.ok) return;
  window.workspaceCache = await res.json();
  window._wsTree = buildWsTree(window.workspaceCache);
  renderWsSidebarList();
}

function renderWsSidebarList() {
  const list = document.getElementById("wsSbList");
  if (!list) return;
  const flat = flattenWsTree(window._wsTree);

  list.innerHTML = flat.map(w => {
    const active = window.currentWorkspaceId == w.id;
    const color = WORKSPACE_COLORS[w.farbe] || "#ccc";
    const hasChildren = w._children.length > 0;
    const expandBtn = hasChildren
      ? `<span class="ws-sb-expand" data-expand="${w.id}"><i class="fas fa-chevron-right"></i></span>`
      : `<span class="ws-sb-expand ws-sb-expand-placeholder"></span>`;
    return `<div class="ws-sb-dd-item${active ? " active" : ""}" data-id="${w.id}" data-level="${w._level}" draggable="true">
      <span class="ws-sb-dd-indent" style="padding-left:${w._level * 18}px"></span>
      ${expandBtn}
      <span class="ws-sb-dd-dot" style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></span>
      <span class="ws-sb-dd-name">${w.name}</span>
      <span class="ws-sb-check"><i class="fas fa-check"></i></span>
    </div>`;
  }).join("");

  // Click-Events per addEventListener (damit stopPropagation funktioniert)
  list.querySelectorAll(".ws-sb-dd-item").forEach(el => {
    el.addEventListener("click", e => {
      e.stopPropagation();
      window.selectWsSidebar(parseInt(el.dataset.id));
    });
    el.addEventListener("contextmenu", e => {
      e.preventDefault();
      e.stopPropagation();
      window.openWsCtxMenu(e, parseInt(el.dataset.id));
    });
    const id = parseInt(el.dataset.id);
    if (!isNaN(id)) {
      el.addEventListener("dragstart", e => window.wsDragStart(e, id));
      el.addEventListener("dragover", e => window.wsDragOver(e));
      el.addEventListener("drop", e => window.wsDrop(e, id));
    }
  });
  list.querySelectorAll(".ws-sb-expand[data-expand]").forEach(el => {
    el.addEventListener("click", e => {
      e.stopPropagation();
      window.toggleWsExpand(el);
    });
  });

  const allItem = document.querySelector('#sidebarWs .ws-sb-dd-item[data-id=""]');
  if (allItem) allItem.classList.toggle("active", !window.currentWorkspaceId);

  // "Alle Bereiche" als Drop-Zone: DnD darauf → parent_id = null
  if (allItem) {
    allItem.addEventListener("dragover", e => window.wsDragOver(e));
    allItem.addEventListener("drop", e => window.wsDrop(e, 0));
  }
}

// Expand / Collapse
window.toggleWsExpand = function (btn) {
  const item = btn.closest(".ws-sb-dd-item");
  const id = item.dataset.id;
  const collapsed = item.classList.toggle("collapsed");
  const icon = btn.querySelector("i");
  if (icon) icon.style.transform = collapsed ? "rotate(0deg)" : "rotate(90deg)";
  // Hide/show children
  let next = item.nextElementSibling;
  while (next && next.dataset.level > item.dataset.level) {
    next.style.display = collapsed ? "none" : "";
    next = next.nextElementSibling;
  }
};

// Drag & Drop
let _wsDragId = null;

window.wsDragStart = function (e, id) {
  _wsDragId = id;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", String(id));
  document.querySelectorAll(".ws-sb-dd-item, .workspace-item").forEach(el => el.classList.remove("ws-dragging", "ws-drag-over"));
  const item = e.currentTarget;
  item.classList.add("ws-dragging");
};

document.addEventListener("dragend", function () {
  document.querySelectorAll(".ws-sb-dd-item, .workspace-item").forEach(el => el.classList.remove("ws-dragging", "ws-drag-over"));
  _wsDragId = null;
});

window.wsDragOver = function (e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  document.querySelectorAll(".ws-sb-dd-item, .workspace-item").forEach(el => el.classList.remove("ws-drag-over"));
  e.currentTarget.classList.add("ws-drag-over");
};

window.wsDrop = async function (e, targetId) {
  e.preventDefault();
  e.currentTarget.classList.remove("ws-drag-over");
  const dragId = _wsDragId || parseInt(e.dataTransfer.getData("text/plain"));
  if (!dragId || dragId == targetId) return;

  // Auf "Alle" ablegen → parent_id = null (root)
  // Auf einen Workspace ablegen → wird Kind des Targets (parent_id = targetId)
  const newParentId = targetId === 0 ? null : targetId;

  const res = await authFetch(`${API_BASE}/workspaces/${dragId}/move`, {
    method: "PUT",
    body: JSON.stringify({ parent_id: newParentId }),
  });
  if (!res || !res.ok) return showToast("Fehler beim Verschieben", "error");
  showToast("Verschoben", "success");
  await loadWorkspaces();
  window.dispatchEvent(new CustomEvent("workspacechange", { detail: { workspaceId: window.currentWorkspaceId } }));
};

/* ─── Workspace-Kontextmenü ─── */
let _wsCtxId = null;

window.openWsCtxMenu = function (e, id) {
  _wsCtxId = id;
  const menu = document.getElementById("wsCtxMenu");
  menu.querySelector("[data-action='make-root']").onclick = () => {
    closeWsCtxMenu();
    moveWsToRoot(id);
  };
  menu.querySelector("[data-action='add-child']").onclick = () => {
    closeWsCtxMenu();
    document.getElementById("wsSbNewName").value = "";
    document.getElementById("wsSbNewName").focus();
    document.getElementById("wsSbDropdown").classList.add("open");
    document.getElementById("wsSbNewName").dataset.parentId = id;
  };
  menu.querySelector("[data-action='rename']").onclick = () => {
    closeWsCtxMenu();
    const ws = window.workspaceCache.find(w => w.id === id);
    if (!ws) return;
    const name = prompt("Neuen Namen eingeben:", ws.name);
    if (!name || name === ws.name) return;
    renameWs(id, name);
  };
  menu.querySelector("[data-action='delete']").onclick = () => {
    closeWsCtxMenu();
    if (!confirm("Workspace wirklich löschen? Unter-Workspaces werden an den nächsthöheren Parent gehängt.")) return;
    deleteWs(id);
  };

  const x = Math.min(e.clientX, window.innerWidth - menu.offsetWidth - 8);
  const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 8);
  menu.style.left = x + "px";
  menu.style.top = y + "px";
  menu.classList.add("open");
};

async function moveWsToRoot(id) {
  const res = await authFetch(`${API_BASE}/workspaces/${id}/move`, {
    method: "PUT",
    body: JSON.stringify({ parent_id: null }),
  });
  if (!res || !res.ok) return showToast("Fehler", "error");
  showToast("Zu root gemacht", "success");
  await loadWorkspaces();
  window.dispatchEvent(new CustomEvent("workspacechange", { detail: { workspaceId: window.currentWorkspaceId } }));
}

function closeWsCtxMenu() {
  const menu = document.getElementById("wsCtxMenu");
  if (menu) menu.classList.remove("open");
  _wsCtxId = null;
}

document.addEventListener("click", closeWsCtxMenu);
document.addEventListener("contextmenu", (e) => {
  if (!e.target.closest(".ws-sb-dd-item")) closeWsCtxMenu();
});

async function renameWs(id, name) {
  const res = await authFetch(`${API_BASE}/workspaces/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  if (!res || !res.ok) return showToast("Fehler beim Umbenennen", "error");
  showToast("Umbenannt", "success");
  await loadWorkspaces();
  window.dispatchEvent(new CustomEvent("workspacechange", { detail: { workspaceId: window.currentWorkspaceId } }));
}

async function deleteWs(id) {
  const res = await authFetch(`${API_BASE}/workspaces/${id}`, { method: "DELETE" });
  if (!res || !res.ok) return showToast("Fehler beim Löschen", "error");
  showToast("Gelöscht", "success");
  if (window.currentWorkspaceId === id) {
    window.currentWorkspaceId = null;
    localStorage.removeItem("mindful_workspace");
  }
  await loadWorkspaces();
  window.dispatchEvent(new CustomEvent("workspacechange", { detail: { workspaceId: window.currentWorkspaceId } }));
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
  window.currentWorkspaceId = id === "" ? null : id;

  const selectedIds = window.currentWorkspaceId ? getDescendantIds(window.currentWorkspaceId) : [];

  localStorage.setItem("mindful_workspace", id);
  localStorage.setItem("mindful_workspace_ids", JSON.stringify(selectedIds));

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

  const items = document.querySelectorAll("#wsSbList .ws-sb-dd-item, #sidebarWs .ws-sb-dd-item");
  items.forEach(el => {
    el.classList.remove("active");
    if (el.dataset.id == id) el.classList.add("active");
  });

  window.dispatchEvent(new CustomEvent("workspacechange", { detail: { workspaceId: window.currentWorkspaceId, workspaceIds: selectedIds } }));
  loadSidebarUnread();
};

window.quickCreateWsSidebar = async function () {
  const name = document.getElementById("wsSbNewName").value.trim();
  const activeDot = document.querySelector("#wsSbNewColors .ws-color-dot.active");
  const farbe = activeDot ? activeDot.dataset.color : "orange";
  if (!name) { showToast("Bitte einen Namen eingeben", "error"); return; }

  const input = document.getElementById("wsSbNewName");
  const parentId = input.dataset.parentId || window.currentWorkspaceId || null;
  delete input.dataset.parentId;

  const res = await authFetch(`${API_BASE}/workspaces`, {
    method: "POST",
    body: JSON.stringify({ name, farbe, parent_id: parentId }),
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

// ─── Globale Suche (Spotlight-ähnlich) ───
let _searchTimeout = null;
let _searchAbortController = null;
let _searchItems = [];
let _searchActiveIndex = -1;

const _searchIconMap = {
  todo: '<span class="si-icon si-todo"><i class="fas fa-check"></i></span>',
  notiz: '<span class="si-icon si-notiz"><i class="fas fa-sticky-note"></i></span>',
  event: '<span class="si-icon si-event"><i class="fas fa-calendar-alt"></i></span>',
  dokument: '<span class="si-icon si-dokument"><i class="fas fa-file"></i></span>',
};

window.openSearch = function () {
  const overlay = document.getElementById("searchOverlay");
  overlay.classList.add("open");
  const input = document.getElementById("searchInput");
  input.value = "";
  _searchItems = [];
  _searchActiveIndex = -1;
  document.getElementById("searchResults").innerHTML = '<div class="search-empty">Suchbegriff eingeben…</div>';
  setTimeout(() => input.focus(), 50);
  _fetchSuggestions();
};

window.closeSearch = function (e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById("searchOverlay").classList.remove("open");
  clearTimeout(_searchTimeout);
  if (_searchAbortController) {
    _searchAbortController.abort();
    _searchAbortController = null;
  }
  _searchItems = [];
  _searchActiveIndex = -1;
};

function _highlightText(text, query) {
  if (!query || !text) return escHtml(text);
  const escaped = escHtml(text);
  const q = escHtml(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${q})`, "gi");
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function _formatMeta(item) {
  if (item.typ === "todo" && item.status) return escHtml(item.status);
  if (item.typ === "event" && item.start_datum) {
    const d = new Date(item.start_datum);
    return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
  }
  if (item.typ === "dokument") return item.dateiname ? escHtml(item.dateiname) : (item.dateityp || "Datei");
  return "";
}

function _buildItemHtml(item, q) {
  const icon = _searchIconMap[item.typ] || '<i class="fas fa-file"></i>';
  const title = q ? _highlightText(item.titel, q) : escHtml(item.titel);
  const meta = _formatMeta(item);
  let snippet = "";
  if (item.snippet && item.snippet !== item.titel) {
    snippet = `<span class="si-snippet">${q ? _highlightText(item.snippet, q) : escHtml(item.snippet)}</span>`;
  }
  return { html: `<div class="search-item" data-index="${_searchItems.length}" onclick="navigateToResult(${_searchItems.length})">
    ${icon}
    <span class="si-title">${title}</span>
    ${meta ? `<span class="si-meta">${meta}</span>` : ""}
    ${snippet}
  </div>`, item };
}

function _renderSuggestions(data) {
  _searchItems = [];
  _searchActiveIndex = -1;
  let html = '<div class="search-group"><div class="search-group-header"><i class="fas fa-clock"></i>Zuletzt verwendet</div>';
  let count = 0;
  ["todos", "notizen", "events", "dokumente"].forEach(key => {
    (data[key] || []).forEach(item => {
      const result = _buildItemHtml(item, "");
      _searchItems.push(result.item);
      html += result.html;
      count++;
    });
  });
  html += '</div>';
  if (!count) {
    document.getElementById("searchResults").innerHTML = '<div class="search-empty">Suchbegriff eingeben…</div>';
    return;
  }
  document.getElementById("searchResults").innerHTML = html;
  _searchActiveIndex = 0;
  _updateActiveItem();
}

function _renderResults(data, q) {
  _searchItems = [];
  _searchActiveIndex = -1;

  const groups = [
    { key: "todos", label: "Aufgaben", icon: "fa-check-circle" },
    { key: "notizen", label: "Notizen", icon: "fa-sticky-note" },
    { key: "events", label: "Termine", icon: "fa-calendar-alt" },
    { key: "dokumente", label: "Dokumente", icon: "fa-file" },
  ];

  let html = "";
  let total = 0;

  groups.forEach(group => {
    const items = data[group.key] || [];
    if (items.length === 0) return;
    total += items.length;
    html += `<div class="search-group"><div class="search-group-header"><i class="fas ${group.icon}"></i>${group.label}</div>`;
    items.forEach(item => {
      const result = _buildItemHtml(item, q);
      _searchItems.push(result.item);
      html += result.html;
    });
    html += '</div>';
  });

  const el = document.getElementById("searchResults");
  if (total === 0) {
    el.innerHTML = '<div class="search-empty">Keine Ergebnisse gefunden</div>';
    return;
  }
  el.innerHTML = html;
  _searchActiveIndex = 0;
  _updateActiveItem();
}

function _updateActiveItem() {
  document.querySelectorAll(".search-item").forEach((el, i) => {
    el.classList.toggle("active", i === _searchActiveIndex);
  });
  const active = document.querySelector(`.search-item[data-index="${_searchActiveIndex}"]`);
  if (active) active.scrollIntoView({ block: "nearest" });
}

async function _fetchSuggestions() {
  if (_searchAbortController) _searchAbortController.abort();
  _searchAbortController = new AbortController();
  const res = await authFetch(`${API_BASE}/search?q=`);
  if (!res || !res.ok) return;
  const data = await res.json();
  if (!data.suggestions) return;
  _renderSuggestions(data);
}

window.navigateToResult = function (index) {
  if (index < 0 || index >= _searchItems.length) return;
  const item = _searchItems[index];
  closeSearch();
  const paths = { todo: "/todo", notiz: "/notes", event: "/calendar", dokument: "/documents" };
  window.location.href = item.id ? `${paths[item.typ] || "/"}#${item.typ}-${item.id}` : (paths[item.typ] || "/");
};

async function performSearch(q) {
  const resultsEl = document.getElementById("searchResults");
  if (!q.trim()) { _fetchSuggestions(); return; }

  if (_searchAbortController) _searchAbortController.abort();
  _searchAbortController = new AbortController();
  const signal = _searchAbortController.signal;

  const res = await authFetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
  if (!res || !res.ok) {
    if (!signal.aborted) resultsEl.innerHTML = '<div class="search-empty">Fehler bei der Suche</div>';
    return;
  }
  const data = await res.json();
  if (signal.aborted) return;
  _renderResults(data, q);
}

function escHtml(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

document.addEventListener("keydown", function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    openSearch();
  }
  if (e.key === "Escape") {
    const overlay = document.getElementById("searchOverlay");
    if (overlay.classList.contains("open")) closeSearch();
  }
});

document.addEventListener("input", function (e) {
  if (e.target.id === "searchInput") {
    clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => performSearch(e.target.value), 200);
  }
});

document.addEventListener("keydown", function (e) {
  if (!document.getElementById("searchOverlay").classList.contains("open")) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (_searchItems.length) {
      _searchActiveIndex = (_searchActiveIndex + 1) % _searchItems.length;
      _updateActiveItem();
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (_searchItems.length) {
      _searchActiveIndex = (_searchActiveIndex - 1 + _searchItems.length) % _searchItems.length;
      _updateActiveItem();
    }
  } else if (e.key === "Enter" && _searchItems.length > 0 && _searchActiveIndex >= 0) {
    e.preventDefault();
    navigateToResult(_searchActiveIndex);
  }
});

// ─── Global Timer (Pomodoro-basiert) ───
let _globalTimerInterval = null;
let _globalTimerRemaining = 0;

function initGlobalTimer() {
  const el = document.getElementById("globalTimer");
  const display = document.getElementById("globalTimerDisplay");
  if (!el || !display) return;

  const raw = localStorage.getItem("pomoState");
  if (!raw) { el.style.display = "none"; return; }

  let state;
  try { state = JSON.parse(raw); } catch { el.style.display = "none"; return; }

  if (!state.running) { el.style.display = "none"; return; }

  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  _globalTimerRemaining = Math.max(0, state.remaining - elapsed);

  if (_globalTimerRemaining <= 0) {
    localStorage.removeItem("pomoState");
    el.style.display = "none";
    return;
  }

  el.style.display = "flex";
  el.title = "Pomodoro läuft";
  el.onclick = () => { window.location.href = "/pomodoro"; };
  updateGlobalDisplay();
  clearInterval(_globalTimerInterval);
  _globalTimerInterval = setInterval(() => {
    _globalTimerRemaining--;
    if (_globalTimerRemaining <= 0) {
      _globalTimerRemaining = 0;
      updateGlobalDisplay();
      stopGlobalTimer();
    } else {
      updateGlobalDisplay();
    }
  }, 1000);
}

function stopGlobalTimer() {
  const el = document.getElementById("globalTimer");
  if (el) el.style.display = "none";
  clearInterval(_globalTimerInterval);
  _globalTimerInterval = null;
  _globalTimerRemaining = 0;
}

function updateGlobalDisplay() {
  const display = document.getElementById("globalTimerDisplay");
  if (!display) return;
  const m = String(Math.floor(_globalTimerRemaining / 60)).padStart(2, "0");
  const s = String(_globalTimerRemaining % 60).padStart(2, "0");
  display.textContent = `${m}:${s}`;
}

window.initGlobalTimer = initGlobalTimer;
window.stopGlobalTimer = stopGlobalTimer;

document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuthStatus();
  if (user) {
    renderUserInfo(user);
    loadWallpaper();
    loadDarkMode();
    await loadWorkspaces();
    const saved = localStorage.getItem("mindful_workspace");
    if (saved) {
      selectWsSidebar(parseInt(saved));
    }
    initGlobalTimer();
    loadSidebarUnread();
  }
});

async function loadSidebarUnread() {
  try {
    const res = await authFetch(`${API_BASE}/messages/unread`);
    if (!res || !res.ok) return;
    const data = await res.json();
    const badge = document.getElementById("sidebarUnreadBadge");
    if (!badge) return;
    const count = data.count || 0;
    badge.textContent = count > 0 ? count : "";
    badge.style.display = count > 0 ? "flex" : "none";
  } catch (err) {
    console.error("Sidebar Unread Fehler:", err);
  }
}
