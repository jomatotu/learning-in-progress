# 3. Kontextabgrenzung

## 3.1 Fachlicher Kontext


```mermaid
flowchart LR
  nutzer([Lernende])
  app[Learning-in-Progress]
  material[Lernmaterial]
  quellen[Wissens- und Forschungsquellen]

  nutzer -->|Profil, Ziele, Feedback| app
  material -->|Texte, Vorlesungen| app
  quellen -->|Belege und Empfehlungen| app

  app -->|Angepasste Lernoberfläche| nutzer
  app -->|Transformierte Inhalte| material
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
