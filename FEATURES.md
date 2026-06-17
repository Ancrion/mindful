# 🧘 Mindful - Personal Dashboard

Ein vollständig funktionsfähiges Personal Dashboard mit Todos, Notizen, Kalender, Dokumenten und Workspaces.

## ✅ Projekt Status

**VOLLSTÄNDIG KORRIGIERT UND GETESTET**

- ✅ Backend: Express.js Server läuft
- ✅ Datenbank: SQLite mit allen Tabellen
- ✅ Authentifizierung: JWT mit Login/Register
- ✅ APIs: Alle CRUD-Operationen funktionieren
- ✅ Frontend Views: Alle EJS-Templates vorhanden
- ✅ Sicherheit: User-Isolation auf allen Endpoints

## 🚀 Schnellstart

### Installation

```bash
# Root-Dependencies
npm install

# Backend-Dependencies
cd backend
npm install
cd ..
```

### Konfiguration

Die `.env` Datei im Backend ist vorkonfiguriert mit einem sicheren JWT_SECRET.

```bash
# backend/.env
JWT_SECRET=e38d4e24edbeb133680478e6dcddff32cdf55c55d9fea81f4b86704cd2b5927e
PORT=3000
```

### Server starten

```bash
cd backend
npm start
# oder mit Nodemon für Development
npm run dev
```

Der Server läuft dann auf `http://localhost:3000`

## 🔑 Authentifizierung

### Benutzer registrieren

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"username","password":"password123"}'
```

### Benutzer anmelden

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name":"username","password":"password123"}'
```

**Response:**

```json
{
  "message": "✅ Erfolgreich angemeldet",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1
}
```

### API mit Token nutzen

Alle geschützten Endpoints benötigen einen JWT-Token im Header:

```bash
curl http://localhost:3000/api/todos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📚 API Endpoints

### Authentifizierung

- `POST /api/auth/register` - Neuen Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden
- `POST /api/auth/logout` - Abmelden

### Dashboard

- `GET /api/dashboard` - Alle Daten für Dashboard abrufen

### Todos

- `GET /api/todos` - Alle Todos abrufen
- `POST /api/todos` - Neues Todo erstellen
- `PUT /api/todos/:id` - Todo aktualisieren
- `DELETE /api/todos/:id` - Todo löschen
- `GET /api/todos/:id/related` - Verknüpfte Notizen/Dokumente

### Notizen

- `GET /api/notizen` - Alle Notizen abrufen
- `POST /api/notizen` - Neue Notiz erstellen
- `PUT /api/notizen/:id` - Notiz aktualisieren
- `DELETE /api/notizen/:id` - Notiz löschen

#### LaTeX / Mathe-Formeln (KaTeX)

Der Notizen-Editor unterstützt mathematische Formeln mit LaTeX-Syntax, gerendert durch **KaTeX**.

**Quick-Start:**
- `$...$` für Inline-Formeln, z. B. `$E = mc^2$` → E = mc²
- `$$...$$` für Block-Formeln, z. B. `$$\sum_{i=1}^n i^2$$`

**Zwei Modi (Toolbar rechts):** `[📝 Normal] [∑ LaTeX]`

| Modus | Editor | Vorschau |
|-------|--------|----------|
| **Normal** | WYSIWYG (HTML) | Nur LaTeX `$...$` |
| **LaTeX** | Roh-Text, Toolbar fügt `**fett**`, `*kursiv*`, `# H1` etc. ein | Markdown + LaTeX |

**Optionen im Editor:**
- **Toolbar-Button ∑** → Markierten Text in `$...$` packen (toggle)
- **Formel-Editor-Modal** → Separater Editor mit Live-Vorschau (Strg+Enter)
- **Vorschau-Modus (👁️)** → Alle Formeln werden via KaTeX gerendert
- **LaTeX-Modus:** Paste entfernt HTML-Formatierung (nur Plaintext)

**Markdown-Syntax (nur im LaTeX-Modus):**

| Eingabe | Ergebnis |
|---------|----------|
| `**fett**` / `__fett__` | **fett** |
| `*kursiv*` / `_kursiv_` | *kursiv* |
| `~~durchgestrichen~~` | ~~durchgestrichen~~ |
| `` `code` `` | `code` |
| `[Link](url)` | [Link](url) |
| `# H1`, `## H2`, `### H3` | Überschriften |
| `- Liste` / `* Liste` | Aufzählung |
| `1. Liste` | Nummerierte Liste |
| `> Zitat` | Zitatblock |
| `---` | Trennlinie |
| `$...$` / `$$...$$` | LaTeX-Mathe (KaTeX) |

**Technik:** KaTeX v0.16.11 (CDN), `contenteditable`-Editor mit `document.execCommand`

### Kalender

- `GET /api/kalender` - Alle Events abrufen
- `POST /api/kalender` - Neues Event erstellen
- `PUT /api/kalender/:id` - Event aktualisieren
- `DELETE /api/kalender/:id` - Event löschen

#### Event-Editor: Dauer ↔ Uhrzeit synchronisiert
Änderst du die Dauer, Startzeit oder Endzeit im Event-Modal, passen sich die anderen Felder automatisch an:
- **Dauer ändern** → Endzeit wird neu berechnet
- **Startzeit ändern** → Endzeit folgt (Dauer bleibt gleich)
- **Endzeit ändern** → Dauer wird neu ermittelt (ggf. „Benutzerdefiniert")
- Nicht-Standard-Dauern (z. B. 45 Min) aktivieren automatisch das Custom-Eingabefeld

#### Auto-Farbe vom Workspace
Wird ein Workspace im Event ausgewählt, übernimmt der Event-Farbpunkt automatisch die Farbe des Workspace. Die Farbpalette (8 Punkte) deckt alle Workspace-Farben ab: Blau, Rot, Gelb, Grün, Lila, Pink, Teal, Orange.

### Dokumente

- `GET /api/dokumente` - Alle Dokumente abrufen
- `POST /api/dokumente/upload` - Datei hochladen
- `DELETE /api/dokumente/:id` - Dokument löschen

### Ordner

- `GET /api/ordner` - Alle Ordner abrufen
- `POST /api/ordner` - Neuen Ordner erstellen
- `DELETE /api/ordner/:id` - Ordner löschen

### Workspaces

- `GET /api/workspaces` - Alle Workspaces abrufen
- `POST /api/workspaces` - Neuen Workspace erstellen
- `PUT /api/workspaces/:id` - Workspace aktualisieren
- `DELETE /api/workspaces/:id` - Workspace löschen

## 📋 Beispiel: Todo erstellen

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "titel": "Projekt abschließen",
    "beschreibung": "Alle Fehler beheben",
    "faellig": "2026-06-30"
  }'
```

**Response:**

```json
{
  "message": "Todo erstellt ✅",
  "id": 1
}
```

## 🗄️ Datenbankschema

Die Datenbank enthält folgende Tabellen:

- **users** - Benutzer mit Passwort-Hash
- **sessions** - JWT-Token-Management
- **workspaces** - Benutzer-Workspaces
- **todos** - Aufgaben mit Status und Fälligkeitsdatum
- **notizen** - Farbige Notizen
- **events** - Kalender-Events
- **kalender_kategorien** - Event-Kategorien
- **ordner** - Dokument-Ordnerstruktur
- **dokumente** - Hochgeladene Dateien

## 🔒 Sicherheitsfeatures

✅ **JWT-basierte Authentifizierung** - Stateless, skalierbar  
✅ **HTTP-Only Cookies** - Token ist vor XSS geschützt  
✅ **Bcrypt-Passwort-Hashing** - Sichere Speicherung  
✅ **User-Isolation** - Alle Queries filtern nach `user_id`  
✅ **Bearer Token Support** - Für API-Clients  
✅ **CORS-Unterstützung** - Sichere Cross-Origin-Requests

## 📁 Projektstruktur

```
mindful/
├── backend/
│   ├── database/
│   │   └── db.js           # SQLite Setup
│   ├── middleware/
│   │   └── auth.js         # JWT-Authentifizierung
│   ├── routes/
│   │   ├── auth-routes.js  # Login/Register
│   │   ├── api_root.js     # Route-Aggregation
│   │   ├── todos.js        # Todos-API
│   │   ├── notizen.js      # Notizen-API
│   │   ├── kalender.js     # Kalender-API
│   │   ├── dokumente.js    # Dokumente-API
│   │   ├── ordner.js       # Ordner-API
│   │   ├── workspace.js    # Workspace-API
│   │   ├── api.js          # Dashboard-API
│   │   └── index.js        # Web-Views
│   ├── server.js           # Express-App
│   ├── package.json        # Dependencies
│   └── .env                # Konfiguration
├── frontend/
│   ├── views/
│   │   ├── index.ejs       # Startseite
│   │   ├── login.ejs       # Login-Formular
│   │   ├── register.ejs    # Registrierung
│   │   ├── dashboard.ejs   # Dashboard
│   │   ├── todo.ejs        # Todos
│   │   ├── calendar.ejs    # Kalender
│   │   ├── notes.ejs       # Notizen
│   │   ├── documents.ejs   # Dokumente
│   │   └── partials/       # EJS-Komponenten
│   ├── public/
│   │   ├── css/            # Stylesheets
│   │   └── js/             # Frontend-JavaScript
│   └── ...
└── package.json            # Root-Dependencies
```

## 🧪 Getestete Features

```
✅ Benutzer-Registrierung
✅ Benutzer-Login mit JWT
✅ Todo CRUD
✅ Notiz CRUD
✅ Kalender CRUD
✅ Dokument Upload/Delete
✅ Workspace Management
✅ Ordner Management
✅ Dashboard-Daten-Aggregation
✅ User-Isolation auf allen Endpoints
✅ Bearer Token Auth
✅ Cookie-basierte Auth
```

## 🤝 Mitwirkende

Erstellt von der Copilot-Korrektur-Session

## 📝 Lizenz

MIT License
