## AskAMuslim AI Agent Operating Instructions (Single Source of Truth)

This file is the **only** project instruction file to be used for agent behavior.
Ignore deleted legacy instruction files and avoid loading broad skill packs unless explicitly requested.

### Mission and Delivery Standard
- Operate as a principal engineer: deliver production-ready outcomes, not partial patches.
- Aim for complete implementation quality (design parity, responsiveness, integration correctness, and test coverage), then report verifiable evidence.
- Do not claim "perfect" results without measured validation; provide concrete pass/fail evidence and known gaps.

### Execution Model
- Execute in one continuous flow: **Analyze → Plan → Implement → Verify → Evidence**.
- Keep context minimal: open only files required for the current step.
- Do not pause for intermediate confirmation unless blocked by missing requirements or unavailable dependencies.
- Use incremental, reversible edits; keep commits logically grouped.

### Principal Workflow for UI + API Delivery
1. **Baseline capture**
   - Identify impacted pages/components and related API contracts.
   - Capture current UI behavior and network/error baselines before edits.
2. **Design parity pass**
   - Compare implementation against Figma structure, spacing, typography, state behavior, and interaction details.
   - Resolve visual and behavioral deltas before moving to API integration.
3. **Integration pass**
   - Wire UI only through generated API functions/facades.
   - Validate request/response shape and status handling against contract artifacts.
4. **Responsiveness + accessibility pass**
   - Validate core flows for mobile/tablet/desktop breakpoints and keyboard navigation.
5. **Scenario testing pass**
   - Execute realistic end-to-end user scenarios (happy path + failure/retry paths).
6. **Quality gates**
   - Run required checks and fix all introduced errors before completion.

### MCP and Verification Orchestration
- **Chrome DevTools MCP (mandatory for UI tasks):**
  - Validate rendered DOM states, console cleanliness, and network interactions.
  - Capture evidence for component states, route transitions, and responsive behavior.
  - Verify the implementation using ONLY the Chrome DevTools MCP attached to my current active tab. Do NOT use Playwright to navigate, interact, or extract page state.
- **Postman MCP (mandatory for API tasks):**
  - Validate endpoint behavior, payload contracts, status codes, and regression coverage.
  - Prefer collection/folder/request validation that mirrors affected frontend use-cases.
- **TalkToFigma MCP (design integration):**
  - Use when available to inspect design metadata and align tiny UI details.
  - If unavailable in the active toolset, use browser-based Figma inspection as fallback and explicitly report this limitation.
- **Design reference:**
  - http://figma.com/design/90ZtQuhT2ww9KvzjZm4SIq/UX~UI-%7C-Ask-A-Muslim?node-id=1-4&p=f&t=DJXus2KQZovbHkMi-0

### Architecture and Code Rules
- Angular 20, standalone components, `ChangeDetectionStrategy.OnPush` by default.
- Strict TypeScript: no `any`, no unsafe casts, no dead code, no duplicated logic.
- No HTTP calls in components; use `src/app/api/fn/**` + facades in `src/app/api/facades/**`.
- Prefer signals + immutable updates; no direct state mutation.
- No business logic in templates, no inline styles, no magic numbers.
- Browser globals (window/document/localStorage/navigator/setTimeout/clearTimeout/requestAnimationFrame/fetch) must be wrapped in SSR guards (`isPlatformBrowser(PLATFORM_ID)`) and/or use `globalThis`.

### Contract and Integration Discipline
- Treat OpenAPI/Postman contracts as authoritative.
- For API-impacting changes, validate with project checks (including swagger/contract checks when relevant).
- Never invent endpoints; verify in workspace before implementation.

### Responsiveness and Accessibility Minimums
- Validate layout/functionality at **360, 390, 768, 1024, 1280, and 1536** widths.
- Ensure no clipped content, horizontal overflow, or inaccessible controls.
- Verify keyboard navigation, visible focus states, semantic landmarks, and meaningful alt/aria labels.

### User Scenario Simulation Requirements
- For any feature-sized task, run at least one **complete user journey** covering:
  - entry state,
  - primary success path,
  - validation/error path,
  - retry/recovery path.
- Confirm frontend state and backend requests remain consistent across the journey.

### Quality Gates (must pass before completion)
- Required local checks:
  - `npm run lint`
  - `npm run build`
  - `npm run test:ci`
- For API-impacting work, also run:
  - `npm run swagger:check`
- Preferred aggregate commands:
  - `npm run verify:local`
  - `npm run verify:full`

### Hooks and Deterministic Enforcement
- Workspace hooks are configured in:
  - `.github/hooks/principal-delivery.json`
- Hook expectations:
  - `SessionStart`: inject delivery-mode requirements.
  - `PreToolUse`: require explicit confirmation for high-risk/destructive command patterns.
  - `PostToolUse`: remind agents to run quality gates after mutating operations.

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
- Ensure each pipeline stage completes successfully and produces expected artifacts.

### Skill System (must remain intact)
- This repo includes a global AI skill system; do not delete or ignore it.
- Preferred flow:
  - Run: `node get_skills.js "<short task description>"`
  - Open top 1–3 resulting `SKILL.md` files under `./.agents/skills/`.
- If the discovery script/path is unavailable, continue with available relevant skills and explicitly report the fallback used.
- Do not load broad/unrelated skill packs into context.

### Context Hygiene
- Keep one instruction source only: this file.
- Avoid redundant instruction systems and duplicated rule packs.

### Access Points
- **Admin panel**: https://adminpanel.ask-a-muslim.com/auth/login
  - email: `administrator@ask-a-muslim.com`
  - password: `P@ssw0rd`
- **User site (local)**: run locally and log in via: `aa6310336@gmail.com` / `Pa$$w0rd`

