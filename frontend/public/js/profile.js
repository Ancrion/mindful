document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuthStatus();
  if (!user) return;
  renderUserInfo(user);
  document.getElementById("profileName").value = user.name;
  if (document.getElementById("profileEmail")) document.getElementById("profileEmail").value = user.email || "";
  loadWallpaperPreview();
  loadAvatarPreview();
  document.getElementById("wallpaperInput").addEventListener("change", uploadWallpaper);
  document.getElementById("avatarInput").addEventListener("change", uploadAvatar);
});

async function updateName() {
  const name = document.getElementById("profileName").value.trim();
  if (!name) return showMsg("Bitte gib einen Namen ein.", "error");
  if (!/^[a-z]+$/.test(name)) {
    return showMsg("Der Name darf nur Kleinbuchstaben (a-z) enthalten.", "error");
  }

  const res = await authFetch("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  if (!res || !res.ok) return showMsg("Fehler beim Speichern.", "error");
  showMsg("Name erfolgreich gespeichert!", "success");
  renderUserInfo({ name });
}

async function updateEmail() {
  const email = document.getElementById("profileEmail").value.trim();
  if (!email || !email.includes("@"))
    return showMsg("Bitte gib eine gültige E-Mail-Adresse ein.", "error");

  const res = await authFetch("/api/auth/me/email", {
    method: "PUT",
    body: JSON.stringify({ email }),
  });
  if (!res || !res.ok) {
    const data = await res?.json().catch(() => ({}));
    return showMsg(data?.error || "Fehler beim Speichern.", "error");
  }
  showMsg("E-Mail erfolgreich gespeichert!", "success");
}

async function changePassword() {
  const current = document.getElementById("currentPassword").value;
  const newPw = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (!current || !newPw || !confirm)
    return showMsg("Bitte fülle alle Felder aus.", "error");
  if (newPw.length < 6)
    return showMsg("Das neue Passwort muss mind. 6 Zeichen lang sein.", "error");
  if (newPw !== confirm)
    return showMsg("Die neuen Passwörter stimmen nicht überein.", "error");

  const res = await authFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
  });
  if (!res || !res.ok) {
    const data = await res?.json().catch(() => ({}));
    console.error("Avatar upload failed:", res?.status, data);
    return showMsg(data?.error || "Upload fehlgeschlagen (" + res?.status + ")", "error");
  }
  showMsg("Passwort erfolgreich geändert!", "success");
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
}

async function deleteAccount() {
  if (!confirm("Bist du sicher? Alle deine Daten werden unwiderruflich gelöscht."))
    return;
  if (!confirm("Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."))
    return;

  const res = await authFetch("/api/auth/me", { method: "DELETE" });
  if (!res || !res.ok) return showMsg("Fehler beim Löschen.", "error");
  localStorage.removeItem("token");
  window.location.replace("/login");
}

function showMsg(text, type) {
  const el = document.getElementById("profileMsg") || createMsgEl();
  el.textContent = text;
  el.className = "msg " + type;
  el.style.display = "block";
}

function createMsgEl() {
  const el = document.createElement("div");
  el.id = "profileMsg";
  document.querySelector(".profile-content").prepend(el);
  return el;
}

async function loadWallpaperPreview() {
  const res = await authFetch("/api/auth/wallpaper");
  if (!res || !res.ok) return;
  const data = await res.json();
  if (data.wallpaper) {
    document.getElementById("wallpaperPreview").innerHTML =
      `<img src="/uploads/wallpapers/${data.wallpaper}?t=${Date.now()}" alt="Hintergrund" class="wp-preview-img" />`;
    document.getElementById("wpRemoveBtn").style.display = "flex";
  }
}

async function uploadWallpaper() {
  const file = document.getElementById("wallpaperInput").files[0];
  if (!file) return;

  const form = new FormData();
  form.append("wallpaper", file);

  const token = localStorage.getItem("token");
  const res = await fetch("/api/auth/wallpaper", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: form,
  });
  if (!res || !res.ok) {
    const data = await res?.json().catch(() => ({}));
    return showMsg(data?.error || "Upload fehlgeschlagen", "error");
  }

  showMsg("Hintergrund gespeichert!", "success");
  loadWallpaperPreview();
  applyWallpaper();
}

async function removeWallpaper() {
  const res = await authFetch("/api/auth/wallpaper", { method: "DELETE" });
  if (!res || !res.ok) return showMsg("Fehler beim Entfernen", "error");
  showMsg("Hintergrund entfernt", "success");
  document.getElementById("wallpaperPreview").innerHTML = `
    <div class="wp-preview-placeholder">
      <i class="fas fa-mountain"></i>
      <span>Kein Hintergrund</span>
    </div>`;
  document.getElementById("wpRemoveBtn").style.display = "none";
  document.body.style.background = "";
  document.body.classList.remove("has-wallpaper");
}

async function applyWallpaper() {
  const res = await authFetch("/api/auth/wallpaper");
  if (!res || !res.ok) return;
  const data = await res.json();
  if (data.wallpaper) {
    document.body.style.background = `url(/uploads/wallpapers/${data.wallpaper}?t=${Date.now()}) center/cover fixed no-repeat`;
    document.body.classList.add("has-wallpaper");
  }
}

async function loadAvatarPreview() {
  const res = await authFetch("/api/auth/me");
  if (!res || !res.ok) return;
  const user = await res.json();
  if (user.avatar) {
    document.getElementById("avatarPreview").innerHTML =
      `<img src="/uploads/avatars/${user.avatar}?t=${Date.now()}" alt="Profilbild" class="av-preview-img" />`;
    document.getElementById("avRemoveBtn").style.display = "flex";
  }
}

async function uploadAvatar() {
  const file = document.getElementById("avatarInput").files[0];
  if (!file) return;

  const form = new FormData();
  form.append("avatar", file);

  const token = localStorage.getItem("token");
  const res = await fetch("/api/auth/avatar", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    body: form,
  });
  if (!res || !res.ok) {
    const data = await res?.json().catch(() => ({}));
    return showMsg(data?.error || "Upload fehlgeschlagen", "error");
  }

  showMsg("Profilbild gespeichert!", "success");
  loadAvatarPreview();
  const me = await authFetch("/api/auth/me");
  if (me && me.ok) {
    const u = await me.json();
    if (u) renderUserInfo(u);
  }
}

async function removeAvatar() {
  const res = await authFetch("/api/auth/avatar", { method: "DELETE" });
  if (!res || !res.ok) return showMsg("Fehler beim Entfernen", "error");
  showMsg("Profilbild entfernt", "success");
  document.getElementById("avatarPreview").innerHTML = `
    <div class="av-preview-placeholder">
      <i class="fas fa-user"></i>
    </div>`;
  document.getElementById("avRemoveBtn").style.display = "none";
  renderUserInfo(await (await authFetch("/api/auth/me"))?.json());
}
