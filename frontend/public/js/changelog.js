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
         ${renderCommitsList(e.commits)}
         <div class="cl-entry-actions">
           <a href="https://github.com/Ancrion/mindful/commits" target="_blank" class="btn btn-secondary btn-sm">
             <i class="fas fa-code-branch"></i> Commits auf GitHub
           </a>
         </div>
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

function renderCommitsList(commits) {
  if (!commits || !commits.length) return "";
  const baseUrl = "https://github.com/Ancrion/mindful/commit";
  return `
    <details class="cl-commits">
      <summary class="cl-commits-summary">
        <i class="fas fa-code-branch"></i>
        Commits (${commits.length})
      </summary>
      <div class="cl-commits-list">
        ${commits.map(c => `
          <a href="${baseUrl}/${escHtml(c)}" target="_blank" class="cl-commit-link" title="Commit auf GitHub anzeigen">
            <code>${escHtml(c.substring(0, 7))}</code>
            <i class="fas fa-external-link-alt"></i>
          </a>
        `).join("")}
      </div>
    </details>
  `;
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
