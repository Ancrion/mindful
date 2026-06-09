let messagesData = null;
let currentMsgTab = "inbox";

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

function switchMsgTab(tab) {
  currentMsgTab = tab;
  document.querySelectorAll(".msg-tab").forEach((t) =>
    t.classList.toggle("active", t.textContent.includes(tab === "inbox" ? "Posteingang" : "Gesendet"))
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

  // Mark as read if inbox
  if (tab === "inbox" && !msg.read) {
    authFetch(`${API_BASE}/messages/${id}/read`, { method: "PUT" });
    msg.read = 1;
    loadMessages();
  }

  const otherField = tab === "inbox" ? "from_name" : "to_name";
  document.getElementById("msgDetailBody").innerHTML = `
    <div class="msg-detail-header">
      <span class="msg-detail-from">Von: <strong>${escHtml(tab === "inbox" ? msg.from_name : "Dir")}</strong></span>
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

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

document.addEventListener("DOMContentLoaded", loadMessages);
