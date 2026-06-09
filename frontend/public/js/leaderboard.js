async function loadLeaderboard() {
  const res = await authFetch(`${API_BASE}/leaderboard`);
  if (!res || !res.ok) return;

  const data = await res.json();

  document.getElementById("totalUsers").textContent = data.totalUsers;
  document.getElementById("totalTodos").textContent = data.totalTodos;

  renderCategory("lbTodosDone", data.todosDone, "Aufgaben", (v) => `${v} erledigt`);
  renderCategory("lbPomodoro", data.pomodoro, "Minuten", (v) => formatDuration(v));
  renderCategory("lbTracked", data.tracked, "Minuten", (v) => formatDuration(v));
}

function renderCategory(id, entries, unit, formatValue) {
  const el = document.getElementById(id);
  if (!entries || entries.length === 0) {
    el.innerHTML = '<p class="lb-empty">Heute noch keine Einträge</p>';
    return;
  }

  const medal = ["lb-gold", "lb-silver", "lb-bronze"];
  el.innerHTML = entries
    .map(
      (e, i) => `
      <div class="lb-entry ${medal[i] || ""}">
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${escHtml(e.name)}</span>
        <span class="lb-value">${formatValue(e.value)}</span>
      </div>`,
    )
    .join("");
}

function formatDuration(sec) {
  if (!sec || sec === 0) return "0 Min";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} Min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

document.addEventListener("DOMContentLoaded", loadLeaderboard);
