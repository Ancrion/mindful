let messagesData = null;
let currentMsgTab = "inbox";
let allUsers = [];
let selectedUserId = null;

async function loadMessages() {
  const [inboxRes, sentRes, unreadRes] = await Promise.all([
    authFetch(`${API_BASE}/messages/inbox`),
    authFetch(`${API_BASE}/messages/sent`),
    authFetch(`${API_BASE}/messages/unread`),
  ]);

  const inbox = inboxRes && inboxRes.ok ? await inboxRes.json() : [];
  const sent = sentRes && sentRes.ok ? await sentRes.json() : [];
  const unread = unreadRes && unreadRes.ok ? (await unreadRes.json()).count : 0;

  messagesData = { inbox, sent };
  const badge = document.getElementById("unreadBadge");
  if (badge) {
    badge.textContent = unread > 0 ? unread : "";
    badge.style.display = unread > 0 ? "inline" : "none";
  }

  renderList(currentMsgTab);
}

async function loadUsers() {
  const res = await authFetch(`${API_BASE}/users`);
  if (res && res.ok) {
    allUsers = await res.json();
  }
}

function switchMsgTab(tab) {
  currentMsgTab = tab;
  document.querySelectorAll(".msg-tab").forEach((t) =>
    t.classList.toggle("active", (tab === "inbox" && t.textContent.includes("Posteingang")) || (tab === "sent" && t.textContent.includes("Gesendet")))
  );
  document.getElementById("msgDetail").style.display = "none";
  document.getElementById("msgList").style.display = "";
  renderList(tab);
}

function renderList(tab) {
  const list = document.getElementById("msgList");
  const msgs = messagesData?.[tab] || [];

  if (msgs.length === 0) {
    list.innerHTML = '<p class="msg-empty">Keine Nachrichten</p>';
    return;
  }

  const otherField = tab === "inbox" ? "from_name" : "to_name";
  list.innerHTML = msgs
    .map(
      (m) => `
      <div class="msg-item ${m.read ? "" : "msg-unread"}" onclick="openMsg(${m.id}, '${tab}')">
        <div class="msg-item-from">${escHtml(m[otherField])}</div>
        <div class="msg-item-subject">${escHtml(m.subject)}</div>
        <div class="msg-item-date">${formatDate(m.created_at)}</div>
      </div>`,
    )
    .join("");
}

function openMsg(id, tab) {
  const msgs = messagesData?.[tab] || [];
  const msg = msgs.find((m) => m.id === id);
  if (!msg) return;

  if (tab === "inbox" && !msg.read) {
    authFetch(`${API_BASE}/messages/${id}/read`, { method: "PUT" });
    msg.read = 1;
    loadMessages();
  }

  const otherField = tab === "inbox" ? "from_name" : "to_name";
  document.getElementById("msgDetailBody").innerHTML = `
    <div class="msg-detail-header">
      <span class="msg-detail-from">${tab === "inbox" ? "Von" : "An"}: <strong>${escHtml(msg[otherField])}</strong></span>
      <span class="msg-detail-date">${formatDate(msg.created_at)}</span>
    </div>
    <h3 class="msg-detail-subject">${escHtml(msg.subject)}</h3>
    <div class="msg-detail-content">${escHtml(msg.body) || "<em>Kein Inhalt</em>"}</div>
  `;

  document.getElementById("msgList").style.display = "none";
  document.getElementById("msgDetail").style.display = "block";
}

function closeDetail() {
  document.getElementById("msgDetail").style.display = "none";
  document.getElementById("msgList").style.display = "";
}

function showCompose() {
  document.getElementById("msgCompose").style.display = "block";
  document.getElementById("msgUserSearch").value = "";
  document.getElementById("msgSubject").value = "";
  document.getElementById("msgBody").value = "";
  selectedUserId = null;
  document.getElementById("msgSelectedUser").style.display = "none";
  document.getElementById("msgUserSelect").style.display = "";
  renderUserList(allUsers);
}

function hideCompose() {
  document.getElementById("msgCompose").style.display = "none";
}

function filterUsers() {
  const q = document.getElementById("msgUserSearch").value.toLowerCase();
  const filtered = allUsers.filter((u) => u.name.toLowerCase().includes(q));
  renderUserList(filtered);
}

function renderUserList(users) {
  const dd = document.getElementById("msgUserDropdown");
  if (users.length === 0) {
    const q = document.getElementById("msgUserSearch").value.trim();
    dd.innerHTML = q ? '<div class="msg-user-opt disabled">Keine Nutzer gefunden</div>' : "";
    return;
  }
  dd.innerHTML = users
    .map(
      (u) => `<div class="msg-user-opt" data-id="${u.id}" onclick="selectUser(${u.id}, '${escHtml(u.name)}')">${escHtml(u.name)}</div>`,
    )
    .join("");
}

function selectUser(id, name) {
  selectedUserId = id;
  document.getElementById("msgSelectedName").textContent = name;
  document.getElementById("msgSelectedUser").style.display = "flex";
  document.getElementById("msgUserSelect").style.display = "none";
}

function clearRecipient() {
  selectedUserId = null;
  document.getElementById("msgSelectedUser").style.display = "none";
  document.getElementById("msgUserSelect").style.display = "";
  document.getElementById("msgUserSearch").value = "";
  document.getElementById("msgUserSearch").focus();
  renderUserList(allUsers);
}

async function sendCompose() {
  if (!selectedUserId) {
    showToast("Bitte wähle einen Empfänger", "error");
    return;
  }
  const subject = document.getElementById("msgSubject").value.trim();
  if (!subject) {
    showToast("Bitte gib einen Betreff ein", "error");
    return;
  }
  const body = document.getElementById("msgBody").value.trim();

  const res = await authFetch(`${API_BASE}/messages`, {
    method: "POST",
    body: JSON.stringify({ to_user_id: selectedUserId, subject, body }),
  });

  if (res && res.ok) {
    showToast("Nachricht gesendet", "success");
    hideCompose();
    loadMessages();
  } else {
    const err = res ? await res.json().catch(() => ({})) : {};
    showToast(err.error || "Fehler beim Senden", "error");
  }
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadMessages();
  loadUsers();
});
