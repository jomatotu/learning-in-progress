# PDF Knowledge Benchmark

Measures how much an LLM already knows about the subject of a PDF, and how much its accuracy improves when it gets relevant parts of the PDF as context. Everything runs locally on a Colab GPU in `benchmark.ipynb`.

## Models

| Role | Model | Job |
|---|---|---|
| Examiner | `Qwen/Qwen3-8B` | Writes the questions from the PDF, reviews them, and grades the answers |
| Student | `microsoft/phi-4` (14B) | Answers the questions; this is the model being tested |
| Retriever | `BAAI/bge-small-en-v1.5` | Finds the PDF chunks most relevant to each question for the with-context run |

The examiner and the student come from different model families, so the examiner is not grading answers written by its own model. Both run in 4-bit on GPUs with less than 40 GB of memory, loaded one at a time.

## Runs

- **Zero-shot:** the student answers each question with no document.
- **With context:** the student answers each question given the 8 most relevant chunks of the PDF.

## Grading

For each answer, the examiner lists the key facts in the reference answer, checks which ones the student's answer covers, and checks for contradictions. Extra information in an answer is never penalized unless it contradicts the reference.

| Verdict | Score | Meaning |
|---|---|---|
| correct | 1.0 | Covers every key fact, contradicts none |
| partially_correct | 0.5 | Covers some key facts, contradicts none |
| incorrect | 0.0 | Covers no key fact, or contradicts the reference |

## Metrics in the report

| Metric | Meaning |
|---|---|
| **Strict accuracy** | Share of answers graded `correct`. Partial answers count as wrong. |
| **Lenient score** | Average score, with `partially_correct` counting as half. |
| **Change (points)** | With-context score minus zero-shot score, in percentage points. The size of this gain is how much the document helps. |
| **95% CI** | Bootstrap confidence interval for the lenient score change. If it does not include 0, the improvement is not just noise. |
| **Improved / got worse / unchanged** | Number of questions whose score went up, went down, or stayed the same with context. |
| **Verdict transitions** | Table of zero-shot verdict (rows) against with-context verdict (columns) for each question. |
| **Retrieval hit rate** | Share of questions where the chunk the question was written from is among the retrieved chunks. A miss means the student probably did not get the answer in its context. |
| **Score by retrieval outcome** | Lenient scores split by hit and miss. A big gap means retrieval, not the student, is holding back the with-context score. |

## Caveats

- The examiner writes the questions and the reference answers, so scores are only as good as its question writing and grading. The gap between the two runs is more reliable than the absolute scores.
- Facts that are out of date in the PDF can make a correct, current zero-shot answer look wrong. The question prompt and review try to filter these out.

## Using the results: guideline step in Hermes (hackathon demo)

On the ADHD teaching guide, phi-4 scored 65.6% zero-shot and 96.1% with context (+30.5 points, 95% CI +24.0 to +37.0). Its own knowledge of teaching students with learning difficulties is unreliable, but it is accurate when given a guideline document. So the content agents in [Hermes Agent](https://hermes-agent.nousresearch.com/docs/) get one extra step before they write anything: gather guidelines for the student's described difficulty.

Published research shows the same effect. From the introduction of Shuster et al. (Meta AI), [Retrieval Augmentation Reduces Hallucination in Conversation](https://aclanthology.org/2021.findings-emnlp.320), Findings of EMNLP 2021:

> "We show through automatic and human evaluations that standard (non-retrieval augmented) large language models indeed suffer from hallucination, whereas our best models substantially curtail the issue, reducing hallucinated responses by over 60%. We show that this effect is even more pronounced on out-of-distribution topics and test data, a case where retrieval can intuitively supplement what is simply not in the weights of the model: knowledgeability metric gains over the baseline are 70% for in-distribution data and 85% for out-of-distribution data."

```
student: "I can't focus on long texts"
  -> 1. describe the need (no diagnosis)
  -> 2. get guidelines: web search on trusted sites
  -> 3. generate the content following the guidelines
  -> 4. check the draft against the guidelines and safety rules
```

### 1. Enable web search (`~/.hermes/config.yaml`)

```yaml
web:
  backend: "tavily"            # needs TAVILY_API_KEY; firecrawl / exa also work
tool_loop_guardrails:
  loop_caps:
    max_web_searches: 10
memory:
  write_approval: true         # don't store student difficulties without review
```

### 2. Add the skill (`~/.hermes/skills/learning-needs-research/SKILL.md`)

```markdown
---
name: learning-needs-research
description: Before creating ANY learning material, turn the student's described difficulties into design guidelines with sources.
version: 0.1.0
metadata:
  hermes:
    requires_toolsets: [web]
---
## Procedure
1. Restate the student's needs in plain words ("loses focus on long text"). Never diagnose or label.
2. web_search trusted education and health sources, then web_extract 2-3 pages.
3. Write a short guideline brief: each rule with its source.
4. Create the content following the brief.
5. Before answering, check the draft: does each rule from the brief appear in it, and is it free of medical or medication advice?
```

### 3. Safety rules (`AGENTS.md` in the workspace)

These go in `AGENTS.md` rather than `SOUL.md` because sub-agents only receive `AGENTS.md`.

```markdown
- Describe needs, never diagnose ("you have ADHD" is not allowed).
- No medical, medication, or therapy advice.
- Keep content age-appropriate and encouraging.
- Use only guidelines from trusted sources, and cite them.
```
