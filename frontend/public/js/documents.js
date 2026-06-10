/* ==========================================================
   DOKUMENTE – New Design
   ========================================================== */

let allDocuments = [];
let activeCategory = "alle";
let selectedDocId = null;
let deleteTargetId = null;

/* ── Icon / Farb-Mapping ── */
const TYPE_MAP = [
  { exts: ["pdf"],                    icon: "fa-file-pdf",      cls: "type-pdf" },
  { exts: ["doc","docx","dot","dotx"],icon: "fa-file-word",     cls: "type-word" },
  { exts: ["xls","xlsx","xlsm","csv"], icon: "fa-file-excel",   cls: "type-excel" },
  { exts: ["jpg","jpeg","png","gif","webp","svg","bmp","ico"],  icon: "fa-file-image",  cls: "type-image" },
  { exts: ["mp4","avi","mov","mkv","webm","wmv","flv"],        icon: "fa-file-video",  cls: "type-video" },
  { exts: ["mp3","wav","ogg","flac","aac","m4a"],              icon: "fa-file-audio",  cls: "type-audio" },
  { exts: ["zip","rar","7z","tar","gz","bz2","xz"],            icon: "fa-file-archive",cls: "type-archive" },
  { exts: ["js","ts","py","java","c","cpp","cs","go","rs","rb","php","html","css","json","xml","yaml"], icon: "fa-file-code", cls: "type-code" },
  { exts: ["txt","log","md"],         icon: "fa-file-alt",     cls: "type-text" },
];

function getTypeInfo(filename) {
  if (!filename) return { icon: "fa-file", cls: "type-default" };
  const ext = filename.split(".").pop().toLowerCase();
  for (const t of TYPE_MAP) {
    if (t.exts.includes(ext)) return t;
  }
  return { icon: "fa-file", cls: "type-default" };
}

function formatSize(bytes) {
  if (!bytes || bytes === "0") return "";
  const b = parseInt(bytes, 10);
  if (isNaN(b)) return "";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("de-DE");
}

/* ── Kategorie-Farben ── */
function getCatDisplay(cat) {
  return cat || "Allgemein";
}

function getCatClass(cat) {
  if (!cat) return "cat-default";
  return "cat-" + cat;
}

/* ── Laden ── */
async function loadDocuments() {
  try {
    const res = await authFetch(`${API_BASE}/dokumente`);
    if (!res) return;
    allDocuments = await res.json();
    renderCategories();
    applyFilter();
  } catch (e) {
    console.error("Fehler beim Laden der Dokumente:", e);
  }
}

/* ── Kategorie-Chips ── */
function renderCategories() {
  const container = document.getElementById("categoryChips");
  if (!container) return;

  const cats = new Set();
  allDocuments.forEach((d) => { if (d.bereich) cats.add(d.bereich); });
  const sorted = ["Privat", "Arbeit", "Finanzen", "Wichtig"].filter(c => cats.has(c));
  const other = [...cats].filter(c => !["Privat","Arbeit","Finanzen","Wichtig"].includes(c));
  const allCats = ["alle", ...sorted, ...other];

  container.innerHTML = allCats
    .map((c) => {
      const count = c === "alle" ? allDocuments.length : allDocuments.filter((d) => (d.bereich || "") === c).length;
      const label = c === "alle" ? "Alle" : getCatDisplay(c);
      return `<button class="chip ${c === activeCategory ? "active" : ""}" data-cat="${c}">${label} <span class="count">${count}</span></button>`;
    })
    .join("");
  
  // Add event listeners instead of inline onclick
  container.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      setCategory(btn.dataset.cat);
    });
  });
}

/* ── Filter ── */
function setCategory(cat) {
  activeCategory = cat;
  renderCategories();
  applyFilter();
}

function applyFilter() {
  const query = (document.getElementById("searchInput")?.value || "").toLowerCase();

  let filtered = allDocuments;
  if (activeCategory !== "alle") {
    filtered = filtered.filter((d) => (d.bereich || "") === activeCategory);
  }
  if (query) {
    filtered = filtered.filter(
      (d) =>
        (d.titel || "").toLowerCase().includes(query) ||
        (d.dateiname || "").toLowerCase().includes(query),
    );
  }

  renderDocuments(filtered);
}

window.filterDocs = applyFilter;

/* ── Cards rendern ── */
function renderDocuments(docs) {
  const grid = document.getElementById("docGrid");
  const empty = document.getElementById("docEmpty");
  if (!grid) return;

  if (docs.length === 0) {
    grid.innerHTML = "";
    grid.style.display = "none";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";
  grid.style.display = "grid";

  grid.innerHTML = docs
    .map((doc) => {
      const type = getTypeInfo(doc.dateiname);
      const catClass = getCatClass(doc.bereich);
      const catDisplay = getCatDisplay(doc.bereich);
      const active = doc.id === selectedDocId ? "active" : "";
      return `
        <div class="doc-card ${active}" data-id="${doc.id}" onclick="selectDoc(${doc.id})">
          <div class="doc-card-icon ${type.cls}">
            <i class="fas ${type.icon}"></i>
          </div>
          <div class="doc-card-body">
            <h3>${escapeHtml(doc.titel)}</h3>
            <div class="doc-card-meta">
              <span class="doc-card-cat ${catClass}">${catDisplay}</span>
              <span class="doc-card-sep"></span>
              <span>${formatDate(doc.erstellt)}</span>
              <span class="doc-card-sep"></span>
              <span>${formatSize(doc.groesse)}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/* ── Dokument auswählen → Slide-Over ── */
function selectDoc(id) {
  const doc = allDocuments.find((d) => d.id === id);
  if (!doc) return;
  selectedDocId = id;
  deleteTargetId = id;

  document.querySelectorAll(".doc-card").forEach((el) => el.classList.remove("active"));
  const card = document.querySelector(`.doc-card[data-id="${id}"]`);
  if (card) card.classList.add("active");

  const type = getTypeInfo(doc.dateiname);

  document.getElementById("slideIcon").innerHTML = `<i class="fas ${type.icon}"></i>`;
  document.getElementById("slideIcon").className = "slide-over-icon " + type.cls;
  document.getElementById("slideTitle").textContent = doc.titel;
  document.getElementById("slideCat").textContent = getCatDisplay(doc.bereich);
  document.getElementById("slideCat").style.display = doc.bereich ? "inline-block" : "none";
  document.getElementById("slideDownloadBtn").href = `${API_BASE}/dokumente/download/${doc.id}`;

  const isImage = doc.ist_bild || (doc.dateiname && /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(doc.dateiname));

  let previewHtml = "";
  if (isImage) {
    previewHtml = `<img class="slide-preview-img" src="${API_BASE}/dokumente/download/${doc.id}" alt="${escapeHtml(doc.titel)}" />`;
  } else {
    previewHtml = `<div class="slide-over-icon ${type.cls}" style="width:64px;height:64px;font-size:28px;margin:0 auto 12px"><i class="fas ${type.icon}"></i></div>`;
  }

  document.getElementById("slideBody").innerHTML = `
    ${previewHtml}
    <div class="slide-meta-grid">
      <div class="slide-meta-item">
        <label>Dateiname</label>
        <span>${escapeHtml(doc.dateiname)}</span>
      </div>
      <div class="slide-meta-item">
        <label>Größe</label>
        <span>${formatSize(doc.groesse) || "—"}</span>
      </div>
      <div class="slide-meta-item">
        <label>Hochgeladen</label>
        <span>${formatDate(doc.erstellt) || "—"}</span>
      </div>
      <div class="slide-meta-item">
        <label>Kategorie</label>
        <span>${getCatDisplay(doc.bereich)}</span>
      </div>
    </div>
  `;

  document.getElementById("slideOver").classList.add("open");
  document.getElementById("slideOverOverlay").classList.add("open");
}

/* ── Slide-Over schließen ── */
window.closeSlideOver = function () {
  document.getElementById("slideOver").classList.remove("open");
  document.getElementById("slideOverOverlay").classList.remove("open");
  selectedDocId = null;
  document.querySelectorAll(".doc-card").forEach((el) => el.classList.remove("active"));
};

/* ── Upload ── */
window.toggleUpload = function () {
  const area = document.getElementById("uploadArea");
  area.classList.toggle("open");
  if (area.classList.contains("open")) {
    document.getElementById("fileInput").value = "";
    document.getElementById("docTitle").value = "";
  }
};

window.cancelUpload = function () {
  document.getElementById("uploadArea").classList.remove("open");
  document.getElementById("fileInput").value = "";
  document.getElementById("docTitle").value = "";
};

window.uploadDocument = async function () {
  const fileInput = document.getElementById("fileInput");
  const titel = document.getElementById("docTitle").value || fileInput.files[0]?.name || "Unbenannt";
  const kategorie = document.getElementById("docCategory").value;

  if (!fileInput.files[0]) {
    alert("Bitte wähle eine Datei aus.");
    return;
  }

  const formData = new FormData();
  formData.append("titel", titel);
  formData.append("kategorie", kategorie);
  formData.append("datei", fileInput.files[0]);

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/dokumente/upload`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (res.ok) {
      document.getElementById("uploadArea").classList.remove("open");
      document.getElementById("fileInput").value = "";
      document.getElementById("docTitle").value = "";
      loadDocuments();
    } else {
      const errData = await res.json();
      alert("Fehler: " + (errData.error || "Unbekannter Fehler"));
    }
  } catch (e) {
    console.error("Upload Fehler:", e);
    alert("Server-Fehler beim Hochladen.");
  }
};

/* ── Löschen ── */
window.confirmDelete = function () {
  const id = deleteTargetId;
  if (!id) return;
  if (!confirm("Dokument wirklich löschen?")) return;

  (async () => {
    try {
      const res = await authFetch(`${API_BASE}/dokumente/${id}`, {
        method: "DELETE",
      });
      if (res && res.ok) {
        closeSlideOver();
        loadDocuments();
      } else {
        alert("Fehler beim Löschen.");
      }
    } catch (e) {
      console.error("Löschen Fehler:", e);
    }
  })();
};

/* ── Drag & Drop ── */
document.addEventListener("DOMContentLoaded", () => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");

  if (dropzone && fileInput) {
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        document.getElementById("uploadFields").style.display = "flex";
      }
    });
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) {
        document.getElementById("uploadFields").style.display = "flex";
      }
    });
  }
});

/* ── Search on input ── */
document.addEventListener("DOMContentLoaded", () => {
  const inp = document.getElementById("searchInput");
  if (inp) {
    inp.addEventListener("input", applyFilter);
  }
});

/* ── Initialisierung ── */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuthStatus();
  if (!user) return;

  loadDocuments();

  if (user.name) {
    const el = document.getElementById("userName");
    if (el) el.textContent = user.name;
  }
});
