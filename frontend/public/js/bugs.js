const API = "/api/bugs";
let currentUser = null;
let isJaroUser = false;

document.addEventListener("DOMContentLoaded", async () => {
  const me = await authFetch("/api/auth/me");
  if (me && me.ok) {
    const data = await me.json();
    currentUser = data;
  }

  await loadBugs();
  document.getElementById("bugForm").addEventListener("submit", submitBug);
});

async function loadBugs() {
  const res = await authFetch(API);
  if (!res || !res.ok) return;
  const data = await res.json();
  isJaroUser = data.isJaro;
  renderKanban(data.bugs);
}

function renderKanban(bugs) {
  const columns = { offen: [], in_arbeit: [], abgeschlossen: [] };
  bugs.forEach(b => {
    const status = b.status === "abgeschlossen" ? "abgeschlossen" : b.status === "in_arbeit" ? "in_arbeit" : "offen";
    columns[status].push(b);
  });

  Object.keys(columns).forEach(status => {
    const container = document.getElementById(`col-${status}`);
    const countEl = document.getElementById(`count-${status}`);
    countEl.textContent = columns[status].length;

    container.innerHTML = columns[status].map(b => `
      <div class="kanban-card" draggable="${isJaroUser}" data-id="${b.id}" data-status="${status}">
        ${isJaroUser ? `<button class="kanban-card-delete" data-id="${b.id}" title="Löschen">&times;</button>` : ""}
        <strong class="kanban-card-title">${escapeHtml(b.titel)}</strong>
        ${b.beschreibung ? `<p class="kanban-card-desc">${escapeHtml(b.beschreibung)}</p>` : ""}
        <div class="kanban-card-meta">
          <span><i class="fa-regular fa-user"></i> ${escapeHtml(b.user_name)}</span>
          <span>${formatDate(b.created_at)}</span>
        </div>
      </div>
    `).join("");

    if (isJaroUser) {
      container.querySelectorAll(".kanban-card").forEach(card => {
        card.addEventListener("dragstart", onDragStart);
        card.addEventListener("dragend", onDragEnd);
      });
      container.querySelectorAll(".kanban-card-delete").forEach(btn => {
        btn.addEventListener("click", deleteBug);
      });
    }
  });

  if (isJaroUser) {
    document.querySelectorAll(".kanban-cards").forEach(col => {
      col.addEventListener("dragover", onDragOver);
      col.addEventListener("dragenter", onDragEnter);
      col.addEventListener("dragleave", onDragLeave);
      col.addEventListener("drop", onDrop);
    });
  }

  /* leer-Zustände */
  document.querySelectorAll(".kanban-cards").forEach(col => {
    if (col.children.length === 0) {
      col.innerHTML = `<p class="kanban-empty">Keine Bugs</p>`;
    }
  });
}

/* ─── Drag & Drop ─── */

let draggedCard = null;

function onDragStart(e) {
  draggedCard = e.target.closest(".kanban-card");
  draggedCard.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", draggedCard.dataset.id);
}

function onDragEnd(e) {
  e.target.closest(".kanban-card")?.classList.remove("dragging");
  document.querySelectorAll(".kanban-cards").forEach(col => col.classList.remove("drag-over"));
  draggedCard = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function onDragEnter(e) {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over");
}

function onDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

async function onDrop(e) {
  e.preventDefault();
  const col = e.currentTarget;
  col.classList.remove("drag-over");

  const id = parseInt(e.dataTransfer.getData("text/plain"));
  if (!id) return;

  const newStatus = col.closest(".kanban-col").dataset.status;
  if (!newStatus) return;

  const res = await authFetch(`${API}/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res || !res.ok) return showToast("Fehler beim Verschieben", "error");
  showToast("Verschoben", "success");
  loadBugs();
}

/* ─── Löschen ─── */

async function deleteBug(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  if (!confirm("Bug wirklich löschen?")) return;

  const res = await authFetch(`${API}/${id}`, { method: "DELETE" });
  if (!res || !res.ok) return showToast("Fehler beim Löschen", "error");
  showToast("Bug gelöscht", "success");
  loadBugs();
}

/* ─── Bug einreichen ─── */

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

/* ─── Hilfsfunktionen ─── */

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
