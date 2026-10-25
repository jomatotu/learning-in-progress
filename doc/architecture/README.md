# Architektur

Diese Dokumentation beschreibt die Softwarearchitektur von **Learning in Progress** nach [arc42](https://arc42.org/). Sie hält den aktuellen Stand, getroffene Entscheidungen und noch offene Architekturfragen fest. Die fachliche Grundlage bilden die [Produktidee](../../README.md#grundidee) und ihre [Herleitung](../process.md).

## Überblick

Learning in Progress passt die Darstellung von Lernmaterial an das Profil und Lernziel einer Person an, ohne den fachlichen Inhalt zu verändern. Aus Lernziel und Rohdaten entstehen ein Charakter beziehungsweise KI-Zwilling, eine Lernpfadkarte und schließlich eine generative Benutzeroberfläche im Browser.

## Kapitel

| Kapitel | Inhalt |
| --- | --- |
| [1. Einführung und Ziele](01-einfuehrung-und-ziele.md) | Aufgabenstellung, Qualitätsziele, Stakeholder |
| [2. Randbedingungen](02-randbedingungen.md) | Monorepo, Techstack, Hackathon, Konventionen |
| [3. Kontextabgrenzung](03-kontextabgrenzung.md) | Lernende, Wissens- und Forschungsquellen; Browser, Hermes-Agent, KI-APIs, Kontextwissen |
| [4. Lösungsstrategie](04-loesungsstrategie.md) | Zuordnung von Ablauf und Zielen zu Frontend, Backend und generativer UI |
| [5. Bausteinsicht](05-bausteinsicht.md) | Frontend, Backend mit API und Orchestrierung, AI Layer |
| [6. Laufzeitsicht](06-laufzeitsicht.md) | Lernmaterial anpassen, Lernpfad erzeugen |
| [7. Verteilungssicht](07-verteilungssicht.md) | Browser, Backend-Dienst, externer KI-Dienst; Deployment offen |
| [8. Querschnittliche Konzepte](08-querschnittliche-konzepte.md) | Generative UI, Domäne, Persistenz, Datenschutz, Sicherheit, Fehlerbehandlung |
| [9. Architekturentscheidungen](09-architekturentscheidungen.md) | Monorepo, Techstack, generative UI und Fokus auf den Lernprozess |
| [10. Qualitätsanforderungen](10-qualitaetsanforderungen.md) | Qualitätsbaum und Szenarien, noch offen |
| [11. Risiken und technische Schulden](11-risiken-und-technische-schulden.md) | KI-Schicht, generative UI, sensible Daten, breiter Lösungsraum |
| [12. Glossar](12-glossar.md) | Zentrale Begriffe der Fachlichkeit und Architektur |

## Aktueller Stand

Die Architektur befindet sich noch in Entwicklung. Insbesondere Qualitätsanforderungen, Persistenz, Datenschutz, Sicherheit, Fehlerbehandlung, Deployment und Coding-Standards sind noch nicht abschließend festgelegt. Die jeweiligen Kapitel kennzeichnen diese Punkte ausdrücklich als offen.
