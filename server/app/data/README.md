# Learning profile scale

`scale.json` is the survey students fill in during the application form. The server owns it: the questions, the scoring rules, and the instructions for each result.

- **Audience:** students aged 13 to 17. An 18+ version can be added later as a second file.
- **Size:** 30 statements in 8 categories, about 5 minutes. Answers go from 1 "Not like me at all" to 5 "Very much like me".
- **Priority:** every statement is `high` (20) or `low` (10). Scoring doesn't use it yet; it's there for a later decision.
- **Items:** our own teen-friendly wording, modelled on the published scales listed in each category's `based_on`. They are not the validated originals, so results build a learning profile and are never a diagnosis. All statements are generic; none of them include the student's own input.

## Categories

| Category | Changes in the tool |
| --- | --- |
| `prior_knowledge` | Worked examples for beginners, problems for advanced students |
| `working_memory` | Chunk size, ideas per screen, recaps |
| `attention` | Session length, check-ins, focus mode |
| `reading` | Read-aloud, plain language, spacing, audio and visuals |
| `self_regulation` | Ready plan and tiny first steps, or freedom to self-direct |
| `thinking_appetite` | Concrete and guided, or open questions and challenges |
| `self_belief` | How fast difficulty rises, early wins, encouragement |
| `bouncing_back` | Feedback tone, how mistakes are shown, breaks |

## Flow

1. `GET /api/survey` gives the client the list of 30 questions (id, category, text, priority), the answer labels, and the category titles. Reversed items, bands, and instructions stay on the server.
2. The client shows them and sends the raw answers (`{"pk1": 4, "wm1": 2, ...}`) to `POST /api/profile`.
3. The server scores each category (`app/scale.py`): reverse the marked items, average, scale to 0–100, pick `low`, `medium`, or `high`.
4. The server returns one JSON object: what the student told us, plus `learning_instructions`, which holds only the `ai_instructions` of the band each category landed in. No raw answers, scores, or bands. Skipped categories are left out. Nothing is stored.

Scores are always "higher means easier for the student", so `low` is where the most support is needed. To change how the AI adapts, edit the instructions here; no code change needed.
