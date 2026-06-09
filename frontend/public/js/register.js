// ===============================
// Konfiguration
// ===============================
const API_BASE = "/api"; // Relativ für Express

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const errorDiv = document.getElementById("errorMessage");
  const authBtn = document.querySelector(".auth-btn");

  if (!registerForm) return;

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Eingaben abrufen
    const name = document.getElementById("regName")?.value;
    const password = document.getElementById("regPassword")?.value;

    // Einfache Validierung vorab
    if (!name || !password) {
      showError("Bitte fülle alle Felder aus.");
      return;
    }

    // UI Reset
    hideError();
    setLoading(true);

    try {
      // 2. Request an das Backend
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();

      // 3. Antwort verarbeiten
      if (response.ok) {
        showSuccess();
        // Weiterleitung nach Erfolg
        setTimeout(() => {
          window.location.href = "/login"; // Ohne .html für Express
        }, 1500);
      } else {
        showError(data.error || "Registrierung fehlgeschlagen.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Verbindungsfehler:", err);
      showError("Server nicht erreichbar. Bitte später versuchen.");
      setLoading(false);
    }
  });

  // --- Hilfsfunktionen ---

  function showError(msg) {
    if (errorDiv) {
      errorDiv.textContent = msg;
      errorDiv.style.display = "block";
      errorDiv.className = "auth-message error"; // Konsistente Klassen
    }
  }

  function hideError() {
    if (errorDiv) errorDiv.style.display = "none";
  }

  function setLoading(isLoading) {
    if (!authBtn) return;
    if (isLoading) {
      authBtn.disabled = true;
      authBtn.textContent = "Wird verarbeitet...";
    } else {
      authBtn.disabled = false;
      authBtn.textContent = "Konto erstellen";
    }
  }

  function showSuccess() {
    if (authBtn) {
      authBtn.textContent = "ERFOLGREICH!";
      authBtn.style.backgroundColor = "#2e7d4f";
      authBtn.disabled = true;
    }
  }
});

// Sprach-Switch UI Toggle (Optimiert)
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("lang-btn")) {
    document
      .querySelectorAll(".lang-btn")
      .forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");
  }
});
