---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---
## User Input
```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks
1. Verify `spec.md`, `plan.md`, and `tasks.md` exist in the active feature directory.
2. Ensure there are uncompleted tasks in `tasks.md`.

## Outline
Execution phase:

1. Parse `tasks.md` structure and extract task phases and dependencies.
2. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next.
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together.
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks.
   - **File-based coordination**: Tasks affecting the same files must run sequentially.
3. Progress tracking:
   - Report progress after each completed task.
   - Mark the task off as [X] in the `tasks.md` file.
4. Completion validation:
   - Verify all required tasks are completed.
   - Validate that tests pass.
   - Confirm the implementation follows the technical plan.
