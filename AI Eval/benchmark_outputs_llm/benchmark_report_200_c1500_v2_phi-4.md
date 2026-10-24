# PDF Knowledge Benchmark

- **Document:** TEACHING CHILDREN WITH ATTENTION DEFICIT HYPERACTIVITY DISORDER.pdf (36 pages, 48 chunks)
- **Student (answering):** microsoft/phi-4
- **Examiner (question writing and grading):** Qwen/Qwen3-8B
- **With-context run:** top 8 retrieved chunks (BAAI/bge-small-en-v1.5), hit rate 94.8%
- **Questions:** 154

## Summary

| run          |   n |   correct |   partial |   incorrect |   errors |   strict_acc_% |   lenient_score_% |
|:-------------|----:|----------:|----------:|------------:|---------:|---------------:|------------------:|
| zero_shot    | 154 |        83 |        36 |          35 |        0 |           53.9 |              65.6 |
| with_context | 154 |       146 |         4 |           4 |        0 |           94.8 |              96.1 |

- Strict accuracy change: **+40.9 points**
- Lenient score change: **+30.5 points** (95% CI +24.0 to +37.0)
- Improved: 67 | Got worse: 4 | Unchanged: 83

## Verdict transitions (rows: zero-shot, columns: with context)

| verdict_zero_shot   |   correct |   incorrect |   partially_correct |   All |
|:--------------------|----------:|------------:|--------------------:|------:|
| correct             |        79 |           1 |                   3 |    83 |
| incorrect           |        32 |           3 |                   0 |    35 |
| partially_correct   |        35 |           0 |                   1 |    36 |
| All                 |       146 |           4 |                   4 |   154 |
