---
description: Detect and reduce ambiguity or missing decision points in the active feature specification.
---
## User Input
```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline
Goal: Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.

Execution steps:

1. Load the current `spec.md` file.
2. Perform a structured ambiguity & coverage scan (Functional Scope, Data Model, UX Flow, Security, etc.).
3. Generate a prioritized queue of candidate clarification questions (maximum 5).
4. Sequential questioning loop (interactive):
    - Present EXACTLY ONE question at a time.
    - User can reply with an option or provide a short answer.
5. Integration:
    - Update `## Clarifications` section in `spec.md`.
    - Apply the clarification to the most appropriate section(s) of the spec.
6. Save the spec file AFTER each integration.
7. Report completion with number of questions asked and sections touched.
