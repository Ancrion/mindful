let currentNoteId = null;
let saveTimeout = null;
let isDirty = false;
let allFolders = [];
let allNotes = [];
let allDocuments = [];
let selectedFileId = null;
let uploadFileFolderId = null;
let ctxTarget = null;
let ctxType = null;
let dragNoteId = null;
let dragFileId = null;

/* ── File type icons ── */
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

async function init() {
  const user = await checkAuthStatus();
  if (!user) return;

  showEditor(false);
  await loadData();

  const hash = window.location.hash.replace("#", "");
  if (hash) {
    const id = parseInt(hash);
    if (id && window.openNoteById) {
      setTimeout(() => window.openNoteById(id), 50);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFileModal();
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveNote();
    }
  });

  document.addEventListener("click", closeCtxMenu);
  document.addEventListener("contextmenu", (e) => {
    if (!e.target.closest(".folder-row, .tree-note, .tree-file")) closeCtxMenu();
  });

  document.getElementById("fileUploadInput").addEventListener("change", async () => {
    const input = document.getElementById("fileUploadInput");
    if (input.files.length && uploadFileFolderId) {
      await uploadFilesToFolder(uploadFileFolderId, input.files);
      input.value = "";
      uploadFileFolderId = null;
    }
  });

  document.getElementById("folderImportInput").addEventListener("change", async () => {
    const input = document.getElementById("folderImportInput");
    if (!input.files.length) return;
    const folderName = input.files[0].webkitRelativePath.split("/")[0] || "Import";
    const res = await authFetch(`${API_BASE}/ordner`, {
      method: "POST",
      body: JSON.stringify({ name: folderName, farbe: "color-sage" }),
     });
     if (!res || !res.ok) return;
     const data = await safeJson(res);
     if (!data || !data.id) return;
     await uploadFilesToFolder(data.id, input.files);
    input.value = "";
  });

  window.addEventListener("workspacechange", () => {
    loadData();
  });

  // ─── File Drop Zone ───
  let _dropFolderId = null;
  const dropzone = document.getElementById("notesDropzone");
  const dropzoneName = document.getElementById("dropzoneFolderName");

  document.addEventListener("dragenter", (e) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      const folderRow = e.target.closest(".folder-row");
      if (folderRow) {
        _dropFolderId = parseInt(folderRow.dataset.folderId, 10);
        const folder = allFolders.find(f => f.id === _dropFolderId);
        if (dropzoneName) dropzoneName.textContent = folder ? `"${folder.name}"` : "den Ordner";
      } else {
        _dropFolderId = null;
        if (dropzoneName) dropzoneName.textContent = "den Ordner";
      }
      dropzone.classList.add("dragover");
    }
  });

  document.addEventListener("dragover", (e) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
    }
  });

  document.addEventListener("dragleave", (e) => {
    if (!e.relatedTarget || !dropzone.contains(e.relatedTarget)) {
      dropzone.classList.remove("dragover");
    }
  });

  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (!e.dataTransfer.files || !e.dataTransfer.files.length) return;

    const folderId = _dropFolderId || (allFolders.length > 0 ? allFolders[0].id : null);
    if (folderId) {
      await uploadFilesToFolder(folderId, e.dataTransfer.files);
      showToast("Dateien hochgeladen", "success");
    } else {
      showToast("Bitte erstelle zuerst einen Ordner", "error");
    }
    _dropFolderId = null;
  });
}

async function loadData() {
  const [foldersRes, notesRes, docsRes] = await Promise.all([
    authFetch(`${API_BASE}/ordner`),
    authFetch(`${API_BASE}/notizen`),
    authFetch(`${API_BASE}/dokumente`),
  ]);

  if (foldersRes) allFolders = await safeJson(foldersRes) || [];
  if (notesRes) allNotes = await safeJson(notesRes) || [];
  if (docsRes) allDocuments = await safeJson(docsRes) || [];

  renderTree();
}

function filteredNotes() {
  if (!window.currentWorkspaceId) return allNotes;
  return allNotes.filter(n => n.workspace_id == window.currentWorkspaceId);
}

function renderTree() {
  const tree = document.getElementById("folderTree");
  if (!tree) return;
  tree.innerHTML = "";

  const notesToShow = (window.currentWorkspaceId
    ? allNotes.filter(n => n.workspace_id == window.currentWorkspaceId)
    : allNotes);

  const grouped = {};
  allFolders.forEach((f) => {
    grouped[f.id] = { ...f, notes: [], files: [] };
  });

  const ungroupedNotes = [];
  const ungroupedFiles = [];

  notesToShow.forEach((n) => {
    if (n.ordner_id && grouped[n.ordner_id]) {
      grouped[n.ordner_id].notes.push(n);
    } else {
      ungroupedNotes.push(n);
    }
  });

  allDocuments.forEach((d) => {
    if (d.ordner_id && grouped[d.ordner_id]) {
      grouped[d.ordner_id].files.push(d);
    } else {
      ungroupedFiles.push(d);
    }
  });

  allFolders.forEach((f) => {
    const g = grouped[f.id];
    g.notes.sort((a, b) => new Date(b.aktualisiert || b.erstellt) - new Date(a.aktualisiert || a.erstellt));
    g.files.sort((a, b) => new Date(b.erstellt) - new Date(a.erstellt));
  });
  ungroupedNotes.sort((a, b) => new Date(b.aktualisiert || b.erstellt) - new Date(a.aktualisiert || a.erstellt));
  ungroupedFiles.sort((a, b) => new Date(b.erstellt) - new Date(a.erstellt));

  allFolders.forEach((f) => {
    const g = grouped[f.id];
    const expanded = localStorage.getItem("folder-expanded-" + f.id) !== "false";

    const folderEl = document.createElement("div");
    folderEl.className = "tree-node";

    const header = document.createElement("div");
    header.className = "folder-row";
    header.dataset.folderId = f.id;
    header.innerHTML = `
      <span class="toggle-icon ${expanded ? "expanded" : ""}"><i class="fas fa-chevron-right"></i></span>
      <span class="folder-color-dot ${f.farbe || "color-sand"}"></span>
      <span class="folder-label">${esc(f.name)}</span>
      <button class="folder-upload-btn" title="Datei hochladen"><i class="fas fa-upload"></i></button>
    `;
    header.querySelector(".folder-upload-btn").onclick = (e) => {
      e.stopPropagation();
      uploadToFolder(f.id);
    };
    header.onclick = (e) => {
      e.stopPropagation();
      toggleFolder(f.id);
    };
    header.oncontextmenu = (e) => showCtxMenu(e, "folder", f.id, f.name);
    folderEl.appendChild(header);

    const children = document.createElement("div");
    children.className = "folder-children" + (expanded ? " open" : "");
    setupFolderDropZone(folderEl);

    g.notes.forEach((n) => {
      children.appendChild(createNoteEl(n));
    });
    g.files.forEach((d) => {
      children.appendChild(createFileEl(d));
    });

    folderEl.appendChild(children);
    tree.appendChild(folderEl);
  });

  ungroupedNotes.forEach((n) => {
    tree.appendChild(createNoteEl(n));
  });
  ungroupedFiles.forEach((d) => {
    tree.appendChild(createFileEl(d));
  });

  setupTreeDropZone(tree);

  if (allFolders.length === 0 && ungroupedNotes.length === 0 && ungroupedFiles.length === 0) {
    tree.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;padding:16px 8px;text-align:center">Keine Notizen oder Dateien</p>';
  }
}

function setupTreeDropZone(tree) {
  tree.addEventListener("dragover", (e) => {
    if (!e.target.closest(".tree-node")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      tree.classList.add("drag-over");
    }
  });
  tree.addEventListener("dragleave", () => {
    tree.classList.remove("drag-over");
  });
  tree.addEventListener("drop", (e) => {
    if (e.target.closest(".tree-node")) return;
    tree.classList.remove("drag-over");
    if (dragNoteId) {
      e.preventDefault();
      moveNoteToFolder(dragNoteId, null);
    }
    if (dragFileId) {
      e.preventDefault();
      moveFileToFolder(dragFileId, null);
    }
  });
}

function createNoteEl(n) {
  const el = document.createElement("div");
  el.className = "tree-note" + (currentNoteId === n.id ? " active" : "");
  el.dataset.noteId = n.id;
  el.draggable = true;

  const wsColor = n.workspace_farbe ? (WORKSPACE_COLORS[n.workspace_farbe] || null) : null;
  el.innerHTML = `
    <span class="tree-note-icon"><i class="far fa-file-alt"></i></span>
    ${wsColor ? `<span class="tree-note-ws-dot" style="background:${wsColor}"></span>` : ""}
    <span class="tree-note-title">${esc(n.titel || "Unbenannt")}</span>
  `;
  el.oncontextmenu = (e) => showCtxMenu(e, "note", n.id, n.titel || "Unbenannt");

  el.addEventListener("dragstart", (e) => {
    dragNoteId = n.id;
    el.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(n.id));
  });
  el.addEventListener("click", (e) => {
    openNoteById(n.id);
  });
  el.addEventListener("dragend", () => {
    dragNoteId = null;
    document.querySelectorAll(".drag-over").forEach((r) => r.classList.remove("drag-over"));
  });

  return el;
}

function createFileEl(doc) {
  const type = getTypeInfo(doc.dateiname);
  const el = document.createElement("div");
  el.className = "tree-file" + (selectedFileId === doc.id ? " active" : "");
  el.dataset.fileId = doc.id;
  el.draggable = true;

  el.innerHTML = `
    <span class="tree-file-icon ${type.cls}"><i class="fas ${type.icon}"></i></span>
    <span class="tree-file-title">${esc(doc.titel)}</span>
  `;
  el.oncontextmenu = (e) => showCtxMenu(e, "file", doc.id, doc.titel);

  el.addEventListener("dragstart", (e) => {
    dragFileId = doc.id;
    el.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "file:" + doc.id);
  });

  el.addEventListener("click", () => openFile(doc));

  el.addEventListener("dragend", () => {
    dragFileId = null;
    document.querySelectorAll(".drag-over").forEach((r) => r.classList.remove("drag-over"));
  });

  return el;
}

function setupFolderDropZone(el) {
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    el.classList.add("drag-over");
  });
  el.addEventListener("dragleave", () => {
    el.classList.remove("drag-over");
  });
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("drag-over");

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const folderId = parseInt(el.querySelector(".folder-row")?.dataset?.folderId, 10);
      if (folderId) {
        uploadFilesToFolder(folderId, e.dataTransfer.files);
      }
      return;
    }

    const folderId = parseInt(el.querySelector(".folder-row")?.dataset?.folderId, 10);

    if (dragFileId && folderId) {
      const doc = allDocuments.find(d => d.id === dragFileId);
      if (doc && doc.ordner_id == folderId) return;
      moveFileToFolder(dragFileId, folderId);
      return;
    }

    if (dragNoteId && folderId) {
      moveNoteToFolder(dragNoteId, folderId);
    }
  });
}

async function moveFileToFolder(fileId, folderId) {
  const body = { ordner_id: folderId || null };
  const res = await authFetch(`${API_BASE}/dokumente/${fileId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (res && res.ok) {
    if (folderId) localStorage.setItem("folder-expanded-" + folderId, "true");
    await loadData();
    showToast("Datei verschoben", "success");
  }
}

async function moveNoteToFolder(noteId, folderId) {
  const body = folderId ? { ordnerId: folderId } : { ordnerId: null };
  const res = await authFetch(`${API_BASE}/notizen/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (res && res.ok) {
    if (folderId) localStorage.setItem("folder-expanded-" + folderId, "true");
    await loadData();
    showToast("Notiz verschoben", "success");
  }
}

function toggleFolder(id) {
  const key = "folder-expanded-" + id;
  const current = localStorage.getItem(key) !== "false";
  localStorage.setItem(key, current ? "false" : "true");
  renderTree();
}

function updateTreeActive() {
  document.querySelectorAll(".tree-note").forEach((el) => {
    el.classList.toggle("active", String(el.dataset.noteId) === String(currentNoteId));
  });
}

window.openNoteById = function (id) {
  const note = allNotes.find((n) => n.id === id);
  if (note) openNote(note);
};

let previewActive = false;

function showEditor(show) {
  document.getElementById("editorEmpty").style.display = show ? "none" : "";
  document.getElementById("noteContent").style.display = show && !previewActive ? "" : "none";
  document.getElementById("notePreview").style.display = show && previewActive ? "" : "none";
  document.getElementById("noteTitle").disabled = !show;
  document.querySelector(".editor-main-card").classList.toggle("editor-disabled", !show);
  if (!show) {
    previewActive = false;
    document.getElementById("previewToggle").classList.remove("active");
  }
}

function openNote(note) {
  currentNoteId = note.id;
  isDirty = false;

  showEditor(true);
  document.getElementById("noteTitle").value = note.titel || "";
  document.getElementById("noteContent").innerHTML = note.inhalt || "";
  if (previewActive) {
    document.getElementById("notePreview").innerHTML = renderPreviewWithMath(note.inhalt) || "<p style='color:var(--text-secondary)'>Leere Notiz</p>";
  }

  const folderName = note.ordner_id
    ? (allFolders.find((f) => f.id === note.ordner_id)?.name || "")
    : "Kein Ordner";
  document.getElementById("currentFolderName").textContent = folderName;

  setSaveStatus("saved", "Gespeichert");
  updateTreeActive();
}

window.createNewNote = async function (folderId) {
  const body = { titel: "Neue Notiz", inhalt: "", ordnerId: folderId || null };
  if (window.currentWorkspaceId) body.workspace_id = window.currentWorkspaceId;
  const res = await authFetch(`${API_BASE}/notizen`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res && res.ok) {
    const newNote = await safeJson(res);
    if (newNote && newNote.id) {
      if (folderId) localStorage.setItem("folder-expanded-" + folderId, "true");
      await loadData();
      openNote(newNote);
    }
  }
};

window.deleteNote = async function (noteId) {
  if (!noteId && !currentNoteId) return;
  const id = noteId || currentNoteId;
  if (!confirm("Notiz wirklich löschen?")) return;

  const res = await authFetch(`${API_BASE}/notizen/${id}`, {
    method: "DELETE",
  });

  if (res && res.ok) {
    if (id === currentNoteId) {
      currentNoteId = null;
      document.getElementById("noteTitle").value = "";
      document.getElementById("noteContent").innerHTML = "";
      document.getElementById("currentFolderName").innerHTML = "&nbsp;";
      showEditor(false);
      setSaveStatus("idle", "Bereit");
    }
    await loadData();
  }
};

window.renameNote = async function (noteId, currentName) {
  const name = prompt("Neuer Name:", currentName || "");
  if (!name || name === currentName) return;

  const res = await authFetch(`${API_BASE}/notizen/${noteId}`, {
    method: "PUT",
    body: JSON.stringify({ titel: name }),
  });

  if (res && res.ok) {
    if (noteId === currentNoteId) {
      document.getElementById("noteTitle").value = name;
    }
    const updated = await safeJson(res);
    if (updated && updated.id) {
      const idx = allNotes.findIndex((n) => n.id === noteId);
      if (idx !== -1) allNotes[idx] = updated;
      renderTree();
    }
  }
};

window.renameFolder = async function (folderId, currentName) {
  const name = prompt("Neuer Ordnername:", currentName || "");
  if (!name || name === currentName) return;

  const res = await authFetch(`${API_BASE}/ordner/${folderId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });

  if (res && res.ok) {
    await loadData();
  }
};

window.deleteFolder = async function (folderId) {
  if (!confirm("Ordner und alle enthaltenen Notizen wirklich löschen?")) return;

  const res = await authFetch(`${API_BASE}/ordner/${folderId}`, {
    method: "DELETE",
  });

  if (res && res.ok) {
    await loadData();
  }
};

window.togglePreview = function () {
  if (!currentNoteId) return;
  previewActive = !previewActive;
  const preview = document.getElementById("notePreview");
  const editor = document.getElementById("noteContent");
  const btn = document.getElementById("previewToggle");
  btn.classList.toggle("active", previewActive);
  if (previewActive) {
    const html = editor.innerHTML || "<p style='color:var(--text-secondary)'>Leere Notiz</p>";
    preview.innerHTML = renderPreviewWithMath(html);
    editor.style.display = "none";
    preview.style.display = "";
  } else {
    editor.style.display = "";
    preview.style.display = "none";
  }
};

window.saveNote = async function () {
  if (!currentNoteId) return;

  const titel = document.getElementById("noteTitle").value;
  const inhalt = document.getElementById("noteContent").innerHTML;

  setSaveStatus("saving", "Speichern\u2026");

  const res = await authFetch(`${API_BASE}/notizen/${currentNoteId}`, {
    method: "PUT",
    body: JSON.stringify({ titel, inhalt }),
  });

  if (res && res.ok) {
    isDirty = false;
    setSaveStatus("saved", "Gespeichert");
    const updated = await res.json();
    const idx = allNotes.findIndex((n) => n.id === currentNoteId);
    if (idx !== -1) allNotes[idx] = updated;
    renderTree();
    if (previewActive) {
      document.getElementById("notePreview").innerHTML = renderPreviewWithMath(inhalt) || "<p style='color:var(--text-secondary)'>Leere Notiz</p>";
    }
  } else {
    setSaveStatus("error", "Fehler");
    const err = res ? await res.json().catch(() => ({})) : {};
    showToast(err.error || "Fehler beim Speichern", "error");
  }
};

window.onTitleChange = function () { markDirty(); };
window.onContentChange = function () { markDirty(); };

function markDirty() {
  if (!currentNoteId) return;
  if (!isDirty) {
    isDirty = true;
    setSaveStatus("idle", "Ungespeichert");
  }
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveNote(), 1500);
}

function setSaveStatus(state, text) {
  const el = document.getElementById("saveStatus");
  const textEl = document.getElementById("saveStatusText");
  if (!el || !textEl) return;

  el.className = "save-status" + (state !== "idle" ? " " + state : "");
  textEl.textContent = text;

  const icon = el.querySelector("i");
  if (icon) {
    if (state === "saving") {
      icon.className = "fas fa-spinner fa-spin";
      icon.style.fontSize = "13px";
    } else if (state === "saved") {
      icon.className = "fas fa-check-circle";
      icon.style.fontSize = "13px";
    } else if (state === "error") {
      icon.className = "fas fa-exclamation-circle";
      icon.style.fontSize = "13px";
    } else {
      icon.className = "fas fa-circle";
      icon.style.fontSize = "6px";
      icon.style.color = "var(--text-secondary)";
    }
  }
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/* ====== DATEI-FUNKTIONEN ====== */

async function uploadFilesToFolder(folderId, files) {
  for (const file of files) {
    const formData = new FormData();
    formData.append("titel", file.name);
    formData.append("ordner_id", folderId);
    formData.append("kategorie", "");
    formData.append("datei", file);

    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE}/dokumente/upload`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
    } catch (e) {
      console.error("Upload Fehler:", e);
    }
  }
  localStorage.setItem("folder-expanded-" + folderId, "true");
  await loadData();
}

window.uploadToFolder = function (folderId) {
  uploadFileFolderId = folderId;
  document.getElementById("fileUploadInput").click();
};

window.importFolder = function () {
  document.getElementById("folderImportInput").click();
};

function openFile(doc) {
  if (!doc) return;
  selectedFileId = doc.id;

  document.querySelectorAll(".tree-file").forEach(el => el.classList.remove("active"));
  const el = document.querySelector(`.tree-file[data-file-id="${doc.id}"]`);
  if (el) el.classList.add("active");

  const type = getTypeInfo(doc.dateiname);
  const isImage = doc.ist_bild || (doc.dateiname && /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(doc.dateiname));

  document.getElementById("fileModalIcon").className = "file-modal-icon " + type.cls;
  document.getElementById("fileModalIcon").innerHTML = `<i class="fas ${type.icon}"></i>`;
  document.getElementById("fileModalTitle").textContent = doc.titel;
  document.getElementById("fileModalMeta").textContent = formatSize(doc.groesse) ? (formatSize(doc.groesse) + " \u00B7 " + formatDate(doc.erstellt)) : formatDate(doc.erstellt);

  let previewHtml = "";
  if (isImage) {
    previewHtml = `<img src="${API_BASE}/dokumente/download/${doc.id}" alt="${esc(doc.titel)}" />`;
  } else {
    previewHtml = `<div class="preview-icon-large ${type.cls}"><i class="fas ${type.icon}"></i></div>`;
  }
  document.getElementById("fileModalPreview").innerHTML = previewHtml;

  const infoHtml = `
    <div class="file-modal-info-item"><label>Dateiname</label><span>${esc(doc.dateiname || "")}</span></div>
    <div class="file-modal-info-item"><label>Gr\u00F6\u00DFe</label><span>${formatSize(doc.groesse) || "\u2014"}</span></div>
    <div class="file-modal-info-item"><label>Hochgeladen</label><span>${formatDate(doc.erstellt) || "\u2014"}</span></div>
    <div class="file-modal-info-item"><label>Kategorie</label><span>${doc.bereich || "Allgemein"}</span></div>
  `;
  document.getElementById("fileModalInfo").innerHTML = infoHtml;

  document.getElementById("fileDownloadBtn").href = `${API_BASE}/dokumente/download/${doc.id}`;

  document.getElementById("fileModalOverlay").classList.add("open");
  document.getElementById("fileModal").classList.add("open");
}

window.closeFileModal = function () {
  document.getElementById("fileModalOverlay").classList.remove("open");
  document.getElementById("fileModal").classList.remove("open");
  selectedFileId = null;
  document.querySelectorAll(".tree-file").forEach(el => el.classList.remove("active"));
};

window.renameFile = async function (id, currentName) {
  const fileId = id || selectedFileId;
  if (!fileId) return;
  const doc = allDocuments.find(d => d.id === fileId);
  const name = prompt("Neuer Name:", (currentName || doc?.titel || ""));
  if (!name || name === (currentName || doc?.titel)) return;

  const res = await authFetch(`${API_BASE}/dokumente/${fileId}`, {
    method: "PUT",
    body: JSON.stringify({ titel: name }),
  });
  if (res && res.ok) {
    closeFileModal();
    await loadData();
  }
};

window.deleteFile = async function (id) {
  const fileId = id || selectedFileId;
  if (!fileId) return;
  if (!confirm("Datei wirklich löschen?")) return;

  const res = await authFetch(`${API_BASE}/dokumente/${fileId}`, {
    method: "DELETE",
  });
  if (res && res.ok) {
    closeFileModal();
    await loadData();
  }
};

window.downloadFile = function (id) {
  const fileId = id || selectedFileId;
  if (!fileId) return;
  window.open(`${API_BASE}/dokumente/download/${fileId}`, "_blank");
};

/* ====== KONTEXTMENÜ ====== */
function showCtxMenu(e, type, id, name) {
  e.preventDefault();
  e.stopPropagation();
  closeCtxMenu();

  ctxTarget = { id, name };
  ctxType = type;

  const menu = document.getElementById("ctxMenu");
  const items = menu.querySelectorAll(".ctx-item");
  const seps = menu.querySelectorAll(".ctx-separator");

  items.forEach(el => el.style.display = "none");
  seps.forEach(el => el.style.display = "none");

  if (type === "folder") {
    items[0].style.display = "flex"; items[0].onclick = () => { closeCtxMenu(); window.createNewNote(id); };
    items[1].style.display = "flex"; items[1].onclick = () => { closeCtxMenu(); uploadToFolder(id); };
    seps[0].style.display = "block";
    items[2].style.display = "none";
    items[3].style.display = "none";
    seps[1].style.display = "none";
    items[4].style.display = "flex"; items[4].onclick = () => { closeCtxMenu(); window.deleteFolder(id); };
  } else if (type === "file") {
    items[0].style.display = "none";
    items[1].style.display = "none";
    seps[0].style.display = "none";
    items[2].style.display = "flex"; items[2].onclick = () => { closeCtxMenu(); renameFile(id, name); };
    items[3].style.display = "flex"; items[3].onclick = () => { closeCtxMenu(); downloadFile(id); };
    seps[1].style.display = "block";
    items[4].style.display = "flex"; items[4].onclick = () => { closeCtxMenu(); deleteFile(id); };
  } else {
    items[0].style.display = "none";
    items[1].style.display = "none";
    seps[0].style.display = "none";
    items[2].style.display = "flex"; items[2].onclick = () => { closeCtxMenu(); window.renameNote(id, name); };
    items[3].style.display = "none";
    seps[1].style.display = "block";
    items[4].style.display = "flex"; items[4].onclick = () => { closeCtxMenu(); window.deleteNote(id); };
  }

  const x = Math.min(e.clientX, window.innerWidth - menu.offsetWidth - 8);
  const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 8);
  menu.style.left = x + "px";
  menu.style.top = y + "px";
  menu.classList.add("open");
}

function closeCtxMenu() {
  const menu = document.getElementById("ctxMenu");
  if (menu) menu.classList.remove("open");
  ctxTarget = null;
  ctxType = null;
}

/* ====== ORDNER-FORM ====== */
window.toggleFolderForm = function () {
  document.getElementById("folderForm").classList.toggle("open");
};

window.toggleFoldersPanel = function () {
  document.querySelector(".app-layout").classList.toggle("folders-collapsed");
};

window.selectFolderColor = function (el) {
  document.querySelectorAll(".ff-dot").forEach((d) => d.classList.remove("active"));
  el.classList.add("active");
};

window.createFolder = async function () {
  const nameInput = document.getElementById("folderName");
  const name = nameInput.value.trim();
  const farbe = document.querySelector(".ff-dot.active")?.dataset.color || "color-sand";
  if (!name) return;

  const res = await authFetch(`${API_BASE}/ordner`, {
    method: "POST",
    body: JSON.stringify({ name, farbe }),
  });

  if (res && res.ok) {
    nameInput.value = "";
    document.querySelectorAll(".ff-dot").forEach((d) => d.classList.remove("active"));
    document.querySelector('.ff-dot[data-color="color-sand"]').classList.add("active");
    toggleFolderForm();
    const foldersRes = await authFetch(`${API_BASE}/ordner`);
    if (foldersRes) allFolders = await foldersRes.json();
    renderTree();
  }
};

/* ====== FORMATIERUNG ====== */
let autoListEnabled = true;
let latexMode = false;

/* ── Notiz-Modus: Normal oder LaTeX ── */
window.setNoteMode = function (mode) {
  latexMode = (mode === "latex");
  document.getElementById("modeNormal").classList.toggle("mode-btn-active", !latexMode);
  document.getElementById("modeLatex").classList.toggle("mode-btn-active", latexMode);
  // Vorschau aktualisieren falls sichtbar
  if (previewActive && currentNoteId) {
    const editor = document.getElementById("noteContent");
    const preview = document.getElementById("notePreview");
    preview.innerHTML = renderPreviewWithMath(editor.innerHTML) || "<p style='color:var(--text-secondary)'>Leere Notiz</p>";
  }
};

/* ── Markdown-Inline-Rendering (für Vorschau) ── */
function mdInline(text) {
  return text
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

/* ── Markdown-Block-Rendering (für Vorschau im LaTeX-Modus) ── */
function renderMarkdown(html) {
  if (!latexMode) return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  const lines = div.textContent.split("\n");
  let out = "";
  let inList = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) { out += "</" + inList + ">\n"; inList = null; }
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#+)/)[1].length;
      out += "<h" + level + ">" + mdInline(line.replace(/^#+\s*/, "")) + "</h" + level + ">\n";
      continue;
    }
    if (/^>\s/.test(line)) {
      out += "<blockquote>" + mdInline(line.replace(/^>\s*/, "")) + "</blockquote>\n";
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      if (inList !== "ul") { if (inList) out += "</" + inList + ">\n"; out += "<ul>\n"; inList = "ul"; }
      out += "  <li>" + mdInline(line.replace(/^[-*]\s*/, "")) + "</li>\n";
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      if (inList !== "ol") { if (inList) out += "</" + inList + ">\n"; out += "<ol>\n"; inList = "ol"; }
      out += "  <li>" + mdInline(line.replace(/^\d+\.\s*/, "")) + "</li>\n";
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) {
      out += "<hr>\n";
      continue;
    }
    if (inList) { out += "</" + inList + ">\n"; inList = null; }
    out += "<p>" + mdInline(line) + "</p>\n";
  }
  if (inList) out += "</" + inList + ">\n";
  return out;
}

/* ── FmtCmd – im LaTeX-Modus Markdown-Syntax einfügen ── */
window.fmtCmd = function (cmd, arg) {
  const editor = document.getElementById("noteContent");
  editor.focus();
  if (latexMode) {
    _latexFmtCmd(cmd, arg);
    return;
  }
  document.execCommand(cmd, false, arg || null);
  onContentChange();
};

function _latexFmtCmd(cmd, arg) {
  const sel = window.getSelection();
  const text = sel.toString();
  let prefix = "", suffix = "";
  switch (cmd) {
    case "bold":             prefix = "**"; suffix = "**"; break;
    case "italic":           prefix = "*";  suffix = "*";  break;
    case "strikeThrough":    prefix = "~~"; suffix = "~~"; break;
    case "underline":        return; // kein Markdown-Äquivalent
    case "insertUnorderedList": prefix = "\n- "; break;
    case "insertOrderedList":   prefix = "\n1. "; break;
    case "formatBlock":
      if (arg === "h1") prefix = "\n# ";
      else if (arg === "h2") prefix = "\n## ";
      else if (arg === "h3") prefix = "\n### ";
      else if (arg === "p") return;
      else if (arg === "blockquote") prefix = "\n> ";
      else return;
      break;
    case "insertHorizontalRule": prefix = "\n---\n"; break;
    case "removeFormat": return;
    default: return;
  }
  if (text && suffix) {
    document.execCommand("insertText", false, prefix + text + suffix);
  } else {
    document.execCommand("insertText", false, prefix);
  }
  onContentChange();
};

/* ── LaTeX-Mathe (wie Obsidian) ── */
window.mathCmd = function () {
  const editor = document.getElementById("noteContent");
  editor.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const text = sel.toString();
  if (!text) {
    // Keine Auswahl → füge leere Formel ein
    document.execCommand("insertText", false, "$\\, $");
    sel.modify("move", "left", "character");
    sel.modify("move", "left", "character");
    sel.modify("move", "left", "character");
    onContentChange();
    return;
  }
  // Prüfen ob Auswahl bereits von $...$ umschlossen ist
  const range = sel.getRangeAt(0);
  const container = range.startContainer;
  if (container.nodeType === Node.TEXT_NODE && container.parentNode) {
    const parent = container.parentNode;
    const fullText = parent.textContent;
    const start = range.startOffset;
    const end = range.endOffset;
    const before = fullText.substring(0, start);
    const after = fullText.substring(end);
    if (before.endsWith("$") && after.startsWith("$")) {
      // Toggle: entferne $...$ → ersetze Auswahl durch Inhalt ohne $
      const inner = text.replace(/^\$|\$$/g, "");
      range.deleteContents();
      range.insertNode(document.createTextNode(inner));
      onContentChange();
      return;
    }
  }
  // Sonst: wickle in $...$
  document.execCommand("insertText", false, "$" + text + "$");
  onContentChange();
};

/** Formel-Editor-Modal: ermöglicht separaten LaTeX-Editor */
let mathModalActive = false;

window.openMathEditor = function () {
  const sel = window.getSelection();
  let initial = "";
  if (sel.rangeCount) {
    const t = sel.toString();
    if (t.startsWith("$") && t.endsWith("$")) initial = t.slice(1, -1).trim();
    else if (t) initial = t;
  }
  const div = document.createElement("div");
  div.className = "math-overlay";
  div.innerHTML = `
    <div class="math-modal">
      <div class="math-modal-header">
        <h3><i class="fas fa-superscript"></i> Formel eingeben (LaTeX)</h3>
        <button class="modal-close-btn" onclick="closeMathEditor()"><i class="fas fa-times"></i></button>
      </div>
      <div class="math-modal-body">
        <textarea id="mathInput" rows="4" placeholder="z. B. E = mc^2">${initial.replace(/</g,"&lt;")}</textarea>
        <div class="math-preview" id="mathPreview">${initial ? renderMathInline("$" + initial + "$") : ""}</div>
      </div>
      <div class="math-modal-footer">
        <span class="math-hint">Inline: <code>$...$</code> &nbsp; Block: <code>$$...$$</code></span>
        <div>
          <button class="secondary-btn" onclick="insertMathBlock()"><i class="fas fa-square-root-variable"></i> Block-Formel</button>
          <button class="primary-btn" onclick="insertMathInline()"><i class="fas fa-superscript"></i> Einfügen</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  mathModalActive = true;

  const textarea = document.getElementById("mathInput");
  textarea.focus();
  textarea.addEventListener("input", function () {
    const preview = document.getElementById("mathPreview");
    const val = this.value.trim();
    if (val) {
      preview.innerHTML = renderMathInline("$" + val + "$");
    } else {
      preview.innerHTML = "";
    }
  });
  textarea.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      insertMathInline();
    }
  });
};

window.closeMathEditor = function () {
  const el = document.querySelector(".math-overlay");
  if (el) el.remove();
  mathModalActive = false;
};

window.insertMathInline = function () {
  const val = document.getElementById("mathInput").value.trim();
  if (!val) { closeMathEditor(); return; }
  const editor = document.getElementById("noteContent");
  editor.focus();
  document.execCommand("insertText", false, "$" + val + "$");
  closeMathEditor();
  onContentChange();
};

window.insertMathBlock = function () {
  const val = document.getElementById("mathInput").value.trim();
  if (!val) { closeMathEditor(); return; }
  const editor = document.getElementById("noteContent");
  editor.focus();
  document.execCommand("insertText", false, "\n$$\n" + val + "\n$$\n");
  closeMathEditor();
  onContentChange();
};

/* ── KaTeX-Rendering ── */
function renderMathInline(html) {
  if (typeof katex === "undefined") return html;
  // Display math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, function (_, expr) {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
    } catch (e) {
      return '<span class="math-error">' + _.replace(/</g,"&lt;") + '</span>';
    }
  });
  // Inline math $...$
  html = html.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function (_, expr) {
    try {
      return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return '<span class="math-error">$' + _.replace(/</g,"&lt;") + '$</span>';
    }
  });
  return html;
}

function renderPreviewWithMath(html) {
  // Render markdown first (if enabled)
  html = renderMarkdown(html);
  // Render math in preview content
  if (typeof katex === "undefined") return html;
  // Display math first (so it won't be caught by inline regex)
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, function (_, expr) {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
    } catch (e) {
      return '<div class="math-error" style="padding:8px;background:#fef2f2;border-radius:4px;color:#e53e3e;text-align:center">✗ LaTeX-Fehler: ' + esc(e.message) + '</div>';
    }
  });
  // Inline math
  html = html.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function (_, expr) {
    try {
      return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return '<span class="math-error">$' + esc(expr) + '$</span>';
    }
  });
  return html;
}

/* ESC für Math-Modal */
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && mathModalActive) {
    closeMathEditor();
  }
});

window.toggleAutoList = function () {
  autoListEnabled = !autoListEnabled;
  document.getElementById("autoListToggle").classList.toggle("fmt-btn-active", autoListEnabled);
};

document.getElementById("noteContent").addEventListener("keydown", function (e) {
  if (!autoListEnabled || e.key !== " ") return;
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return;

  const text = node.textContent;
  const offset = range.startOffset;
  const before = text.substring(0, offset);
  const lineStart = before.lastIndexOf("\n") === -1 ? 0 : before.lastIndexOf("\n") + 1;
  const prefix = before.substring(lineStart);

  if (prefix === "-" || prefix === "*") {
    e.preventDefault();
    range.setStart(node, lineStart);
    range.setEnd(node, lineStart + 1);
    range.deleteContents();
    document.execCommand("insertUnorderedList");
    onContentChange();
    return;
  }

  const numMatch = prefix.match(/^(\d+)\.$/);
  if (numMatch) {
    e.preventDefault();
    range.setStart(node, lineStart);
    range.setEnd(node, lineStart + numMatch[0].length);
    range.deleteContents();
    document.execCommand("insertOrderedList");
    onContentChange();
  }
});

document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && ["b", "i", "u"].includes(e.key)) {
    const map = { b: "bold", i: "italic", u: "underline" };
    fmtCmd(map[e.key]);
    e.preventDefault();
  }
});

/* ── Paste-Handler: im LaTeX-Modus HTML-Formatierung entfernen ── */
document.getElementById("noteContent").addEventListener("paste", function (e) {
  if (!latexMode) return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData("text/plain");
  document.execCommand("insertText", false, text);
});

document.addEventListener("DOMContentLoaded", init);
