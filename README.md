# Morph

**Morph** passt Lernmaterial an die Bedürfnisse und Lernziele
einer Person an, ohne den fachlichen Inhalt zu verändern.

## Demo

Die Anwendung ist unter
[binnendifferenzierung.online](https://binnendifferenzierung.online/) verfügbar.

[![Startseite von Morph](doc/startseite.png)](https://binnendifferenzierung.online/)

## Grundidee

### Problem

Lernmaterial liegt meist in einem festen Format vor. Dieses Format kann für
Lernende, beispielsweise mit Legasthenie oder ADHS, eine zusätzliche Barriere
darstellen.

### Lösungsansatz

Nicht die Lernenden passen sich dem Werkzeug an, sondern das Werkzeug passt sich
den Lernenden an. Aus Lernmaterial, Lernziel und persönlichem Profil entsteht
eine passende Softwarelösung direkt im Browser. Forschungsergebnisse und die
Erfahrungen der lernenden Person fließen in den Vorschlag ein.

Der fachliche Inhalt bleibt erhalten; nur seine Darstellung und Interaktion
ändern sich.

### Beispiele

- Lange Texte werden in kurze, überschaubare Abschnitte gegliedert.
- Eine Videovorlesung wird über eine Chat-Oberfläche erschlossen.
- Eine Browser-Erweiterung formatiert besuchte Seiten passend zum Lernprofil.

Die Lernenden müssen die konkrete Lösung nicht selbst entwerfen. Sie beschreiben
ihre Situation und das gewünschte Lernziel; die Anwendung schlägt eine passende
Form vor und erzeugt sie.

Weitere Informationen zur Entwicklung der Grundidee stehen in
[doc/process.md](doc/process.md).

## Funktionsweise

1. Lernende geben ihr Lernziel, ihr Lernmaterial und Angaben zu ihrem Profil an.
2. Die KI ermittelt geeignete Unterstützung und schlägt eine Lösung vor.
3. Die Anwendung erzeugt daraus eine generative Benutzeroberfläche im Browser.

Der ausführliche fachliche Ablauf steht in der
[Lösungsstrategie](doc/architecture/04-loesungsstrategie.md).

## Quickstart

```sh
# Terminal 1 – Server
cd server
uv sync
cp .env.example .env   # Hermes-Zugangsdaten vom Team eintragen
uv run --env-file .env fastapi dev

# Terminal 2 – Client
cd client
npm install
npm run dev
```

Details und zusätzliche Optionen:

- [Client einrichten und starten](client/README.md)
- [Server einrichten und starten](server/README.md)

## Projektstruktur

Das Projekt ist als **Monorepo** organisiert: Frontend, Backend und
Dokumentation werden gemeinsam in diesem Repository versioniert.

| Ordner | Inhalt |
| --- | --- |
| `client/` | Web-Frontend. Setup und Scripts: [client/README.md](client/README.md) |
| `server/` | API. Setup und Start: [server/README.md](server/README.md) |
| `doc/` | Prozess und Architektur |

Der fachliche Ablauf steht in der [Lösungsstrategie](doc/architecture/04-loesungsstrategie.md): Lernziel, Charakter / KI-Zwilling, Lernpfadkarte, generative UI, Prüfung.

## Schnellstart

Voraussetzungen: [uv](https://docs.astral.sh/uv/) und Node 24 (siehe `client/.nvmrc`).

Server (Terminal 1):

```sh
cd server
cp .env.example .env   # HERMES_BASE_URL, HERMES_API_KEY und ACCESS_CODE eintragen
uv sync
uv run --env-file .env fastapi dev --no-proxy-headers
```

Client (Terminal 2):

```sh
cd client
npm ci
npm run dev
```

Der Vite-Dev-Server leitet `/api` an den Server auf Port 8000 weiter. Hermes zwischen Laptop und Team-VM umschalten: nur `HERMES_BASE_URL` und `HERMES_API_KEY` in `server/.env` ändern.

## CI

Ein CI-Workflow ist in Arbeit. Bis dahin die Prüfungen lokal ausführen:

```sh
cd client && npm run check   # Type-check, Lint, Format, Tests
cd server && uv run pytest   # Tests
```

## Techstack

Frontend:
- TypeScript
- React

Backend:
- Python
- FastAPI

AI Layer:
- Hermes Agent: agentischer Harness von Nous Research, angebunden über sein OpenAI-kompatibles Gateway. Hermes recherchiert mit Web-Tools und schreibt den Code, der das Material der Lernenden umformt.
- DeepSeek (Sprachmodell hinter Hermes)

## Dokumentation

Einen Überblick über die Dokumente in `doc/` bietet die
[Dokumentationsübersicht](doc/README.md).

## Werkzeuge

Dokumentation der Werkzeuge, Hilfsmittel und Abläufe, die Entwicklung und Lernen in diesem Repository unterstützen.

### Einstieg

1. Repository klonen.
2. Diesen Abschnitt lesen, um die verfügbaren Werkzeuge und ihre Nutzung zu kennen.
3. Die werkzeugspezifischen Abschnitte unten nutzen, sobald sie ergänzt werden.

### Werkzeugindex

| Werkzeug | Zweck | Status |
| --- | --- | --- |
| Claude Code | Entwicklung | im Einsatz |
| OpenCode | Entwicklung | im Einsatz |
| Hermes | Entwicklung | im Einsatz |
| Cursor | Entwicklung | im Einsatz |
| IntelliJ IDEA | Entwicklung | im Einsatz |
| VSCode | Entwicklung | im Einsatz |

## Team

- Abdelrahman Ahmed
- Ammar Ansari
- Artifical Intelligence ;-)
- Chirag Singal
- Halit Boyar
- Jai Vasanthan
- Jens Frahne
- Kai Krah
- Nils Schmidt
- Simon Hügel
- Tobias Tullius

## Mitwirken

Beim Hinzufügen eines neuen Werkzeugs:

1. Zweck und Nutzung in dieser Datei dokumentieren.
2. Setup-Schritte, Umgebungsvariablen und Abhängigkeiten nennen.
3. Beispiele kurz und, wo möglich, ausführbar halten.
