# 10. Qualitätsanforderungen

Die folgenden Anforderungen setzt der Client bereits um ([A-10](client-abgleich.md)). Konkrete Qualitätsszenarien fehlen noch und müssen ergänzt werden. Priorität und die Produktziele aus [Abschnitt 1.2](01-einfuehrung-und-ziele.md#12-qualitätsziele) bleiben offen.

| ID | Qualitätsanforderung | Erklärung |
| --- | --- | --- |
| QA-01 | Wahrnehmbarkeit langer Läufe | Assessment und Seitengenerierung laufen als Stream. Solange der Aufruf dauert, zeigt die Oberfläche den aktuellen Schritt, die verstrichene Zeit und die bisher eingetroffene Begründung. |
| QA-02 | Robustheit bei Abbruch | Zeitlimit, Netzabbruch, Fehlerereignis oder ein Stream ohne Abschluss enden mit einer Fehlermeldung. Assessment und Lernseite bleiben bedienbar. |
| QA-03 | Wiederherstellbarkeit | Schlägt Formular, Profil, Assessment oder eine Lernseite fehl, bleiben die eingegebenen Daten erhalten. Dieselbe Anfrage lässt sich erneut starten. |
| QA-04 | Bedienbarkeit mit Tastatur und Screenreader | Beim Wechsel des Formularschritts liegt der Fokus auf der Überschrift der neuen Ansicht. Die Ansicht beginnt am Anfang des sichtbaren Bereichs. |
| QA-05 | Isolation der HTML-Lernseite | Eine erzeugte HTML-Lernseite läuft in einem eigenen Rahmen. Skripte dürfen laufen. Dokument, Cookies und Speicher der Anwendung bleiben unerreichbar. |
