const CL_API = "/api/changelog";
let clEntries = [];
let clEditId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadCl();
  // Prüfen ob aktueller User jaro ist → Edit-Buttons zeigen
  const me = await authFetch("/api/auth/me");
  const isJaro = me && me.ok && (await me.json()).name === "jaro";
  if (isJaro) document.getElementById("clAddBtn").style.display = "inline-flex";
  document.getElementById("clAddBtn").onclick = () => openClModal();
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
          <div class="cl-admin-actions" id="clAdmin_${e.id}" style="display:none">
            <button class="cl-edit-btn" onclick="openClModal(${e.id})" title="Bearbeiten"><i class="fas fa-pen"></i></button>
            <button class="cl-del-btn" onclick="deleteClEntry(${e.id})" title="Löschen"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <h3 class="cl-entry-title">${escHtml(e.titel)}</h3>
        ${renderClList(e.features, "Neu", "cl-feature")}
        ${renderClList(e.fixes, "Behoben", "cl-fix")}
        ${e.commits && e.commits.length ? `<details class="cl-commits"><summary>Commits (${e.commits.length})</summary><code>${e.commits.map(c => escHtml(c)).join("</code><code>")}</code></details>` : ""}
      </div>
    </div>`;
  }).join("");

  // Admin-Actions einblenden falls jaro
  document.querySelectorAll(".cl-admin-actions").forEach(el => el.style.display = "");
}

function renderClList(items, label, cls) {
  if (!items || !items.length) return "";
  return `<ul class="cl-list">
    <li class="cl-list-label ${cls}">${label}</li>
    ${items.map(i => `<li>${escHtml(i)}</li>`).join("")}
  </ul>`;
}

/* ─── Modal ─── */

window.openClModal = function (id) {
  clEditId = id || null;
  document.getElementById("clModalTitle").textContent = id ? "Eintrag bearbeiten" : "Neuer Eintrag";
  document.getElementById("clForm").reset();

  if (id) {
    const e = clEntries.find(x => x.id === id);
    if (e) {
      document.getElementById("clVersion").value = e.version;
      document.getElementById("clDatum").value = e.datum;
      document.getElementById("clTitel").value = e.titel;
      document.getElementById("clFeatures").value = (e.features || []).map(f => "- " + f).join("\n");
      document.getElementById("clFixes").value = (e.fixes || []).map(f => "- " + f).join("\n");
      document.getElementById("clCommits").value = (e.commits || []).join(", ");
    }
  } else {
    document.getElementById("clDatum").value = new Date().toISOString().split("T")[0];
  }
  document.getElementById("clModal").classList.add("open");
};

window.closeClModal = function () {
  document.getElementById("clModal").classList.remove("open");
  clEditId = null;
};

window.saveClEntry = async function (e) {
  e.preventDefault();
  const version = document.getElementById("clVersion").value.trim();
  const datum = document.getElementById("clDatum").value;
  const titel = document.getElementById("clTitel").value.trim();
  if (!version || !datum || !titel) return;

  const parseList = val => val.split("\n").map(s => s.replace(/^-\s*/, "").trim()).filter(Boolean);
  const features = parseList(document.getElementById("clFeatures").value);
  const fixes = parseList(document.getElementById("clFixes").value);
  const commits = document.getElementById("clCommits").value.split(",").map(s => s.trim()).filter(Boolean);

  const body = { version, datum, titel, features, fixes, commits };

  let res;
  if (clEditId) {
    res = await authFetch(`${CL_API}/${clEditId}`, { method: "PUT", body: JSON.stringify(body) });
  } else {
    res = await authFetch(CL_API, { method: "POST", body: JSON.stringify(body) });
  }
  if (!res || !res.ok) return showToast("Fehler beim Speichern", "error");

  showToast(clEditId ? "Aktualisiert!" : "Erstellt!", "success");
  closeClModal();
  await loadCl();
};

window.deleteClEntry = async function (id) {
  if (!confirm("Eintrag wirklich löschen?")) return;
  const res = await authFetch(`${CL_API}/${id}`, { method: "DELETE" });
  if (!res || !res.ok) return showToast("Fehler beim Löschen", "error");
  showToast("Gelöscht", "success");
  await loadCl();
};

/* ─── Hilfsfunktionen ─── */

function escHtml(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatClDate(str) {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}
