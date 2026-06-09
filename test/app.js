// ===== DATEN =====
let data = {
  notizen: [],
  aufgaben: [],
  termine: [],
  dokumente: [],
};

// ===== NAVIGATION =====
function showPage(page) {
  // Alle Pages verstecken
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  // Gewünschte Page anzeigen
  document.getElementById("page-" + page).classList.add("active");

  // Nav Item aktivieren
  const navItems = document.querySelectorAll(".nav-item a");
  navItems.forEach((item) => {
    if (
      item.getAttribute("onclick") &&
      item.getAttribute("onclick").includes(page)
    ) {
      item.parentElement.classList.add("active");
    }
  });

  // Listen neu rendern
  if (page === "notizen") renderNotizen();
  if (page === "aufgaben") renderAufgaben();
  if (page === "kalender") renderTermine();
  if (page === "dokumente") renderDokumente();

  return false;
}

// ===== MODAL =====
function openModal(type) {
  document.getElementById("modal-overlay").classList.add("active");
  document
    .querySelectorAll(".modal")
    .forEach((m) => m.classList.remove("active"));
  document.getElementById("modal-" + type).classList.add("active");

  // Felder leeren
  document.querySelectorAll(".modal-input, .modal-textarea").forEach((el) => {
    if (el.type !== "file" && el.tagName !== "SELECT") el.value = "";
  });
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("active");
  document
    .querySelectorAll(".modal")
    .forEach((m) => m.classList.remove("active"));
}

// ===== STATS UPDATEN =====
function updateStats() {
  document.getElementById("stat-notizen").textContent = data.notizen.length;
  document.getElementById("stat-offen").textContent = data.aufgaben.filter(
    (a) => !a.done,
  ).length;
  document.getElementById("stat-erledigt").textContent = data.aufgaben.filter(
    (a) => a.done,
  ).length;
  document.getElementById("stat-termine").textContent = data.termine.length;
  document.getElementById("stat-dokumente").textContent = data.dokumente.length;
  updateOverview();
}

// ===== OVERVIEW =====
function updateOverview() {
  // Notizen Overview
  const notizContainer = document.getElementById("overview-notizen");
  if (data.notizen.length === 0) {
    notizContainer.innerHTML = '<p class="empty-text">Keine Ergebnisse</p>';
  } else {
    notizContainer.innerHTML = data.notizen
      .slice(0, 3)
      .map(
        (n) =>
          `<div class="item-entry"><div><div class="item-title">${n.titel}</div></div></div>`,
      )
      .join("");
  }

  // Aufgaben Overview
  const aufgabeContainer = document.getElementById("overview-aufgaben");
  const offeneAufgaben = data.aufgaben.filter((a) => !a.done);
  if (offeneAufgaben.length === 0) {
    aufgabeContainer.innerHTML = '<p class="empty-text">Keine Ergebnisse</p>';
  } else {
    aufgabeContainer.innerHTML = offeneAufgaben
      .slice(0, 3)
      .map(
        (a) =>
          `<div class="item-entry"><div><div class="item-title">${a.titel}</div><div class="item-meta prio-${a.prio}">${a.prio.toUpperCase()}</div></div></div>`,
      )
      .join("");
  }

  // Kalender Overview
  const kalenderContainer = document.getElementById("overview-kalender");
  if (data.termine.length === 0) {
    kalenderContainer.innerHTML = '<p class="empty-text">Keine Ergebnisse</p>';
  } else {
    kalenderContainer.innerHTML = data.termine
      .slice(0, 3)
      .map(
        (t) =>
          `<div class="item-entry"><div><div class="item-title">${t.titel}</div><div class="item-meta">${formatDatum(t.datum)}</div></div></div>`,
      )
      .join("");
  }
}

// ===== NOTIZ =====
function saveNotiz() {
  const titel = document.getElementById("notiz-titel").value.trim();
  const inhalt = document.getElementById("notiz-inhalt").value.trim();
  if (!titel) {
    alert("Bitte einen Titel eingeben.");
    return;
  }

  data.notizen.push({ id: Date.now(), titel, inhalt });
  updateStats();
  closeModal();
  renderNotizen();
}

function renderNotizen() {
  const container = document.getElementById("notizen-liste");
  if (!container) return;

  if (data.notizen.length === 0) {
    container.innerHTML = '<p class="empty-text">Keine Notizen vorhanden.</p>';
    return;
  }

  container.innerHTML = data.notizen
    .map(
      (n) => `
        <div class="item-entry" id="notiz-${n.id}">
            <div>
                <div class="item-title">${n.titel}</div>
                <div class="item-meta">${n.inhalt || "Kein Inhalt"}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn delete" onclick="deleteNotiz(${n.id})">LÖSCHEN</button>
            </div>
        </div>
    `,
    )
    .join("");
}

function deleteNotiz(id) {
  data.notizen = data.notizen.filter((n) => n.id !== id);
  updateStats();
  renderNotizen();
}

// ===== AUFGABE =====
function saveAufgabe() {
  const titel = document.getElementById("aufgabe-titel").value.trim();
  const prio = document.getElementById("aufgabe-prio").value;
  if (!titel) {
    alert("Bitte eine Aufgabe eingeben.");
    return;
  }

  data.aufgaben.push({ id: Date.now(), titel, prio, done: false });
  updateStats();
  closeModal();
  renderAufgaben();
}

function renderAufgaben() {
  const container = document.getElementById("aufgaben-liste");
  if (!container) return;

  if (data.aufgaben.length === 0) {
    container.innerHTML = '<p class="empty-text">Keine Aufgaben vorhanden.</p>';
    return;
  }

  container.innerHTML = data.aufgaben
    .map(
      (a) => `
        <div class="item-entry ${a.done ? "aufgabe-done" : ""}" id="aufgabe-${a.id}">
            <div>
                <div class="item-title">${a.titel}</div>
                <div class="item-meta prio-${a.prio}">PRIORITÄT: ${a.prio.toUpperCase()}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn" onclick="toggleAufgabe(${a.id})">${a.done ? "OFFEN" : "ERLEDIGT"}</button>
                <button class="item-btn delete" onclick="deleteAufgabe(${a.id})">LÖSCHEN</button>
            </div>
        </div>
    `,
    )
    .join("");
}

function toggleAufgabe(id) {
  const a = data.aufgaben.find((a) => a.id === id);
  if (a) a.done = !a.done;
  updateStats();
  renderAufgaben();
}

function deleteAufgabe(id) {
  data.aufgaben = data.aufgaben.filter((a) => a.id !== id);
  updateStats();
  renderAufgaben();
}

// ===== TERMIN =====
function saveTermin() {
  const titel = document.getElementById("termin-titel").value.trim();
  const datum = document.getElementById("termin-datum").value;
  if (!titel) {
    alert("Bitte einen Titel eingeben.");
    return;
  }
  if (!datum) {
    alert("Bitte ein Datum wählen.");
    return;
  }

  data.termine.push({ id: Date.now(), titel, datum });
  data.termine.sort((a, b) => new Date(a.datum) - new Date(b.datum));
  updateStats();
  closeModal();
  renderTermine();
}

function renderTermine() {
  const container = document.getElementById("kalender-liste");
  if (!container) return;

  if (data.termine.length === 0) {
    container.innerHTML = '<p class="empty-text">Keine Termine vorhanden.</p>';
    return;
  }

  container.innerHTML = data.termine
    .map(
      (t) => `
        <div class="item-entry" id="termin-${t.id}">
            <div>
                <div class="item-title">${t.titel}</div>
                <div class="item-meta">${formatDatum(t.datum)}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn delete" onclick="deleteTermin(${t.id})">LÖSCHEN</button>
            </div>
        </div>
    `,
    )
    .join("");
}

function deleteTermin(id) {
  data.termine = data.termine.filter((t) => t.id !== id);
  updateStats();
  renderTermine();
}

// ===== DOKUMENT =====
function saveDokument() {
  const name = document.getElementById("dokument-name").value.trim();
  const datei = document.getElementById("dokument-datei").files[0];
  if (!name) {
    alert("Bitte einen Namen eingeben.");
    return;
  }

  data.dokumente.push({
    id: Date.now(),
    name,
    dateiname: datei ? datei.name : "Keine Datei",
    groesse: datei ? formatGroesse(datei.size) : "-",
  });
  updateStats();
  closeModal();
  renderDokumente();
}

function renderDokumente() {
  const container = document.getElementById("dokumente-liste");
  if (!container) return;

  if (data.dokumente.length === 0) {
    container.innerHTML =
      '<p class="empty-text">Keine Dokumente vorhanden.</p>';
    return;
  }

  container.innerHTML = data.dokumente
    .map(
      (d) => `
        <div class="item-entry" id="dok-${d.id}">
            <div>
                <div class="item-title">${d.name}</div>
                <div class="item-meta">${d.dateiname} · ${d.groesse}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn delete" onclick="deleteDokument(${d.id})">LÖSCHEN</button>
            </div>
        </div>
    `,
    )
    .join("");
}

function deleteDokument(id) {
  data.dokumente = data.dokumente.filter((d) => d.id !== id);
  updateStats();
  renderDokumente();
}

// ===== INTELLIGENTE SUCHE =====
function intelligenteSuche() {
  const query = document
    .getElementById("suche-query")
    .value.toLowerCase()
    .trim();
  const container = document.getElementById("suche-ergebnisse");

  if (!query) {
    container.innerHTML = "";
    return;
  }

  const ergebnisse = [];

  data.notizen.forEach((n) => {
    if (
      n.titel.toLowerCase().includes(query) ||
      n.inhalt.toLowerCase().includes(query)
    ) {
      ergebnisse.push({ typ: "NOTIZ", titel: n.titel, detail: n.inhalt });
    }
  });

  data.aufgaben.forEach((a) => {
    if (a.titel.toLowerCase().includes(query)) {
      ergebnisse.push({
        typ: "AUFGABE",
        titel: a.titel,
        detail: `Priorität: ${a.prio}`,
      });
    }
  });

  data.termine.forEach((t) => {
    if (t.titel.toLowerCase().includes(query)) {
      ergebnisse.push({
        typ: "TERMIN",
        titel: t.titel,
        detail: formatDatum(t.datum),
      });
    }
  });

  data.dokumente.forEach((d) => {
    if (d.name.toLowerCase().includes(query)) {
      ergebnisse.push({ typ: "DOKUMENT", titel: d.name, detail: d.dateiname });
    }
  });

  if (ergebnisse.length === 0) {
    container.innerHTML =
      '<p class="empty-text">Keine Ergebnisse gefunden.</p>';
    return;
  }

  container.innerHTML = ergebnisse
    .map(
      (e) => `
        <div class="suche-result-item">
            <div class="suche-result-type">${e.typ}</div>
            <div class="suche-result-title">${e.titel}</div>
            <div class="item-meta">${e.detail}</div>
        </div>
    `,
    )
    .join("");
}

// ===== SPRACHE =====
document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".lang-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ===== HILFSFUNKTIONEN =====
function formatDatum(datum) {
  if (!datum) return "";
  const d = new Date(datum);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatGroesse(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// ===== INIT =====
updateStats();
