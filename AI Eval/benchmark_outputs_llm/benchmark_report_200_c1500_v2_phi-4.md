# PDF Knowledge Benchmark

- **Document:** TEACHING CHILDREN WITH ATTENTION DEFICIT HYPERACTIVITY DISORDER.pdf (36 pages, 48 chunks)
- **Student (answering):** microsoft/phi-4
- **Examiner (question writing and grading):** Qwen/Qwen3-8B
- **With-context run:** top 8 retrieved chunks (BAAI/bge-small-en-v1.5), hit rate 94.7%
- **Questions:** 152 (questions 0 and 1 removed: they asked about the document's staff and order phone number, not the subject)

## Summary

| run          |   n |   correct |   partial |   incorrect |   errors |   strict_acc_% |   lenient_score_% |
|:-------------|----:|----------:|----------:|------------:|---------:|---------------:|------------------:|
| zero_shot    | 152 |        83 |        36 |          33 |        0 |           54.6 |              66.4 |
| with_context | 152 |       144 |         4 |           4 |        0 |           94.7 |              96.1 |

- Strict accuracy change: **+40.1 points**
- Lenient score change: **+29.7 points** (95% CI +23.0 to +36.2)
- Improved: 65 | Got worse: 4 | Unchanged: 83

## Verdict transitions (rows: zero-shot, columns: with context)

| verdict_zero_shot   |   correct |   incorrect |   partially_correct |   All |
|:--------------------|----------:|------------:|--------------------:|------:|
| correct             |        79 |           1 |                   3 |    83 |
| incorrect           |        30 |           3 |                   0 |    33 |
| partially_correct   |        35 |           0 |                   1 |    36 |
| All                 |       144 |           4 |                   4 |   152 |
