const CL_API = "/api/changelog";
let clEntries = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadCl();
});

async function loadCl() {
  const res = await authFetch(CL_API);
  if (!res || !res.ok) return;
  clEntries = await res.json();
  renderCl();
}

function renderCl() {
  const t = document.getElementById("changelogTimeline");
  if (!clEntries.length) {
    t.innerHTML = '<p class="loading">Noch keine Einträge.</p>';
    return;
  }
  t.innerHTML = clEntries.map((e, i) => {
    const isFirst = i === 0;
    return `
    <div class="cl-entry ${isFirst ? "latest" : ""}">
      <div class="cl-entry-line">
        <div class="cl-dot"></div>
        ${!isFirst ? '<div class="cl-line"></div>' : ""}
      </div>
      <div class="cl-entry-card">
        <div class="cl-entry-head">
          <span class="cl-version-badge">v${escHtml(e.version)}</span>
          <span class="cl-date">${formatClDate(e.datum)}</span>
        </div>
        <h3 class="cl-entry-title">${escHtml(e.titel)}</h3>
        ${renderClList(e.features, "Neu", "cl-feature")}
        ${renderClList(e.fixes, "Behoben", "cl-fix")}
        ${e.commits && e.commits.length ? `<details class="cl-commits"><summary>Commits (${e.commits.length})</summary><code>${e.commits.map(c => escHtml(c)).join("</code><code>")}</code></details>` : ""}
      </div>
    </div>`;
  }).join("");
}

function renderClList(items, label, cls) {
  if (!items || !items.length) return "";
  return `<ul class="cl-list">
    <li class="cl-list-label ${cls}">${label}</li>
    ${items.map(i => `<li>${escHtml(i)}</li>`).join("")}
  </ul>`;
}

function escHtml(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatClDate(str) {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}
