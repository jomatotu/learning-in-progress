# 8. Querschnittliche Konzepte

| Konzept | Stand |
| --- | --- |
| Generative UI | Kernidee. Von Hermes geschriebene Seiten laufen nur in `<iframe sandbox="allow-scripts">` (`/sandbox.html`, eigene CSP, opaker Origin). Lektionen sollen json-render-Specs aus unserem Katalog werden, interaktive Teile als Simulation-Block in derselben Sandbox (siehe `doc/specs/2026-10-24-integration-design.md`). |
| Fachliche Domäne | Profil, Lernmaterial, Lösungsvorschlag. Modell ist offen. |
| Persistenz | Offen. Unklar, was über eine Sitzung hinaus gespeichert wird. |
| Datenschutz | Profile und Lernmaterial können sensibel sein. Umgang ist offen. |
| Sicherheit | Alle Routen, die Hermes aufrufen, brauchen einen Zugangscode (HTTP Basic), sind pro Client begrenzt (30 Anfragen pro Minute) und prüfen Origin, Host und Body-Größe. Der Server baut jede Hermes-Eingabe selbst aus validierten Daten; der Browser wählt keine Session. Details: `doc/plans/2026-10-24-security-layer.md`. |
| Fehlerbehandlung | Offen. Betrifft vor allem fehlgeschlagene Recherche oder Generierung. |
| Internationalisierung | Dokumentation und UI sind deutsch (Anrede `du`). Keine Sprachumschaltung. |
