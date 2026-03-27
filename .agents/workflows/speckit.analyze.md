---
description: Identify inconsistencies, duplications, ambiguities, and underspecified items across spec.md, plan.md, and tasks.md.
---
## User Input
```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal
Identify inconsistencies across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) and the project constitution.

## Operating Constraints
**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report.

## Execution Steps
1. Load `spec.md`, `plan.md`, `tasks.md`, and `/memory/constitution.md`.
2. Build internal semantic models for requirements, tasks, and rules.
3. Detection Passes:
    - Duplication detection
    - Ambiguity detection
    - Underspecification
    - Constitution alignment
    - Coverage gaps
    - Inconsistency
4. Produce Specification Analysis Report with ID, Category, Severity, and Recommendation.
5. provide metrics (Total Tasks, Coverage %, Ambiguity Count).
6. Offer remediation suggestions.
