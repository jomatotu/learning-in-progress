# 9. Architekturentscheidungen

| ID | Entscheidung | Status | Begründung |
| --- | --- | --- | --- |
| AE-1 | Ein Monorepo | getroffen | So ist das Repository angelegt. |
| AE-5 | Lösung als generative UI im Browser | getroffen | Zwei technische Formen. Welche führt, steht in AE-7. |
| AE-7 | HTML-Lernseite ist die führende generative UI; die Solution Page bleibt der zweite Pfad | getroffen | „Mein Werkzeug bauen“ und der Playground öffnen `/learn/:id` (HTML in einer Sandbox). „Magische Seite“ öffnet `/solution/:uuid` (React-Modul im App-Origin). Beide Pfade sind im Client erreichbar. Siehe [5.4](05-bausteinsicht.md#54-generative-ui). |
| AE-6 | Fokus auf den Lernprozess, nicht auf die Prüfung | getroffen | Siehe [Transformation](../process.md#transformation). |
