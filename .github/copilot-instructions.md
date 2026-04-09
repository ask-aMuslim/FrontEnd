## AskAMuslim AI Agent Operating Instructions (Single Source of Truth)

This file is the **only** project instruction file to be used for agent behavior.
Ignore any deleted legacy instruction files and avoid loading broad skill packs unless explicitly requested.

### Execution Model
- Execute tasks in one flow: **Analyze → Plan → Implement → Verify**.
- Keep context minimal: only open files required for the task.
- Do not pause for intermediate confirmations unless blocked by missing requirements.

### Architecture and Code Rules
- Angular 20, standalone components, `ChangeDetectionStrategy.OnPush` by default.
- Strict TypeScript: no `any`, no unsafe casts, no dead code, no duplicated logic.
- No HTTP calls in components; use `src/app/api/fn/**` + facades in `src/app/api/facades/**`.
- Prefer signals + immutable updates; no direct state mutation.
- No business logic in templates, no inline styles, no magic numbers.

### Contract and Integration Discipline
- Treat OpenAPI/Postman contracts as authoritative.
- For API-impacting changes, validate with project checks (including swagger/contract checks when relevant).
- Never invent endpoints; verify in workspace before implementation.

### Quality Gates
- Before completion, run and pass: build, test, lint (and contract checks when applicable).
- Fix introduced errors before finishing.

### Context Hygiene
- Keep one instruction source only: this file.
- Avoid loading extra rule systems or redundant instruction files.

### Speckit Usage
- Use Speckit workflows when the task is feature-sized or multi-step.
- For small scoped edits, apply minimal-change implementation directly, then verify.
- Orchestrate the full Speckit pipeline using these subagents as needed:
  - `speckit.analyze`
  - `speckit.checklist`
  - `speckit.clarify`
  - `speckit.constitution`
  - `speckit.plan`
  - `speckit.specify`
  - `speckit.tasks`
  - `speckit.taskstoissues`
  - `speckit.implement`
- Ensure each pipeline step completes successfully and produce the corresponding outputs (spec, plan, tasks, implementation artifacts).
- Treat Speckit as the authoritative workflow engine; do not bypass it for work that matches a Speckit stage.

### Skill System (must remain intact)
- This repo includes a global AI skill system; do not delete or ignore it.
- When working on a task, run the skill discovery script:
  `node get_skills.js "<short task description>"`
- Open the top 1–3 resulting `SKILL.md` files under `./.agents/skills/` and follow their guidance.
- Do not load all 600+ skills into the context; only use the subset returned by the script.

### Verification Tools & Environments
- **UI tasks**: Use Chrome DevTools MCP to validate UI updates, component render trees, and state changes.
- **API integration tasks**: Use Postman MCP + Postman extension to validate endpoints, request bodies, and responses; use Chrome DevTools MCP to verify correct UI interaction with the API.
- **Design reference**: Figma: http://figma.com/design/90ZtQuhT2ww9KvzjZm4SIq/UX~UI-%7C-Ask-A-Muslim?node-id=1-4&p=f&t=DJXus2KQZovbHkMi-0

### Access Points
- **Admin panel**: https://adminpanel.ask-a-muslim.com/auth/login
  - email: `administrator@ask-a-muslim.com`
  - password: `P@ssw0rd`
- **User site (local)**: run locally and log in via:
  - email: `aa6310336@gmail.com`
  - password: `Pa$$w0rd`

