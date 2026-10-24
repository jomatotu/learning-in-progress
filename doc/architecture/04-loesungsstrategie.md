# 4. Lösungsstrategie

Der fachliche Ablauf ist Lernziel → Charakter / KI-Zwilling → Lernpfadkarte → Generative UI. Rohdaten fließen in den Charakter. Der Ablauf bereitet auf die Prüfung vor, die Prüfung selbst ist aber nicht im Fokus und kein Teil des Systems ([1.1 Aufgabenstellung](01-einfuehrung-und-ziele.md#11-aufgabenstellung), [AE-6](09-architekturentscheidungen.md)).

Ausgeführt ist der Ablauf in [6.2 Lernpfad erzeugen](06-laufzeitsicht.md#62-lernpfad-erzeugen), getragen von den Bausteinen in [5.3 Whitebox Orchestrierung](05-bausteinsicht.md#53-whitebox-orchestrierung). Der ursprüngliche Ablauf aus der Grundidee (Anmelden, Basisinformationen, Recherche, Lösungsvorschlag) steht in [6.1 Lernmaterial anpassen](06-laufzeitsicht.md#61-lernmaterial-anpassen).

| Ziel / Aufgabe | Lösungsansatz |
| --- | --- |
| Lernziel und Rohdaten aufnehmen | Web-Frontend (React, TypeScript) |
| Charakter, Lernpfadkarte und Oberfläche erzeugen | Backend (FastAPI) orchestriert die KI-Schicht (Gemini; Techstack wird umgebaut) |
| Lernpfadkarte als Oberfläche ausliefern | Generative UI im Browser |
| Großen Lösungsraum eingrenzen | Personas, siehe [Prozess](../process.md#fokussierung) |
