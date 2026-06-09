/**
 * MINDFUL - Login-Logik (login.js)
 */

// Basis-Pfad für alle Auth-Anfragen
const AUTH_BASE = "/api/auth";

function showMsg(text, type) {
  const el = document.getElementById("authMessage");
  if (!el) return;
  el.textContent = text;
  el.className = "auth-message " + (type || "error");
}

// 1. Formular-Event-Listener für LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("loginName").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch(`${AUTH_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login fehlgeschlagen");
      }

      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (error) {
      showMsg(error.message, "error");
    }
  });
}

// 2. Event-Listener für REGISTRIERUNG
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value;
    const password = document.getElementById("regPassword").value;

    try {
      const response = await fetch(`${AUTH_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registrierung fehlgeschlagen");
      }

      showMsg("Registrierung erfolgreich! Du kannst dich jetzt einloggen.", "success");
      setTimeout(() => switchAuth("login"), 1000);
    } catch (error) {
      showMsg(error.message, "error");
    }
  });
}

// Load daily quote
async function loadLoginQuote() {
  try {
    const res = await fetch("/api/quote");
    if (!res.ok) return;
    const data = await res.json();
    const el = document.getElementById("loginQuote");
    const authorEl = document.getElementById("loginQuoteAuthor");
    if (el) el.textContent = `"${data.quote}"`;
    if (authorEl) authorEl.textContent = `— ${data.author}`;
  } catch {}
}
loadLoginQuote();

// Auto-switch to register tab if path is /register
if (window.location.pathname.includes("/register")) {
  switchAuth("register");
}

// 3. Tab-Switch Logik
function switchAuth(type) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const title = document.getElementById("authTitle");
  const sub = document.getElementById("authSubtext");

  if (type === "login") {
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    if (title) title.textContent = "Willkommen zurück";
    if (sub) sub.textContent = "Melde dich an, um auf dein Dashboard zuzugreifen.";
  } else {
    loginForm.classList.remove("active");
    registerForm.classList.add("active");
    loginTab.classList.remove("active");
    registerTab.classList.add("active");
    if (title) title.textContent = "Konto erstellen";
    if (sub) sub.textContent = "Registriere dich, um loszulegen.";
  }
}
