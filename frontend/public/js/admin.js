document.addEventListener("DOMContentLoaded", async () => {
  await loadAdminUsers();
});

async function loadAdminUsers() {
  const tbody = document.getElementById("adminUserList");
    tbody.innerHTML = '<tr><td colspan="7" class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Lade Benutzer…</td></tr>';

  try {
    const res = await authFetch("/api/admin/users");
    if (!res.ok) throw new Error(await res.text());
    const users = await res.json();

    let totalAdmins = 0;
    tbody.innerHTML = "";

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">Keine Benutzer gefunden.</td></tr>';
      return;
    }

    users.forEach(u => {
      if (u.is_admin) totalAdmins++;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${u.is_admin ? '<span class="admin-badge admin-badge-yes">Admin</span>' : '<span class="admin-badge admin-badge-no">User</span>'}</td>
        <td>${formatDate(u.created_at)}</td>
        <td>${u.todos}</td>
        <td>${u.bugs}</td>
        <td class="admin-actions">
          <button class="admin-btn admin-btn-toggle" onclick="toggleAdmin(${u.id}, '${escapeHtml(u.name)}', ${u.is_admin})" title="Admin-Rechte umschalten">
            <i class="fas fa-user-shield"></i>
          </button>
          <button class="admin-btn admin-btn-reset" onclick="resetPassword(${u.id}, '${escapeHtml(u.name)}')" title="Passwort zurücksetzen">
            <i class="fas fa-key"></i>
          </button>
          <button class="admin-btn admin-btn-delete" onclick="deleteUser(${u.id}, '${escapeHtml(u.name)}')" title="Benutzer löschen">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById("statUsers").textContent = users.length;
    document.getElementById("statAdmins").textContent = totalAdmins;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="admin-error"><i class="fas fa-exclamation-triangle"></i> Fehler: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function toggleAdmin(id, name, current) {
  if (!confirm(`Soll "${name}" ${current ? "Admin-Rechte entzogen" : "Admin-Rechte erteilt"} bekommen?`)) return;
  try {
    const res = await authFetch(`/api/admin/users/${id}/toggle-admin`, { method: "PUT" });
    if (!res.ok) {
      const err = await res.json();
      return showToast(err.error || "Fehler", "error");
    }
    await loadAdminUsers();
    showToast(`Admin-Status für "${name}" geändert`, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteUser(id, name) {
  if (!confirm(`⚠️ Soll "${name}" endgültig gelöscht werden? Alle zugehörigen Daten (Todos, Notizen, etc.) gehen verloren.`)) return;
  if (!confirm(`Wirklich löschen? "${name}" kann nicht wiederhergestellt werden!`)) return;
  try {
    const res = await authFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      return showToast(err.error || "Fehler", "error");
    }
    await loadAdminUsers();
    showToast(`"${name}" gelöscht`, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function resetPassword(id, name) {
  const pw = prompt(`Neues Passwort für "${name}" (leer lassen für Standard: mindful2024):`);
  if (pw === null) return;
  try {
    const res = await authFetch(`/api/admin/users/${id}/reset-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw || undefined })
    });
    if (!res.ok) {
      const err = await res.json();
      return showToast(err.error || "Fehler", "error");
    }
    const data = await res.json();
    showToast(`Passwort für "${name}" zurückgesetzt auf: ${data.newPassword}`, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
