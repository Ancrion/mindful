// ─── Pomodoro Timer ───
let _pomoTimer = null;
let _pomoRemaining = 25 * 60; // seconds
let _pomoDuration = 25; // minutes
let _pomoRunning = false;
let _pomoChart = null;

const POMO_TICK = 1000; // 1 second

// ─── DOM refs ───
const $ = (id) => document.getElementById(id);
const elMinutes = $("pomoMinutes");
const elSeconds = $("pomoSeconds");
const elStart = $("pomoStartBtn");
const elPause = $("pomoPauseBtn");
const elReset = $("pomoResetBtn");
const elDurBtns = $("pomoDurationBtns");
const elTask = $("pomoTaskSelect");
const elCard = document.querySelector(".pomo-timer-card");

// ─── Init ───
async function initPomodoro() {
  loadTasks();
  await loadStats();
  setupEvents();
  updateDisplay();
}

async function loadTasks() {
  try {
    const res = await authFetch(`${API_BASE}/todos`);
    if (!res) return;
    const data = await res.json();
    const tasks = data.filter((t) => t.status !== "erledigt");
    elTask.innerHTML = '<option value="">– Keine Aufgabe –</option>';
    tasks.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.titel;
      if (t.workspace_name) opt.textContent += ` (${t.workspace_name})`;
      elTask.appendChild(opt);
    });
  } catch (err) {
    console.error("Fehler beim Laden der Aufgaben:", err);
  }
}

async function loadStats() {
  try {
    const data = await apiFetch("pomodoro/stats");
    if (!data) return;
    $("pomoTodaySessions").textContent = data.today.sessions;
    $("pomoTodayMinutes").textContent = Math.round(data.today.seconds / 60);
    $("pomoTotalHours").textContent = (data.totalFocusSeconds / 3600).toFixed(1);
    $("pomoSuccessRate").textContent = data.successRate + "%";
    renderWeekChart(data.week);
  } catch (err) {
    console.error("Fehler beim Laden der Stats:", err);
  }
}

function renderWeekChart(weekData) {
  if (_pomoChart) { _pomoChart.destroy(); _pomoChart = null; }
  const canvas = $("pomoWeekChart");
  if (!canvas) return;

  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const map = {};
  weekData.forEach((d) => { map[d.day] = d; });

  const labels = [];
  const minutes = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    labels.push(days[d.getDay()] + " " + d.getDate() + "." + (d.getMonth() + 1));
    const entry = map[key];
    minutes.push(entry ? Math.round(entry.total_seconds / 60) : 0);
  }

  const ctx = canvas.getContext("2d");
  _pomoChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Fokus (min)",
        data: minutes,
        backgroundColor: "#f24b3d",
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 10 } },
        x: { grid: { display: false } },
      },
    },
  });
}

// ─── Timer Logic ───
function setupEvents() {
  elStart.addEventListener("click", startTimer);
  elPause.addEventListener("click", pauseTimer);
  elReset.addEventListener("click", resetTimer);

  elDurBtns.addEventListener("click", (e) => {
    const btn = e.target.closest(".dur-btn");
    if (!btn) return;
    if (_pomoRunning) return;
    elDurBtns.querySelectorAll(".dur-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    _pomoDuration = parseInt(btn.dataset.min);
    _pomoRemaining = _pomoDuration * 60;
    updateDisplay();
  });
}

function startTimer() {
  if (_pomoTimer) return;
  if (_pomoRemaining <= 0) {
    _pomoRemaining = _pomoDuration * 60;
    updateDisplay();
  }
  _pomoRunning = true;
  elStart.style.display = "none";
  elPause.style.display = "inline-flex";
  elCard.classList.add("pomo-running");
  _pomoTimer = setInterval(tick, POMO_TICK);
  savePomoState(true);
  playSound("start");
}

function pauseTimer() {
  _pomoRunning = false;
  clearInterval(_pomoTimer);
  _pomoTimer = null;
  elStart.style.display = "inline-flex";
  elPause.style.display = "none";
  elCard.classList.remove("pomo-running");
  savePomoState(false);
}

function resetTimer() {
  pauseTimer();
  _pomoRemaining = _pomoDuration * 60;
  updateDisplay();
  clearPomoState();
}

// ─── Click-to-edit Pomodoro Time ───
elMinutes.addEventListener("click", function editMinutes() {
  if (_pomoRunning) return;
  const current = _pomoDuration;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "pomo-minutes-input";
  input.value = current;
  input.style.width = "80px";
  input.style.fontSize = "inherit";
  input.style.fontWeight = "inherit";
  input.style.textAlign = "center";
  input.style.background = "transparent";
  input.style.border = "none";
  input.style.outline = "none";
  input.style.color = "inherit";
  this.textContent = "";
  this.appendChild(input);
  input.focus();
  input.select();

  function parseTime(str) {
    str = str.trim();
    if (!str) return NaN;
    const parts = str.split(":").map(s => parseFloat(s));
    if (parts.length === 3) return parts[0] * 60 + parts[1] + (parts[2] || 0) / 60;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseFloat(str);
  }

  function done() {
    const val = parseTime(input.value);
    if (val && val >= 1 && val <= 999) {
      _pomoDuration = Math.round(val);
      _pomoRemaining = Math.round(val * 60);
      elDurBtns.querySelectorAll(".dur-btn").forEach((b) => b.classList.remove("active"));
      updateDisplay();
    } else {
      updateDisplay();
    }
  }

  input.addEventListener("blur", done);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { input.blur(); }
    if (e.key === "Escape") { updateDisplay(); }
  });
});

function tick() {
  _pomoRemaining--;
  if (_pomoRemaining <= 0) {
    _pomoRemaining = 0;
    updateDisplay();
    completeTimer();
    return;
  }
  updateDisplay();
}

function savePomoState(running) {
  const state = {
    running,
    remaining: _pomoRemaining,
    duration: _pomoDuration,
    startedAt: running ? Date.now() : null,
  };
  try { localStorage.setItem("pomoState", JSON.stringify(state)); } catch {}
}

function clearPomoState() {
  try { localStorage.removeItem("pomoState"); } catch {}
}

function completeTimer() {
  clearInterval(_pomoTimer);
  _pomoTimer = null;
  _pomoRunning = false;
  elStart.style.display = "inline-flex";
  elPause.style.display = "none";
  elCard.classList.remove("pomo-running");

  // Save session
  const todoId = elTask.value ? parseInt(elTask.value) : null;
  apiFetch("pomodoro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ todo_id: todoId, duration_seconds: _pomoDuration * 60 }),
  });

  playSound("complete");
  showNotification("Session abgeschlossen! Gut gemacht.");
  loadStats();

  clearPomoState();

  // Auto-reset for next session
  _pomoRemaining = _pomoDuration * 60;
  updateDisplay();
}

function updateDisplay() {
  const mins = Math.floor(_pomoRemaining / 60);
  const secs = _pomoRemaining % 60;
  elMinutes.textContent = String(mins).padStart(2, "0");
  elSeconds.textContent = String(secs).padStart(2, "0");

  // Update document title
  if (_pomoRunning) {
    document.title = `(${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}) Mindful – Pomodoro`;
  } else {
    document.title = "Mindful – Pomodoro";
  }
}

// ─── Sound ───
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "complete") {
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(() => {
        const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.frequency.value = 1108;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx2.currentTime + 0.5);
      }, 500);
    } else {
      osc.frequency.value = 660;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (_) { /* silent fail */ }
}

// ─── Notification ───
function showNotification(msg) {
  const existing = document.querySelector(".pomo-notification");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "pomo-notification";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.3s";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ─── Events ───
document.addEventListener("DOMContentLoaded", initPomodoro);
