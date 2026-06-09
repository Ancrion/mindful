let lbData = null;
let activeTab = "todosDone";

async function loadLeaderboard() {
  const res = await authFetch(`${API_BASE}/leaderboard`);
  if (!res || !res.ok) return;
  lbData = await res.json();
  document.getElementById("totalUsers").textContent = lbData.totalUsers;
  document.getElementById("totalTodos").textContent = lbData.totalTodos;
  renderTab(activeTab);
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".lb-tab").forEach((t) => t.classList.toggle("active", t.onclick.toString().includes(tab)));
  renderTab(tab);
}

function renderTab(tab) {
  const entries = lbData?.[tab] || [];
  const tbody = document.getElementById("lbBody");
  const empty = document.getElementById("lbEmpty");

  if (entries.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const medal = ["lb-gold", "lb-silver", "lb-bronze"];
  tbody.innerHTML = entries
    .map(
      (e, i) => `
      <tr class="lb-row ${medal[i] || ""}">
        <td class="lb-rank">${i + 1}</td>
        <td><a href="/user/${e.id}" class="lb-user-link">${escHtml(e.name)}</a></td>
        <td class="lb-col-value">${formatLBValue(tab, e.value)}</td>
      </tr>`,
    )
    .join("");
}

function formatLBValue(tab, value) {
  if (!value || value === 0) return "0";
  if (tab === "todosDone") return `${value}`;
  const min = Math.round(value / 60);
  if (min < 60) return `${min} Min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard();
});
