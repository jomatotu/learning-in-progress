# learning-in-progress

Monorepo for Morph.

[![Startseite von Learning in Progress](doc/startseite.png)](https://binnendifferenzierung.online/)

Die Anwendung: [binnendifferenzierung.online](https://binnendifferenzierung.online/)

## Grundidee

Lernende mit Herausforderungen wie Legasthenie oder ADHS haben oft Schwierigkeiten, weil ihr Lernmaterial in einem festen Format kommt, das nicht zu ihrer Art zu lernen passt. Unsere App dreht das um: Nicht die Lernenden passen sich dem Werkzeug an, sondern das Werkzeug passt sich den Lernenden an.

Die Lernenden laden ihr Material hoch und erzählen uns von sich: ihre Herausforderungen, ihre Ziele und alles, von dem sie bereits wissen, dass es für sie funktioniert.

Unsere KI recherchiert, was Menschen mit diesem Profil nachweislich hilft, und schlägt eine Lösung vor. Dann baut sie diese Lösung direkt im Browser, mit generativer UI.

Beispiele: lange Texte in kurze Abschnitte zerlegt, eine Chat-Oberfläche für Videovorlesungen oder eine Browser-Erweiterung, die jede besuchte Seite neu formatiert. Wir bauen eine Lösung, die Lösungen baut. Die Lernenden müssen nie wissen, wie die Lösung aussehen soll. Sie beschreiben das Problem, wir schlagen vor und wir bauen.

In einem Satz: Wir verwandeln die Bedürfnisse der Lernenden in funktionierende Software, fundiert in Forschung und ihrer eigenen Realität. Am Wissen ändert sich nichts, nur die Form, in der es ankommt. Wir glauben, dass die meisten Lernbarrieren nicht NUR an der Fähigkeit liegen, SONDERN AUCH an der Diskrepanz zwischen einer Person und dem Format, das ihr gegeben wurde, um ihr Lernziel zu erreichen. Unsere Lösung baut für die Welt, die auf deinen Bildschirm passt :)

Wenn die Technologie von heute so flexibel ist, warum sind wir dann so darauf aus, die Lernenden zu verbiegen?

Weitere Informationen zur Entwicklung der Grundidee findest du unter [doc/process.md](doc/process.md).

## Dokumentation

Überblick über die Dokumente in `doc/`: [doc/README.md](doc/README.md).

## Aufbau

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

## Techstack

Frontend:
- TypeScript
- React

Backend:
- Python
- FastAPI

AI Layer:
- Hermes Agent: agentischer Harness von Nous Research, angebunden über sein OpenAI-kompatibles Gateway. Hermes recherchiert mit Web-Tools und schreibt den Code, der das Material der Lernenden umformt.

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
| Cursor | Entwicklung | im Einsatz |
| IntelliJ IDEA | Entwicklung | im Einsatz |
| VSCode | Entwicklung | im Einsatz |

### Mitwirken

Beim Hinzufügen eines neuen Werkzeugs:

1. Zweck und Nutzung in dieser Datei dokumentieren.
2. Setup-Schritte, Umgebungsvariablen und Abhängigkeiten nennen.
3. Beispiele kurz und, wo möglich, ausführbar halten.
