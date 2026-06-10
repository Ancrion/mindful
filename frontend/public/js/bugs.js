const API = "/api/bugs";

document.addEventListener("DOMContentLoaded", () => {
  loadBugs();
  document.getElementById("bugForm").addEventListener("submit", submitBug);
});

async function loadBugs() {
  const res = await authFetch(API);
  if (!res || !res.ok) return;
  const bugs = await res.json();
  renderBugs(bugs);
}

function renderBugs(bugs) {
  const grid = document.getElementById("bugGrid");
  if (bugs.length === 0) {
    grid.innerHTML = '<p class="loading" style="grid-column:1/-1">Noch keine Bugs gemeldet.</p>';
    return;
  }
  grid.innerHTML = bugs.map(b => `
    <div class="bug-card ${b.erledigt ? "done" : ""}">
      <div class="bug-card-head">
        <label class="bug-check-wrap">
          <input type="checkbox" ${b.erledigt ? "checked" : ""} onchange="toggleBug(${b.id}, this)" />
          <span class="bug-checkmark"></span>
        </label>
        <span class="bug-user"><i class="fa-regular fa-user"></i> ${escapeHtml(b.user_name)}</span>
      </div>
      <strong class="bug-title">${escapeHtml(b.titel)}</strong>
      ${b.beschreibung ? `<p class="bug-desc">${escapeHtml(b.beschreibung)}</p>` : ""}
      <div class="bug-meta">
        <span class="bug-date">${formatDate(b.created_at)}</span>
        <span class="bug-status ${b.erledigt ? "done" : "open"}">${b.erledigt ? "Erledigt" : "Offen"}</span>
      </div>
    </div>
  `).join("");
}

async function submitBug(e) {
  e.preventDefault();
  const titel = document.getElementById("bugTitle").value.trim();
  const beschreibung = document.getElementById("bugDesc").value.trim();
  if (!titel) return;

  const res = await authFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titel, beschreibung }),
  });
  if (!res || !res.ok) return showToast("Fehler beim Melden", "error");

  document.getElementById("bugForm").reset();
  showToast("Bug gemeldet!", "success");
  loadBugs();
}

async function toggleBug(id, el) {
  const res = await authFetch(`${API}/${id}/toggle`, { method: "PUT" });
  if (!res || !res.ok) {
    el.checked = !el.checked;
    return showToast("Fehler", "error");
  }
  loadBugs();
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
