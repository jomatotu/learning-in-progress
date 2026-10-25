# 8. Querschnittliche Konzepte

| Konzept | Stand |
| --- | --- |
| Generative UI | Zwei Formen, siehe [8.1](#81-generative-ui). Führend ist HTML in einer Sandbox. Die Solution Page bleibt der zweite Pfad. |
| Fachliche Domäne | Profil, Lernmaterial, Lösungsvorschlag. Modell ist offen. |
| Persistenz | Entschieden. Ablage nur im Browser der lernenden Person. Siehe [8.3](#83-persistenz-und-datenschutz). |
| Datenschutz | Sensible Profildaten, Freitext und erzeugtes HTML dürfen als gerätelokale Arbeitskopie im Browser liegen. Siehe [8.3](#83-persistenz-und-datenschutz). |
| Sicherheit | Authentifizierung, Autorisierung und Schutz der KI-Schnittstelle sind offen. |
| Fehlerbehandlung | Wahrnehmbarkeit langer Läufe, Robustheit bei Abbruch und Wiederherstellbarkeit: [Kapitel 10](10-qualitaetsanforderungen.md). |
| Internationalisierung | Dokumentation ist deutsch. Die Oberfläche gibt es auf Deutsch und Englisch, siehe [8.2](#82-internationalisierung). |

## 8.1 Generative UI

Entscheidung [AE-7](09-architekturentscheidungen.md): Beide Formen bleiben. Führend ist die HTML-Lernseite. Die Solution Page bleibt über „Magische Seite“ erreichbar. Vergleich von Erzeugung, Auslieferung, Route und Sicherheitsgrenze: [5.4](05-bausteinsicht.md#54-generative-ui). Abläufe: [6.3](06-laufzeitsicht.md#63-auslieferung).

Die HTML-Lernseite ist vom Rest der Anwendung getrennt. Das `iframe` erlaubt Skripte, aber nicht denselben Origin. Die vom Server eingesetzte Content Security Policy verbietet Netzzugriff und Formularziele. Die Solution Page hat diese Grenze nicht: Die erzeugte React-Komponente läuft als Teil der Anwendung. Ob diese Grenze ausreicht und welche Inhalte zulässig sind, bleibt die offene Prüfung in [ARCH-CLIENT-06](client-abgleich.md). Risiko [R-1](11-risiken-und-technische-schulden.md) ist damit eingegrenzt, aber nicht geschlossen.

## 8.2 Internationalisierung

### Implementiert

Die Oberfläche unterstützt Deutsch und Englisch. Deutsch ist die Voreinstellung, solange nichts anderes gespeichert ist. Die Umschaltung `DE | EN` in der oberen Leiste gilt für die ganze Seite. Die Wahl steht in `localStorage` unter dem Schlüssel `language` und gilt beim nächsten Besuch wieder. Das Dokument setzt `lang` auf `de` oder `en`.

Feste Texte der Produktseiten liegen je Komponente in beiden Sprachen. Der Fragebogen folgt der gewählten Sprache über `GET /api/survey?lang=`. Gespeicherte Profilwerte bleiben sprachneutral; übersetzt wird nur die Anzeige.

### Offen

Die Sprache erzeugter Inhalte ist nicht entschieden. Hermes-Fragen, Theme-Begründungen und generierte Lernseiten erhalten die UI-Sprache nicht. Die Generierungsprompts nennen dafür uneinheitlich die Sprache des Profils oder des Materials; das ist keine festgehaltene Entscheidung. Die angezeigten Theme-Titel sind fest Englisch. Playground und der Fallback des Hermes-Fortschritts sind ebenfalls einsprachig.

## 8.3 Persistenz und Datenschutz

Lernendendaten bleiben auf dem Gerät. Das Produkt hat keine Anmeldung und keinen Datenbestand beim Betreiber. Name, Lernphase, Interessen, Ziel, Freitext-Material, Fragebogen- und Assessment-Antworten, Notizen und erzeugtes HTML dürfen im Browser-Speicher liegen. Diese Ablage ist die Arbeitskopie, mit der ein Tab neu geladen und ein Lernlauf in einem weiteren Tab geöffnet werden kann.

Der Formularentwurf liegt in `sessionStorage`. Ein Neuladen des Tabs behält die Eingaben. Dateiobjekte schreibt der Client nicht. Uploads sind in der Oberfläche deaktiviert; in einem Lernlauf stehen höchstens Dateinamen. Ein Lernlauf liegt in `localStorage`: die Generierung öffnet `/learn/{id}` in einem neuen Tab, und dieser Tab teilt weder den React-Zustand noch den `sessionStorage` des Formulars. Fertige HTML-Seiten liegen unter demselben Präfix, damit ein Neuladen keinen neuen Hermes-Lauf startet. Die Ausführung dieses HTML ist in [8.1](#81-generative-ui) beschrieben.

`localStorage` überlebt das Schließen des Browsers. Eine Aufbewahrungsfrist und eine Löschaktion in der Anwendung gibt es nicht. Der Formularentwurf endet mit der Sitzung des Tabs. Lernlauf und HTML enden, wenn die Website-Daten dieser Origin gelöscht werden. Das ist die festgelegte Löschmöglichkeit. Auf einem eigenen Gerät genügt sie. Auf einem gemeinsam genutzten Gerät bleiben Profil, Freitext und HTML lesbar, bis jemand diese Daten löscht. Skripte derselben Origin können sie ebenfalls lesen. Diese Lücke ist [R-2](11-risiken-und-technische-schulden.md).

`language` und `theme` liegen ebenfalls im `localStorage`. Das sind Einstellungen der Oberfläche und enthalten keinen Lerninhalt. Die Sprache ist in [8.2](#82-internationalisierung) beschrieben.

### Speicherübersicht

| Speicherort | Schlüssel | Datenarten | Lebensdauer | Löschmöglichkeit |
| --- | --- | --- | --- | --- |
| `sessionStorage` | `application-form` | Formularprofil: Name, Lernphase, Interessen, Ziel, Thema, Freitext, Fragebogenantworten, Vorlieben, Notizen. Dateiobjekte fehlen. | Bis die Sitzung des Tabs endet. Ein Neuladen behält den Entwurf. | Tab oder Fenster schließen, oder Website-Daten löschen. Keine Aktion in der Anwendung. Schlägt das Schreiben fehl, arbeitet das Formular ohne Entwurf weiter. |
| `localStorage` | `lip-learn-{id}` | Ein JSON-Lernlauf: Hermes-Profil (dort ohne den eingefügten Materialtext), Assessment-Antworten, Freitext im Feld `material` (Thema und Text), gewählte Themes. | Bis die Website-Daten gelöscht werden. Kein Ablaufdatum. | Website-Daten dieser Origin löschen. Die Anwendung entfernt den Eintrag nicht. |
| `localStorage` | `lip-learn-{id}-{theme}` | Erzeugtes HTML der Lernseite. | Wie der zugehörige Lernlauf. | Wie der Lernlauf. Ist der Speicher voll, bleibt die Seite sichtbar und wird für den nächsten Ladevorgang nicht abgelegt. |
| `localStorage` | `language`, `theme` | UI-Sprache und Hell/Dunkel. | Bis die Einstellung geändert oder die Website-Daten gelöscht werden. | Einstellung in der Anwendung ändern, oder Website-Daten löschen. |

Solution Pages unter `/solution/:uuid` legt der Client nicht im Browser-Speicher ab.
