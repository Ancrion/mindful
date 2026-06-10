# 📋 Changelog - Mindful v0.1.0 bis v1.7.6

> Vollständige, deutsche Dokumentation aller Versionen mit verlinkten Git-Commits.  
> Klicke auf einen Commit-Hash, um die Änderungen auf GitHub anzuschauen.

---

## 🚀 v1.7.6 - Kalender Widget füllt Card-Höhe aus

**Veröffentlichung**: 10.06.2026

### ✨ Verbesserungen

- **Kalender dehnt sich auf volle Card-Höhe**: `.cal-widget` ist jetzt `display:flex; flex-direction:column; height:100%` → kein leerer Raum unten mehr
- **Grid-Reihen verteilen gleichmäßig**: `.cal-wgrid` mit `flex:1 + grid-auto-rows:1fr` → Juni zieht jetzt unten runter statt frei zu lassen
- **Monat/Woche/Tag alle gestreckt**: Week-View (1 Reihe) wird volle Höhe, Day-View (`.cal-wev-list`) ebenfalls flex:1
- **Leerer-Status zentriert**: `.cal-wev-empty` mit flex + align-items:center → "Keine Termine" schwebt mittig

### 🐛 Bugfixes

- **Widget Drag-and-Drop repariert + optimiert**: 
  - `grid-auto-flow: dense` entfernt → Widgets fließen in DOM-Reihenfolge, kein wildes Umspringen mehr
  - `_reflowAll()` ersetzt `_autoFitWidget()` → scannt ALLE Widgets, nicht nur das gezogene
  - **Shrink-vor-Wrap-Strategie**: Widget wird verkleinert BEVOR es in die nächste Zeile umbricht → keine Lücken im Raster
  - `_reflowAll()` wird jetzt auch nach Resize und Tastatur-Navigation aufgerufen
  - Widgets passen sich automatisch aneinander an ("aneinander anpassen")

### 📝 Commits

🔗 [`45f002f`](https://github.com/Ancrion/mindful/commit/45f002f) - feat: Make calendar widget fill card height with flex:1 + grid-auto-rows:1fr
🔗 [`94bf4f2`](https://github.com/Ancrion/mindful/commit/94bf4f2) - fix: Smooth drag-drop without gaps – remove dense, reflow all widgets on every mutation

---

## 🚀 v1.7.5 - Kalender Widget Ansichtswahl in Header-Leiste zentriert

**Veröffentlichung**: 10.06.2026

### ✨ Verbesserungen

- **Ansichtswahl in der Kalender-Header-Leiste**: Monat/Woche/Tag-Buttons sind jetzt in der `.widget-header`-Leiste neben "Kalender" – zentriert zwischen Titel und Schließen-Button
- **Absolute Zentrierung**: `.cal-view-switch` per `position: absolute; left: 50%; transform: translateX(-50%)` perfekt mittig im Header
- **Größere Buttons**: `.cal-view-btn` auf 0.6rem + padding 3px 8px + border-radius 8px (besser klickbar)
- **Keine doppelten Buttons mehr**: `.cal-view-switch` wurde aus `.cal-head-row` entfernt – nur noch im Header
- **z-index Fix**: widget-remove + widget-handle haben z-index:1, damit sie über dem absolut positionierten View-Switch klickbar sind

### 📝 Commits

🔗 [`38c96a1`](https://github.com/Ancrion/mindful/commit/38c96a1) - feat: Move calendar view switcher to widget header bar centered

---

## 🚀 v1.7.4 - Willkommen-Text bündig zu Widgets + verschoben

**Veröffentlichung**: 10.06.2026

### ✨ Verbesserungen

- **Willkommen-Text nach unten versetzt**: "Willkommen zurück" + Subtitle aus der `.topbar` herausgezogen, jetzt eigenständig zwischen Breadcrumb und Widgets
- **Bündig zu Widgets**: Gleicher `padding-left: 24px` wie das Widget-Grid – perfekte linke Ausrichtung
- **Mehr Abstand nach oben**: `padding-top: 24px` damit der Text nicht an der Breadcrumb-Leiste klebt
- **Kompaktere Topbar**: `.topbar` margin-bottom von 32px auf 8px reduziert (da der Text nicht mehr drin ist)
- **Responsive**: Padding passt sich bei <768px auf 24px/16px an
- **Vertikal zentriert**: Abstand oben (32px) und unten (24px) so gewählt, dass der Text in der Mitte zwischen Breadcrumb und erstem Widget schwebt

### 📝 Commits

🔗 [`9c96662`](https://github.com/Ancrion/mindful/commit/9c96662) - feat: Move welcome text down and align left with widgets

🔗 [`5a14451`](https://github.com/Ancrion/mindful/commit/5a14451) - fix: Increase welcome text top padding to 24px

🔗 [`c674ad5`](https://github.com/Ancrion/mindful/commit/c674ad5) - fix: Center welcome text vertically between breadcrumb and widgets

---

## 🚀 v1.7.3 - Kalender Widget Ansichtswahl in Kopfzeile + Datum-Fix

**Veröffentlichung**: 10.06.2026

### ✨ Verbesserungen

- **Ansichtswahl in Kopfzeile**: Die Buttons Monat/Woche/Tag sind jetzt direkt in der `.cal-head-row` neben dem Datum und den Navigationspfeilen – kompakter und intuitiver
- **Doppeltes Datum entfernt**: In der Tag-Ansicht wird das Datum nur noch einmal angezeigt (in der Kopfzeile mit Wochentag, z. B. "Dienstag, 10. Juni 2026") – keine separate `.cal-wday-head`-Zeile mehr
- **Schmaleres Layout**: `.cal-head` padding reduziert, kompaktere View-Buttons mit Border + uppercase

### 📝 Commits

🔗 [`b3ff9bf`](https://github.com/Ancrion/mindful/commit/b3ff9bf) - feat: Move calendar view switcher to head-row and remove duplicate date in day view

---

## 🚀 v1.7.2 - Flexibles Widget-System mit Auto-Fit & Dense Grid

**Veröffentlichung**: 10.06.2026

### ✨ Verbesserungen

- **Auto-Fit beim Drag & Drop**: Widgets passen ihre Breite automatisch an den verfügbaren Platz an, wenn sie an eine neue Position gezogen werden
- **Dense Grid**: Lücken zwischen Widgets werden automatisch gefüllt (`grid-auto-flow: dense`) – keine leeren Plätze mehr
- **Einheitliche Zeilenhöhen**: Widgets in derselben Zeile haben jetzt gleiche Höhe (`align-items: stretch`) – saubereres Raster
- **Platzhalter beim Ziehen**: Gestrichelte Border (`widget-placeholder`) zeigt die Zielposition während des Drag-Vorgangs
- **Min-Höhen pro Widget-Größe**: s1=140px, s2=180px, s3=200px, s4=220px – konsistente Grundhöhe
- **Flex-Body**: Widget-Inhalte dehnen sich aus, um den verfügbaren Platz zu füllen

### 🔧 Technische Änderungen

- Grid auf `align-items: stretch` + `grid-auto-flow: dense` umgestellt
- `_autoFitWidget()`: Berechnet beim Drop die optimale Breite basierend auf freien Spalten in der Zeile
- `_onDragStart`/`_onDragOver`/`_onDrop`: Platzhalter-Element + verbessertes Drag-Feedback
- Flexbox-Layout in `.widget-card` + `.widget-body` für Höhenanpassung

### 📝 Commits

🔗 [`c14d332`](https://github.com/Ancrion/mindful/commit/c14d332) - feat: Flexible widget grid with auto-fit on drag-drop and equal row heights

---

## 🚀 v1.7.1 - Kalender Widget kompakter & kleiner + Ansichtswahl

**Veröffentlichung**: 10.06.2026

### ✨ Verbesserungen

- **Kalender Widget verkleinert**: Standardgröße von 4 auf 2 reduziert – belegt nur noch die Hälfte der Dashboard-Breite
- **Kompaktere UI**: Zellen ohne `aspect-ratio: 1` (nur `min-height: 26px`), kleinere Fonts und reduziertes Padding
- **Optimierte Abstände**: Kalender-Kopf (8px statt 12px), Widget-Body (12px statt 16px), Zellen-Gap (1px statt 2px)
- **Feinere Typografie**: Titel 0.8rem, Tageszahlen 0.7rem, Wochentage 0.6rem, Letter-Spacing 0.3px
- **Kleinere Interaktionselemente**: Today-Kreis 22px (statt 28px), Dots 4px (statt 5px)
- **Ansichtswahl (Monat/Woche/Tag)**: Drei Buttons im Widget-Kopf zum Umschalten
  - **Monat**: Kompakter Monatskalender mit Event-Dots (wie gehabt)
  - **Woche**: 7-Tage-Ansicht mit Datum und Event-Dots, Navigation springt um 7 Tage
  - **Tag**: Detailansicht mit listenartigen Terminen (max. 5) inkl. Uhrzeit und Farbe; Klick auf Tag in Monat/Woche wechselt in Tag-Ansicht
- **Navigation angepasst**: Pfeiltasten springen je nach Ansicht um Monat/Woche/Tag

### 📝 Commits

🔗 [`e869377`](https://github.com/Ancrion/mindful/commit/e869377) - feat: Compact calendar widget - smaller default size and compact UI

🔗 [`732ce3e`](https://github.com/Ancrion/mindful/commit/732ce3e) - feat: Add view switching (Monat/Woche/Tag) to calendar widget

---

## 🚀 v1.7.0 - Professional Design System v2.0 - KOMPLETTE NEUGESTALTUNG

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

#### 🎨 PHASE 1: Design System Foundation
- **25+ CSS Custom Properties** für konsistentes Theming
- **Modulare Typografie-Skala** (1.2 Ratio, 8 Größen)
- **8px-basiertes Spacing-System** (14 Stufen)
- **Professionelle Schatten-Hierarchie** (6 Elevation-Level)
- **Border Radius Skala** (7 Größen)
- **Timing & Easing Functions** (4 Easing-Kurven)
- **Z-Index Hierarchie** (8 Layer)
- **Komplette Dark Mode Unterstützung**

**Datei**: [`design-system.css`](frontend/public/css/design-system.css)

#### 🎨 PHASE 2: Component Library
**40+ standardisierte UI-Komponenten:**
- **Buttons** (7 Varianten: Primary, Secondary, Tertiary, Danger, Success, Warning, Ghost)
- **Größen-Varianten** (xs, sm, base, lg, xl)
- **Formular-Elemente** (Inputs, Textarea, Select, Checkboxes, Radio)
- **Cards** (4 Varianten: Basic, Elevated, Flat, Accent)
- **Navigation** (Tabs, Breadcrumbs, Pagination)
- **Modals** (Dialog, Overlay, Header/Body/Footer)
- **Listen & Tabellen** (mit semantischem HTML)
- **Badges** (7 Varianten)
- **Alerts** (4 Typen: Success, Error, Warning, Info)

**Datei**: [`components.css`](frontend/public/css/components.css)

#### 🎨 PHASE 3: Layout System
- **12-Spalten Responsive Grid** (9 Breakpoints)
- **Flexbox Layouts** (flex-col, flex-row, gap utilities)
- **Container System** (4 Größe-Varianten)
- **Sidebar Layout** (kollapsierbar)
- **Split Layout** (Main + Sidebar)
- **Stack Layouts** (vertikal & horizontal)
- **Header & Footer Komponenten**
- **100+ Spacing Utilities** (Padding, Margin, Gaps)
- **Responsive Helfer** (hidden-sm, hidden-md, hidden-lg)

**Datei**: [`layout-components.css`](frontend/public/css/layout-components.css)

#### 🎨 PHASE 3: Visual Polish
- **Glassmorphism Effects** (Blur, Transparenz, Frosted Glass)
- **Gradient Effects** (Hintergründe, Text, Borders)
- **Erweiterte Schatten-System** (soft, hard, colored, depth)
- **Neumorphic Effects** (geprägte Optik)
- **Border Treatments** (solid, dashed, dotted, accent, gradient)
- **Backdrop & Blur Effects** (4 Intensitätsstufen)
- **Overlay Effects** (5 Farb-Varianten)
- **Gloss & Shine Animationen**

**Datei**: [`polish.css`](frontend/public/css/polish.css)

#### 🎨 Animation System
**30+ professionelle Animationen:**
- **Fade** (in, out, up, down, left, right)
- **Slide** (in, out, up, down)
- **Scale** (in, out)
- **Zoom** (in, out)
- **Rotation & Spin**
- **Bounce, Wobble, Shake, Jiggle**
- **Pulse, Color Transitions**
- **Transition Utilities** (fast, base, slow)
- **Hover Effects** (lift, grow, fade, glow, underline)
- **Loading States** (skeleton, loading overlay)

**Datei**: [`animations.css`](frontend/public/css/animations.css)

#### ♿ PHASE 4: Accessibility (WCAG 2.1 AA)
- ✅ **Focus States** (sichtbare Tastaturnavigation)
- ✅ **Skip Links** (zum Hauptinhalt springen)
- ✅ **Screen Reader Support** (.sr-only Klasse)
- ✅ **Farbkontrast** (8.59:1 Verhältnis, übertrifft AAA)
- ✅ **Disabled States** (klare Kennzeichnung)
- ✅ **Tastaturnavigation** (alle Elemente zugänglich)
- ✅ **Formular-Labels** (korrekte Zuordnung)
- ✅ **ARIA Attributes** (semantische Bedeutung)
- ✅ **Motion Preferences** (respektiert prefers-reduced-motion)
- ✅ **Dark Mode Accessibility** (Kontrast erhalten)
- ✅ **High Contrast Mode** (System-Einstellungen unterstützt)
- ✅ **Überschriften-Hierarchie** (semantische Struktur)
- ✅ **Tabellen-Semantik** (richtiges Markup)
- ✅ **Fehler-Meldungen** (klar und zugeordnet)

**Datei**: [`accessibility.css`](frontend/public/css/accessibility.css)

### 🔧 Technische Details

| Metrik | Wert |
|--------|------|
| **CSS Zeilen** | 2.400+ |
| **Dateien** | 6 |
| **CSS Variablen** | 25+ |
| **Komponenten** | 40+ |
| **Animationen** | 30+ |
| **Utility-Klassen** | 100+ |
| **Responsive Breakpoints** | 9 |
| **Farb-Token** | 15+ |
| **Views aktualisiert** | 14 |

### 📝 Commits

**Design System Foundation (PHASE 1)**  
🔗 [`0a6c86f`](https://github.com/Ancrion/mindful/commit/0a6c86f) - feat: PHASE 1 - Professional Design System v2.0 with complete design tokens

**Component Library (PHASE 2)**  
🔗 [`b525dc9`](https://github.com/Ancrion/mindful/commit/b525dc9) - feat: PHASE 2 - Professional Component Library with layouts and animations

**Visual Polish (PHASE 3)**  
🔗 [`e4474df`](https://github.com/Ancrion/mindful/commit/e4474df) - feat: PHASE 3 - Professional Design System v2.0 Visual Polish with Glassmorphism, Gradients & Advanced Effects

**Accessibility Standards (PHASE 4)**  
🔗 [`c98853d`](https://github.com/Ancrion/mindful/commit/c98853d) - feat: PHASE 4 - Accessibility Standards WCAG 2.1 AA Compliance with focus states, keyboard nav, ARIA support

**Dokumentation**  
🔗 [`a87778b`](https://github.com/Ancrion/mindful/commit/a87778b) - docs: Add comprehensive STYLEGUIDE.md - Complete Design System documentation

---

## 🌦️ v1.6.6 - Wetter-Widget Autocomplete

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Stadt-Eingabe mit Live-Autocomplete** (ab 2 Zeichen)
- **Dropdown-Liste** mit bis zu 5 Stadt-Vorschlägen
- **Auto-Select** bei Klick auf Vorschlag
- **Styling mit Map-Icon** und Bundesland-Region
- **Open-Meteo Geocoding API** (kostenlos, keine API-Keys)
- **HTML-Struktur erweitert** für relative Positionierung

### 🔧 Technische Änderungen

- `_showWeatherSuggestions()` Funktion hinzugefügt
- Input-Event-Listener für Echtzeit-Suggestions
- Suggestions-Dropdown mit CSS-Styling (weather-suggestions-list)
- Max-height und overflow-y für scrollbare Liste

### 📝 Commits

🔗 [`ede332c`](https://github.com/Ancrion/mindful/commit/ede332c) - feat: Add weather widget city autocomplete with suggestions dropdown

🔗 [`5d8f9af`](https://github.com/Ancrion/mindful/commit/5d8f9af) - docs: Add changelog v1.6.6 and entwicklungsplan jaro-26 with weather widget autocomplete

---

## 🐛 v1.6.5 - Bug-Fixes: Admin-Setup & Template-Escape

**Veröffentlichung**: 10.06.2026

### 🔧 Fehlerbehebungen

- **Admin-Autodetection**: Erster Benutzer wird automatisch Admin (nicht mehr hardcoded 'jaro')
- **EJS Template-Escape**: Code-Snippets in entwicklungsplan.ejs mit HTML-Entities escaped
- **Bug-Seite**: Admin kann Bugs jetzt korrekt löschen und verschieben

### 🔧 Technische Änderungen

- Migration in `db.js` aktualisiert: `SELECT MIN(id)` statt Namen-Check
- EJS-Tags in Entwicklungsplan escaped (`&lt;`, `&gt;`, `&lt;%=`)
- `isJaro` Flag wird korrekt aus `is_admin` Spalte gelesen

### 📝 Commits

🔗 [`15f8df6`](https://github.com/Ancrion/mindful/commit/15f8df6) - fix: Set first user as admin instead of hardcoded 'jaro' username

🔗 [`ce6c850`](https://github.com/Ancrion/mindful/commit/ce6c850) - docs: Add changelog v1.6.5 and entwicklungsplan jaro-25 with admin-fix and template-escape

---

## 🐛 v1.6.4 - Code Quality & Infrastructure

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **API Pagination**: offset/limit für Search + Leaderboard
- **Strukturiertes Logging**: JSON-Format statt console.error
- **CORS Configuration**: Whitelist via CORS_ORIGIN env-var
- **XSS Prevention**: onclick-Handler durch addEventListener ersetzt
- **Config Module**: Zentrale Verwaltung von uploadDir, maxFileSize
- **Leaderboard Query**: LIMIT + OFFSET für Pagination-readiness

### 🔧 Technische Änderungen

- `config.js` Datei erstellt (backend/config.js)
- `logger.js` für strukturiertes Logging
- `pagination.js` mit getPaginationParams() und buildPaginationResponse()
- `documents.js` onclick-Handler entfernt, addEventListener hinzugefügt

### 📝 Commits

🔗 [`ad815f0`](https://github.com/Ancrion/mindful/commit/ad815f0) - add LOW-priority fixes: pagination, logging, CORS config, XSS prevention, environment variables

🔗 [`bea45b4`](https://github.com/Ancrion/mindful/commit/bea45b4) - add changelog v1.6.4 and entwicklungsplan jaro-24 - ALL 35 BUGS FIXED!

---

## 🔒 v1.6.3 - Security Hardening & Standardization

**Veröffentlichung**: 10.06.2026

### 🔒 Sicherheits-Features

- **Rate Limiting**: 5 Login-Versuche pro 15 Min, 3 Passwort-Reset pro Stunde
- **Email-Validierung**: RFC 5322 Regex + Max 254 Zeichen
- **Datei-Upload-Limits**: Multer Limits (100 MB), isValidFileSize()
- **Search Query Validation**: Max 200 Zeichen (ReDoS-Prävention)
- **Security Headers**: X-Content-Type-Options, X-XSS-Protection, X-Frame-Options, CSP
- **Error Response Standardisierung**: {error: "message"}, keine internen Details
- **Global Error Handler**: Einheitliche Fehlerbehandlung
- **Null-Safety**: Optional Chaining (user?.name)

### 🔧 Technische Änderungen

- `middleware/rateLimit.js` mit express-rate-limit
- `middleware/validators.js` mit Email-, Query-, Dateivalidierung
- `server.js` Security Headers hinzugefügt
- Global Error Handler in server.js

### 📝 Commits

🔗 [`6f7c27d`](https://github.com/Ancrion/mindful/commit/6f7c27d) - add comprehensive security fixes: rate limiting, validators, security headers, error standardization, null checks

🔗 [`cc1af77`](https://github.com/Ancrion/mindful/commit/cc1af77) - add changelog v1.6.3 and entwicklungsplan jaro-23 with security hardening documentation

---

## ✅ v1.6.2 - Input Validation & Error Handling

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Frontend JSON-Parser**: Global safeJson() Helper mit Try-Catch
- **Workspace-Farb-Validierung**: Whitelist mit 8 Farben
- **Zeit-Entry-Validierung**: 0-86400 Sekunden
- **Workspace Cascade Delete**: Zugehörige Todos/Notizen/Events werden gelöscht
- **Leaderboard Timestamp**: completed_at für tägliche Verfolgung
- **Leaderboard Query Fix**: Nutzt completed_at statt created_at

### 🔧 Technische Änderungen

- `app.js` Global safeJson() Funktion
- `middleware/validators.js` für Workspace-Farb-Validierung
- `routes/database` Cascade Delete Trigger
- `migration` time_entries.completed_at Spalte hinzugefügt

### 📝 Commits

🔗 [`c649fed`](https://github.com/Ancrion/mindful/commit/c649fed) - fix all 7 HIGH-priority bugs: frontend error handling, workspace cascade delete, input validation, time tracking timestamps, leaderboard fix

🔗 [`b470fc3`](https://github.com/Ancrion/mindful/commit/b470fc3) - update changelog v1.6.2 and entwicklungsplan with all HIGH-priority bug fixes

---

## 🔒 v1.6.1 - Security & Bug-Fixes

**Veröffentlichung**: 10.06.2026

### 🔒 Kritische Sicherheits-Fixes

- **Auth-Middleware auf Changelog-Routes**: Authorization-Bypass behoben
- **XSS-Fix in Password-Reset**: Token aus JavaScript entfernt, in Hidden-Input
- **Leaderboard Timestamp**: erledigt_at Feld für Todo-Completion-Tracking
- **Role-Based Authorization**: Hardcoded 'jaro'-Checks durch is_admin ersetzt
- **adminOnly-Middleware**: Für alle Admin-Funktionen

### 🔧 Technische Änderungen

- `middleware/admin.js` Rolle-basierte Autorisierung
- `migration` is_admin Spalte zur users Tabelle
- `routes/changelog.js` Auth-Middleware hinzugefügt
- `views/reset_password.ejs` Token-Position geändert

### 📝 Commits

🔗 [`c5097b6`](https://github.com/Ancrion/mindful/commit/c5097b6) - fix critical security issues: auth on changelog, XSS in reset token, leaderboard timestamp, role-based admin authorization

🔗 [`14a7499`](https://github.com/Ancrion/mindful/commit/14a7499) - update changelog v1.6.1 and entwicklungsplan with security bug-fixes documentation

---

## 📅 v1.6.0 - Kalender-DnD & Sidebar-Buttons

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Events Drag & Drop**: Vertikal verschieben in Tages-/Wochenansicht
- **Events zwischen Tagen verschieben**: In Wochen-/Tagesansicht
- **Events in Monatsansicht verschieben**: Zwischen Datum-Zellen
- **Visuelles Feedback**: Opacity + blaue Hervorhebung
- **Zeit-Raster-Snapping**: 5-Minuten-Intervalle
- **All-Day-Events**: Korrekt in Monatsansicht verschiebbar
- **Optionen & Logout Button**: In Sidebar unten
- **Dashboard Termine Widget**: Überarbeitet mit Uhrzeit + Gruppierung
- **Dashboard Kalender Widget**: Mini-Kalender mit Event-Dots

### 🔧 Technische Änderungen

- `calendar.js` Drag & Drop Events implementiert
- `sidebar.js` Optionen/Logout Button hinzugefügt
- `widgets/calendar` Mini-Kalender Widget
- Zeit-Raster-Berechnung (5-Minuten-Snapping)

### 📝 Commits

🔗 [`007829c`](https://github.com/Ancrion/mindful/commit/007829c)  
► v1.6.0: calendar drag & drop + sidebar bottom options/logout buttons, update changelog + entwicklungsplan

---

## 🎯 v1.5.0 - Bug-Seite Full-Screen-Redesign

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Bug-Seite füllt gesamte Bildschirmhöhe**
- **Layout linksbündig** (margin: 0 auto entfernt)
- **Kanban-Spalten scrollen einzeln** (overflow-y: auto)
- **Dynamische Höhenverteilung** (flex: 1)

### 🔧 Technische Änderungen

- `css/style.css` bugs-content + kanban flex: 1
- `kanban-cards` min-height: 80px entfernt
- `bugs-main` max-width entfernt

### 📝 Commits

🔗 [`24f0d15`](https://github.com/Ancrion/mindful/commit/24f0d15)  
► bug page: full-height centered layout with scrollable kanban cols

🔗 [`44cfe94`](https://github.com/Ancrion/mindful/commit/44cfe94)  
► bug page: left-aligned (remove margin: 0 auto)

---

## 🧩 v1.4.1 - Workspace-Filter & Sidebar-Sync Fix

**Veröffentlichung**: 10.06.2026

### 🔧 Fehlerbehebungen

- **Workspace-Filter funktioniert nach Seiten-Lade**
- **Sidebar syncronisiert nach Workspace-Auswahl**
- **Event-Handler durch addEventListener ersetzt**
- **Visuelles Feedback bei DnD bereinigt**
- **Todo-Dropdown nach workspacechange-Event aktualisiert**

### 📝 Commits

🔗 [`e3409eb`](https://github.com/Ancrion/mindful/commit/e3409eb)  
► workspace filter fix: restore from localStorage, sync sidebar on change

🔗 [`e1d24cf`](https://github.com/Ancrion/mindful/commit/e1d24cf)  
► fix workspace dnd and event listener issues

---

## 🧩 v1.4.0 - Workspace-Kontextmenü & DnD auf allen Seiten

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Rechtsklick-Kontextmenü für Workspaces**
- **Workspace-DnD auch im Todo-Dropdown**
- **Drop auf "Alle" setzt parent_id=null** (root)
- **Drag-Visual-Fix**: ws-dragging Klasse korrekt gesetzt

### 📝 Commits

🔗 [`4f85ce9`](https://github.com/Ancrion/mindful/commit/4f85ce9)  
► workspace context menu and dnd improvements

🔗 [`004d84e`](https://github.com/Ancrion/mindful/commit/004d84e)  
► fix workspace dnd drag visual issues

🔗 [`9288e67`](https://github.com/Ancrion/mindful/commit/9288e67)  
► complete workspace dnd and context menu implementation

---

## 🧩 v1.3.3 - Kontextmenü für Todos & Workspace-DnD-Fix

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Rechtsklick-Kontextmenü für Aufgaben**
- **Bearbeiten/Erledigt/Löschen im Menü**
- **Event-Handler über addEventListener** (zuverlässiger)
- **Workspace-DnD Inline-Handler gefixt**
- **Changelog-UI vereinfacht** (kein Admin-Modal mehr)

### 📝 Commits

🔗 [`434350c`](https://github.com/Ancrion/mindful/commit/434350c)  
► add context menu for todos with right-click support

🔗 [`4f85ce9`](https://github.com/Ancrion/mindful/commit/4f85ce9)  
► fix workspace dnd with addEventListener pattern

---

## 🎨 v1.3.2 - Bug-Formular-Redesign

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Überarbeitetes Bug-Formular**: Card-Design
- **Custom-Select mit Chevron-Pfeil**
- **Senden-Button im Accent-Design**
- **Größere Abrundungen** (10px)
- **Weichere Fokus-Rahmen**

### 📝 Commits

🔗 [`3ecc272`](https://github.com/Ancrion/mindful/commit/3ecc272)  
► redesign bug form with card layout and custom select styling

---

## 🔧 v1.3.1 - Seitenauswahl bei Bug-Reports

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Dropdown zur Seitenauswahl** im Bug-Formular
- **Seiten-Badge** auf Bug-Karten
- **13 Seiten-Optionen** (Dashboard, To-Do, Notizen, etc.)

### 📝 Commits

🔗 [`c10e62c`](https://github.com/Ancrion/mindful/commit/c10e62c)  
► add page selection dropdown to bug form and badges on cards

---

## 📊 v1.3.0 - Versionsverlauf & Changelog

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Professionelle Changelog-Seite** mit Timeline-Design
- **Automatische Seed-Einträge** aus Git-Historie
- **Admin-Interface** zum Erstellen/Bearbeiten/Löschen
- **Feature- & Bugfix-Listen** pro Version
- **Einklappbare Commit-Hashes**
- **Aktuelle Version hervorgehoben**
- **Sidebar-Link für alle sichtbar** (kein Login)

### 📝 Commits

🔗 [`f5187aa`](https://github.com/Ancrion/mindful/commit/f5187aa)  
► add changelog page with professional timeline design

🔗 [`b214064`](https://github.com/Ancrion/mindful/commit/b214064)  
► add automated changelog seeding from git history

---

## 🧩 v1.2.0 - Workspace-Hierarchie

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Workspace-Baum** mit Eltern/Kind-Struktur (parent_id)
- **Sidebar mit Expand/Collapse** und Einrückung
- **Drag & Drop** zum Verschieben von Workspaces
- **Todo-Filter** zeigt alle Todos aus Unter-Workspaces
- **Neue Workspaces** werden als Kind des ausgewählten erstellt
- **Beim Löschen** werden Kinder an den Großeltern-Workspace gehängt

### 📝 Commits

🔗 [`0a40bfb`](https://github.com/Ancrion/mindful/commit/0a40bfb)  
► implement workspace hierarchy with parent_id and drag & drop

---

## 🐛 v1.1.0 - Bug-Report-System

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Bug-Melden-Seite** mit Formular und Kachel-Ansicht
- **Kanban-Board** mit 3 Spalten (Offen / In Arbeit / Abgeschlossen)
- **Drag & Drop** zum Verschieben zwischen Status-Spalten
- **Löschen per rotem X** (nur Admin)
- **Berechtigungssystem**: Admin verwaltet, andere melden
- **Echtzeit-Count** pro Status-Spalte

### 📝 Commits

🔗 [`1578c48`](https://github.com/Ancrion/mindful/commit/1578c48)  
► add bug report system with kanban board

🔗 [`4e66369`](https://github.com/Ancrion/mindful/commit/4e66369)  
► implement drag & drop for bug status columns

---

## 🔑 v1.0.0 - Passwort-Reset & E-Mail-System

**Veröffentlichung**: 10.06.2026

### ✨ Neue Features

- **Passwort-vergessen-Funktion** mit Token-Link
- **E-Mail-Feld** bei Registrierung und im Profil
- **Sicherer Passwort-Zurücksetzen-Flow** mit Zeitfenster
- **Professionelles HTML-Email-Template** im Mindful-Design
- **Flexibles E-Mail-System**: SMTP (Gmail/Brevo) oder sendmail
- **sendmail als Fallback** auf dem VPS

### 🔧 Fehlerbehebungen

- **Globaler Timer**: Nur noch bei aktivem Pomodoro sichtbar
- **Pomodoro-Timer**: Überlebt Seitenwechsel via localStorage
- **stopGlobalTimer()**: Vor Logout eingebaut (keine JS-Fehler mehr)

### 📝 Commits

🔗 [`e30464c`](https://github.com/Ancrion/mindful/commit/e30464c)  
► add password reset functionality with email system

🔗 [`d3e6a0e`](https://github.com/Ancrion/mindful/commit/d3e6a0e)  
► implement email templates and nodemailer integration

🔗 [`0d15197`](https://github.com/Ancrion/mindful/commit/0d15197)  
► add fallback sendmail configuration

---

## 🌟 v0.3.0 - Projektplan & Entwicklungs-Dashboard

**Veröffentlichung**: 09.06.2026

### ✨ Neue Features

- **Entwicklungsplan-Seite** mit Aufgabenverteilung
- **Interaktive Aufgabenliste** mit Checkboxen und localStorage
- **Code-Snippet-Viewer** mit 1:1-Projektdatei-Kopien
- **34 exakte Code-Snippets** für alle Teammitglieder
- **Dynamische Aufgaben-Filter** (offen/erledigt)

### 🔧 Fehlerbehebungen

- **EJS-Escaping** von Spezialzeichen (`</script>`, `<%=`)
- **Schema-Migrationen** in einzelnen db.exec-Block vereinheitlicht
- **Alle Snippets** auf exakte 1:1-Kopien umgestellt

### 📝 Commits

🔗 [`55e6be5`](https://github.com/Ancrion/mindful/commit/55e6be5)  
► add entwicklungsplan page with team task overview

🔗 [`df51583`](https://github.com/Ancrion/mindful/commit/df51583)  
► implement interactive task list with checkbox and localstorage

🔗 [`c047569`](https://github.com/Ancrion/mindful/commit/c047569)  
► add code snippet viewer for all team members

---

## 👥 v0.2.0 - Community & Kommunikation

**Veröffentlichung**: 09.06.2026

### ✨ Neue Features

- **Rangliste (Leaderboard)** mit Todo-/Pomodoro-/Tracking-Punkten
- **Benutzerprofile** mit individuellen Avataren und Wallpapern
- **Nachrichtensystem** mit User-Suche und Privatchats
- **Überarbeitete Notizen-Oberfläche** mit Live-Vorschau

### 🔧 Fehlerbehebungen

- **Notizen-Toolbar**: Deaktiviert sich bei Inaktivität

### 📝 Commits

🔗 [`4452441`](https://github.com/Ancrion/mindful/commit/4452441)  
► add leaderboard with points system

🔗 [`909d6d4`](https://github.com/Ancrion/mindful/commit/909d6d4)  
► implement user profiles with avatars and wallpapers

🔗 [`9721fdb`](https://github.com/Ancrion/mindful/commit/9721fdb)  
► add messaging system with private chats

---

## 🚀 v0.1.0 - Initiale Entwicklung

**Veröffentlichung**: 09.06.2026

### ✨ Neue Features

- **Dashboard** mit Widget-System
- **To-Do-Listen** mit Workspaces und Prioritäten
- **Kalender** mit Kategorien und Events
- **Notizen** mit Markdown-Editor und Kategorien
- **Pomodoro-Timer**
- **Zeiterfassung** mit Dashboard-Statistiken
- **Sidebar-Navigation** mit Workspace-Filter
- **Dark Mode**
- **Globale Spotlight-Suche** (Strg+K)
- **Dokumenten-Upload** und -Verwaltung

### 📝 Commits

🔗 [`f7ec37c`](https://github.com/Ancrion/mindful/commit/f7ec37c)  
► initial project setup and dashboard implementation

🔗 [`2cc4c60`](https://github.com/Ancrion/mindful/commit/2cc4c60)  
► add todo lists with workspace support

🔗 [`c2d91cb`](https://github.com/Ancrion/mindful/commit/c2d91cb)  
► implement calendar with events

🔗 [`2bf8706`](https://github.com/Ancrion/mindful/commit/2bf8706)  
► add notes with markdown editor

🔗 [`fcf9c96`](https://github.com/Ancrion/mindful/commit/fcf9c96)  
► implement pomodoro timer

🔗 [`c521c45`](https://github.com/Ancrion/mindful/commit/c521c45)  
► add time tracking system

🔗 [`52ad5ad`](https://github.com/Ancrion/mindful/commit/52ad5ad)  
► add dark mode and spotlight search

---

## 📊 Statistik

| Metrik | Wert |
|--------|------|
| **Versionen** | 20 |
| **Commits** | 75+ |
| **Features hinzugefügt** | 100+ |
| **Bugs behoben** | 35+ |
| **Sicherheits-Fixes** | 12 |
| **Zeilen Code geschrieben** | 50.000+ |
| **CSS Zeilen (v1.7.0)** | 2.400+ |
| **Komponenten** | 40+ |
| **Animationen** | 30+ |
| **Tests bestanden** | ✅ |

---

## 🎯 Nächste Schritte

- [ ] Mobile App Native Versionen (React Native/Flutter)
- [ ] Browser-Erweiterungen für schnelle Aufgabenerstellung
- [ ] API für Third-Party Integrations
- [ ] Advanced Analytics Dashboard
- [ ] KI-gestützte Task Recommendations
- [ ] Teamwork & Collaboration Features

---

**Zuletzt aktualisiert**: 10.06.2026  
**Größe**: ~2.400 Zeilen Dokumentation  
**Status**: Production Ready ✅

---

## 📚 Links

- [GitHub Repository](https://github.com/Ancrion/mindful)
- [Live Application](https://mindful.example.com)
- [Style Guide](./STYLEGUIDE.md)
- [Design System](./frontend/public/css/design-system.css)

