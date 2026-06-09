async function loadProfile() {
  const res = await authFetch(`${API_BASE}/users/${PROFILE_USER_ID}/profile`);
  if (!res || !res.ok) {
    document.getElementById("upCard").innerHTML = '<p class="up-loading" style="color:var(--text-secondary)">Benutzer nicht gefunden</p>';
    return;
  }

  const data = await res.json();
  const u = data.user;
  const s = data.stats;

  const initial = (u.name || "?").charAt(0).toUpperCase();
  const avatarHtml = u.avatar
    ? `<img src="${u.avatar}" class="up-avatar-img" />`
    : `<span class="up-avatar-initial">${initial}</span>`;

  document.getElementById("upCard").innerHTML = `
    <div class="up-hero">
      <div class="up-avatar">${avatarHtml}</div>
      <div class="up-info">
        <h2>${escHtml(u.name)}</h2>
        <p class="up-joined">Mitglied seit ${new Date(u.created_at).toLocaleDateString("de-DE")}</p>
      </div>
    </div>
    <div class="up-stats">
      <div class="up-stat">
        <span class="up-stat-value">${s.totalTodos}</span>
        <span class="up-stat-label">Aufgaben</span>
      </div>
      <div class="up-stat">
        <span class="up-stat-value">${s.todosDone}</span>
        <span class="up-stat-label">Erledigt</span>
      </div>
      <div class="up-stat">
        <span class="up-stat-value">${formatDuration(s.pomodoroTotal)}</span>
        <span class="up-stat-label">Pomodoro</span>
      </div>
      <div class="up-stat">
        <span class="up-stat-value">${formatDuration(s.trackedTotal)}</span>
        <span class="up-stat-label">Zeit</span>
      </div>
    </div>
  `;

  document.getElementById("upActions").style.display = "";
}

function showSendForm() {
  document.getElementById("upSend").style.display = "block";
  document.getElementById("upActions").style.display = "none";
}

function cancelMessage() {
  document.getElementById("upSend").style.display = "none";
  document.getElementById("upActions").style.display = "";
}

async function sendMessage() {
  const subject = document.getElementById("upSubject").value.trim();
  const body = document.getElementById("upBody").value.trim();
  if (!subject) return;

  const res = await authFetch(`${API_BASE}/messages`, {
    method: "POST",
    body: JSON.stringify({ to_user_id: PROFILE_USER_ID, subject, body }),
  });

  if (res && res.ok) {
    showToast("Nachricht gesendet", "success");
    cancelMessage();
  } else {
    const err = res ? await res.json().catch(() => ({})) : {};
    showToast(err.error || "Fehler beim Senden", "error");
  }
}

function formatDuration(sec) {
  if (!sec || sec === 0) return "0";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

document.getElementById("upMessageBtn")?.addEventListener("click", showSendForm);
document.addEventListener("DOMContentLoaded", loadProfile);
