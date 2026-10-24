# 3. Kontextabgrenzung

## 3.1 Fachlicher Kontext


```mermaid
C4Context
title Systemkontext
Person(nutzer, "Nutzer", "Verwendet die Anwendung")
System(app, "Anwendung", "Kernsystem")
System_Ext(mail, "E-Mail", "Externer Maildienst")
Rel(nutzer, app, "Nutzt")
Rel(app, mail, "Sendet Mail", "SMTP")
```

| Nachbar | Input | Output |
| --- | --- | --- |
| Lernende | Profil, Ziele, was bereits funktioniert | Angepasste Oberfläche zum Lernen |
| Lernmaterial | Hochgeladene Inhalte, zum Beispiel Text oder Vorlesung | Inhalt in anderer Form, Wissen unverändert |
| Wissens- und Forschungsquellen | — | Belege dafür, welche Form diesem Profil hilft |

## 3.2 Technischer Kontext

```mermaid
flowchart LR
  browser[Browser]
  frontend[Frontend]
  backend[Backend]
  gemini[Gemini]

  browser --- frontend
  frontend <-->|HTTP| backend
  backend <-->|API, Details offen| gemini
```

Kanäle, Formate und Authentifizierung sind offen.
