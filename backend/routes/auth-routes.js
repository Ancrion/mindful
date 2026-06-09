const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../database/db");
const auth = require("../middleware/auth");

let transporter = null;
if (process.env.MAIL_USER && process.env.MAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.MAIL_PORT || "587"),
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

const wallpaperDir = path.join(__dirname, "../uploads/wallpapers");
if (!fs.existsSync(wallpaperDir)) fs.mkdirSync(wallpaperDir, { recursive: true });

const avatarDir = path.join(__dirname, "../uploads/avatars");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const wallpaperUpload = multer({
  storage: multer.diskStorage({
    destination: wallpaperDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `wallpaper_${req.user.id}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Neuen Benutzer registrieren
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Benutzer erfolgreich registriert
 */
router.post("/register", async (req, res) => {
  try {
    const { name, password, email } = req.body;

    if (!name || !password) {
      return res
        .status(400)
        .json({ error: "Name und Passwort sind erforderlich" });
    }

    // Prüfe ob Benutzer bereits existiert
    const existingUser = db
      .prepare("SELECT id FROM users WHERE name = ?")
      .get(name);
    if (existingUser) {
      return res.status(400).json({ error: "Benutzer existiert bereits" });
    }

    if (email) {
      const existingEmail = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);
      if (existingEmail) {
        return res.status(400).json({ error: "E-Mail wird bereits verwendet" });
      }
    }

    // Hash das Passwort
    const passwort_hash = await bcrypt.hash(password, 10);

    // Erstelle neuen Benutzer
    const result = db
      .prepare("INSERT INTO users (name, email, passwort_hash) VALUES (?, ?, ?)")
      .run(name, email || null, passwort_hash);

    res.status(201).json({
      message: "Benutzer erfolgreich registriert",
      userId: result.lastInsertRowid,
    });
  } catch (err) {
    console.error("Fehler bei der Registrierung:", err);
    res.status(500).json({ error: "Registrierungsfehler" });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Benutzer anmelden
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Erfolgreich angemeldet
 */
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res
        .status(400)
        .json({ error: "Name und Passwort sind erforderlich" });
    }

    // Suche Benutzer
    const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Benutzer nicht gefunden oder Passwort falsch" });
    }

    // Prüfe Passwort
    const passwordMatch = await bcrypt.compare(password, user.passwort_hash);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: "Benutzer nicht gefunden oder Passwort falsch" });
    }

    // Erstelle JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Setze HTTP-Only Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
    });

    res.json({ message: "✅ Erfolgreich angemeldet", token, userId: user.id });
  } catch (err) {
    console.error("Fehler beim Login:", err);
    res.status(500).json({ error: "Loginfehler" });
  }
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Benutzer abmelden
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Erfolgreich abgemeldet
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "✅ Erfolgreich abgemeldet" });
});

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `avatar_${req.user.id}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

router.get("/me", auth, (req, res) => {
  const user = db.prepare("SELECT id, name, email, wallpaper, avatar FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });
  res.json(user);
});

router.put("/me/email", auth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@"))
      return res.status(400).json({ error: "Ungültige E-Mail-Adresse" });

    const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, req.user.id);
    if (existing)
      return res.status(400).json({ error: "E-Mail wird bereits verwendet" });

    db.prepare("UPDATE users SET email = ? WHERE id = ?").run(email, req.user.id);
    res.json({ message: "E-Mail aktualisiert" });
  } catch (err) {
    console.error("Fehler beim E-Mail-Update:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.put("/me", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ error: "Name darf nicht leer sein" });

    const existing = db.prepare("SELECT id FROM users WHERE name = ? AND id != ?").get(name.trim(), req.user.id);
    if (existing)
      return res.status(400).json({ error: "Dieser Name ist bereits vergeben" });

    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name.trim(), req.user.id);
    res.json({ message: "Name aktualisiert" });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Namens:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Alle Felder sind erforderlich" });
    if (newPassword.length < 6)
      return res.status(400).json({ error: "Das neue Passwort muss mind. 6 Zeichen lang sein" });

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    const match = await bcrypt.compare(currentPassword, user.passwort_hash);
    if (!match)
      return res.status(401).json({ error: "Aktuelles Passwort ist falsch" });

    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET passwort_hash = ? WHERE id = ?").run(hash, req.user.id);
    res.json({ message: "Passwort erfolgreich geändert" });
  } catch (err) {
    console.error("Fehler beim Passwort ändern:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.delete("/me", auth, (req, res) => {
  try {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.user.id);
    res.clearCookie("token");
    res.json({ message: "Account gelöscht" });
  } catch (err) {
    console.error("Fehler beim Löschen des Accounts:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.post("/wallpaper", auth, (req, res) => {
  wallpaperUpload.single("wallpaper")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE")
        return res.status(400).json({ error: "Datei zu groß. Max. 10 MB erlaubt." });
      return res.status(400).json({ error: "Nur JPG, PNG, WebP oder GIF erlaubt." });
    }
    try {
      if (!req.file) return res.status(400).json({ error: "Keine gültige Bilddatei" });
      const filename = req.file.filename;
      db.prepare("UPDATE users SET wallpaper = ? WHERE id = ?").run(filename, req.user.id);
      res.json({ message: "Wallpaper gespeichert", filename });
    } catch (err) {
      console.error("Fehler beim Wallpaper-Upload:", err);
      res.status(500).json({ error: "Upload fehlgeschlagen" });
    }
  });
});

router.delete("/wallpaper", auth, (req, res) => {
  try {
    const user = db.prepare("SELECT wallpaper FROM users WHERE id = ?").get(req.user.id);
    if (user?.wallpaper) {
      const filepath = path.join(wallpaperDir, user.wallpaper);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    db.prepare("UPDATE users SET wallpaper = NULL WHERE id = ?").run(req.user.id);
    res.json({ message: "Wallpaper entfernt" });
  } catch (err) {
    console.error("Fehler beim Entfernen des Wallpapers:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

router.get("/wallpaper", auth, (req, res) => {
  try {
    const user = db.prepare("SELECT wallpaper FROM users WHERE id = ?").get(req.user.id);
    res.json({ wallpaper: user?.wallpaper || null });
  } catch (err) {
    res.status(500).json({ error: "Fehler" });
  }
});

router.post("/avatar", auth, (req, res) => {
  avatarUpload.single("avatar")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE")
        return res.status(400).json({ error: "Datei zu groß. Max. 5 MB erlaubt." });
      return res.status(400).json({ error: "Nur JPG, PNG, WebP oder GIF erlaubt." });
    }
    try {
      if (!req.file) return res.status(400).json({ error: "Keine gültige Bilddatei" });
      const filename = req.file.filename;
      db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(filename, req.user.id);
      res.json({ message: "Profilbild gespeichert", filename });
    } catch (err) {
      console.error("Fehler beim Avatar-Upload:", err);
      res.status(500).json({ error: "Upload fehlgeschlagen: " + err.message });
    }
  });
});

router.delete("/avatar", auth, (req, res) => {
  try {
    const user = db.prepare("SELECT avatar FROM users WHERE id = ?").get(req.user.id);
    if (user?.avatar) {
      const filepath = path.join(avatarDir, user.avatar);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    db.prepare("UPDATE users SET avatar = NULL WHERE id = ?").run(req.user.id);
    res.json({ message: "Profilbild entfernt" });
  } catch (err) {
    console.error("Fehler beim Entfernen des Profilbilds:", err);
    res.status(500).json({ error: "Fehler" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-Mail erforderlich" });
    if (!transporter) return res.status(500).json({ error: "SMTP nicht konfiguriert – E-Mail-Konto im .env hinterlegen" });

    const user = db.prepare("SELECT id, name FROM users WHERE email = ?").get(email);
    if (!user) return res.json({ message: "Wenn die E-Mail existiert, wurde ein Reset-Link gesendet." });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 h

    db.prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)").run(user.id, token, expiresAt);

    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.MAIL_FROM || "noreply@mindful.app",
      to: email,
      subject: "Passwort zurücksetzen – Mindful",
      html: `<p>Hallo ${user.name},</p>
<p>klicke auf den folgenden Link, um dein Passwort zurückzusetzen (gültig 1 Stunde):</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail.</p>`,
    });

    res.json({ message: "Wenn die E-Mail existiert, wurde ein Reset-Link gesendet." });
  } catch (err) {
    console.error("Fehler bei forgot-password:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token und Passwort erforderlich" });
    if (password.length < 6) return res.status(400).json({ error: "Passwort muss mind. 6 Zeichen lang sein" });

    const row = db.prepare("SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now')").get(token);
    if (!row) return res.status(400).json({ error: "Ungültiger oder abgelaufener Token" });

    const hash = await bcrypt.hash(password, 10);
    db.prepare("UPDATE users SET passwort_hash = ? WHERE id = ?").run(hash, row.user_id);
    db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(row.id);

    res.json({ message: "Passwort erfolgreich zurückgesetzt" });
  } catch (err) {
    console.error("Fehler bei reset-password:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

module.exports = router;
