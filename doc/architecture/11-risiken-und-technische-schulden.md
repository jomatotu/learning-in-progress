# 11. Risiken und technische Schulden

| ID | Risiko oder Schuld | Auswirkung |
| --- | --- | --- |
| R-1 | Die HTML-Lernseite ist durch Sandbox und CSP begrenzt. Die Solution Page läuft ohne Sandbox im Origin der Anwendung. | Ob diese Grenzen ausreichen, ist offen. Siehe [8.1 Generative UI](08-querschnittliche-konzepte.md#81-generative-ui). |
| R-2 | Profil, Freitext und erzeugtes HTML liegen ohne Frist im `localStorage`. Was davon an die KI gehen darf, ist offen. | Auf einem geteilten Gerät und für Skripte derselben Origin bleiben die Daten lesbar, bis die Website-Daten gelöscht werden. Die Ablage im Browser ist in [8.3](08-querschnittliche-konzepte.md#83-persistenz-und-datenschutz) als Arbeitskopie entschieden; Ablauf und Löschaktion in der Anwendung fehlen. Die Übermittlung an die KI ist davon getrennt und weiter ungeklärt. |
| R-3 | Der Lösungsraum ist breit. | Ohne Personas entstehen schwer umsetzbare Ideen. Gegenmaßnahme steht im [Prozess](../process.md#fokussierung). |
| R-4 | Mehrere Beispiel-Lösungsformen (Text, Chat, Erweiterung) sind noch gleichwertig. | Die Bausteine bleiben unscharf, solange keine Form führend ist. |
