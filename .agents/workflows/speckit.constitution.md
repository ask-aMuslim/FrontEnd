---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
---
## User Input
```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline
Goal: Detect and reduce ambiguity or missing decision points in the project constitution and record the clarifications directly in the constitution file.

Execution steps:

1. Run `node scripts/speckit/get-feature-context.js` (or equivalent) from repo root **once** to capture project environment.
2. Load the current `.specify/memory/constitution.md`.
3. Perform a structured scan for missing or vague core principles.
4. If the constitution is missing or incomplete, interactive questioning loop (maximum 5 questions) to fill in the core principles:
    - Tech Stack
    - Architecture Patterns
    - Testing Requirements
    - Security Standard
    - Review Checklist
5. Update `.specify/memory/constitution.md` with the refined principles.
6. Synchronize versioning and ratification dates.
7. Report completion and path to the updated constitution.
