---
description: Generate "Unit Tests for Requirements" to validate quality, clarity, and completeness.
---
## Checklist Purpose: "Unit Tests for English"
Checklists validate the quality and completeness of requirements, NOT the implementation itself.

## User Input
```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Execution Steps
1. Clarify intent (dynamic): Ask up to 3 context-driven questions to focus the checklist.
2. Load feature context from `spec.md`, `plan.md`, and `tasks.md`.
3. Generate checklist items targeting:
   - Completeness
   - Clarity
   - Consistency
   - Measurability
   - Coverage (Edge Cases, Scenarios)
4. Use standard [ID] format (e.g., CHK001) and include traceability markers like `[Spec §X.Y]` or `[Gap]`.
5. Create or append to a domain-specific checklist file in the `checklists/` directory (e.g., `ux.md`, `api.md`).
6. Report the path to the generated checklist.
