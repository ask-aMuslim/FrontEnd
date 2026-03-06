## Enhanced prompt — API integration refinement (AskAMuslim)

ROLE
You are a senior full‑stack architect and executor for the AskAMuslim project. Prioritize evidence, minimal invasive changes, and verified execution. Use the repository files (for example, `src/app`, `src/app/api`, `src/app/core`) as the single source of truth for claims.

---

OBJECTIVE
Primary Goal:

- Fix and improve API integration & frontend behaviors described below so the site is robust, testable, and user-friendly.

Success Criteria (testable):

- Refreshing any page preserves the current route/state (no accidental redirect to home).
- A renderer-driven global loading screen prevents empty page flashes during data loads.
- Events list has client-side pagination and "Join for free" becomes "See All Events" for signed-in users.
- QA categories show correct QAs, hide pagination when empty, and display a friendly empty-state hint.
- QA detail shows full question/answer and displays the QA image only if the API returns one.
- Tags from the "Tags" endpoint populate category filters and correct category names.
- Social sign-ins (Google/Facebook) send correct request bodies and succeed in end-to-end test flows.
- Academy: guests can view course overviews, but Begin Course prompts sign-in modal.
- Stages, lessons, notes, and sidebar content are populated from APIs (no hardcoded content) and UI respects the design (e.g., stage lock icon shown at 40×40).
- Pagination scrolls the page to the top of its target section on navigation.
- All changes introduce no regressions; build and tests pass locally.

Non-Goals:

- Rewriting unrelated features.
- Adding new backend endpoints unless absolutely necessary.

---

PROJECT CONTEXT (evidence-derived)

- Frontend: Angular (feature-first, lazy routes, signals). See `src/app/`.
- API: OpenAPI-generated clients under `src/app/api/` (`fn` / `facades` / `models`).
- Styling: SCSS tokens in `src/styles/_tokens.scss` and `src/styles/containers.css`.
- Auth & core helpers live in `src/app/core/`.

---

INPUT DATA
Original issues (kept verbatim where useful):

- When I refresh the page, the website routes by mistake to the home page, it must keep me in the displayed page.
- Implement renderer-driven loading screen (use interceptor).
- Events: client-side pagination; "Join for free" → "See All Events" when signed in.
- QA: fix display, ensure headers/body in API calls; empty-category hint; hide pagination when no QAs.
- QA detail: show full Q/A and show image only when present.
- Tags endpoint must feed categories and update names.
- Ensure social sign-in endpoints receive correct bodies and test them.
- Academy: guests can view content; Begin Course shows sign-in modal.
- Stages: dynamic from API; lock image 40×40; description from API.
- Lesson page: replace hardcoded notes and content with API data; next-lesson / Course Quiz / congrats flow.
- Sidebar: title shows course title (ellipsis), not course id.
- Pagination: on page change, scroll to top of the relevant section.

Source: `Api integration refining prompt before enhancement.txt` in the repository root.

---

TASK EXECUTION ORDER (MANDATORY)

1. ANALYZE: Reproduce each failing behavior locally and capture concrete evidence (logs, network calls, route state, UI snapshots).
2. PLAN: For each item, propose minimal code changes and file targets (e.g., which component, interceptor, facade).
3. IMPLEMENT: Make small, reversible commits per feature with tests where applicable.
4. VERIFY: Manual steps + automated tests. Record evidence (screenshots, cURL/Postman requests).
5. REVIEW & CLEANUP: Ensure no console logs, no TODOs, strict TypeScript rules intact.

---

DETAILED CHECKLIST (map of fixes → files to inspect/change)

- Preserve route on refresh
  - Check: `src/app/app.routes.ts`, `server.ts`, client bootstrap in `main.ts` and `main.server.ts`.
  - Fix: Ensure SSR hydration/route handling (or client-side router initialNavigation) preserves current URL, avoid programmatic redirects in top-level guards.

- Renderer-driven loading screen
  - Check: global app component (`src/app/app.ts` / `app.html`), interceptors in `src/app/core/http/`.
  - Fix: Implement a loading service + HTTP interceptor (or resource()) that toggles a renderer-safe loader component.

- Events pagination & button text
  - Check: `src/app/pages/events` components and facades (`src/app/api/facades`).
  - Fix: Client-side pagination in component state; detect auth status via core/auth service; swap button text conditionally.

- QA lists & QA detail
  - Check: QA components under `src/app/pages/...`, `Tags`/`QAs` API functions in `src/app/api/fn`.
  - Fix: Use tags endpoint to populate filters; conditional rendering for images and empty states; hide pagination if no items.

- Social sign-in request bodies
  - Check: auth facades and API call wrappers in `src/app/core/auth/` and `src/app/api/`.
  - Fix: Align request payloads with backend contract; add integration test (Postman or automated).

- Academy guest flows & Begin Course modal
  - Check: `src/app/pages/academy` components and routing guards.
  - Fix: Allow guest access to course overview; show sign-in modal on "Begin Course".

- Stages, Lessons, Sidebar
  - Check: `src/app/pages/*/lesson*`, connectors/visual components.
  - Fix: Replace hardcoded data with API data; fix image path and dimensions; update next-lesson logic.

- Pagination scroll behavior
  - Check: pagination components; add a scrollIntoView(target) on page change.

---

OUTPUT FORMAT (strict)
Respond with:

- Analysis (short)
- Plan (numbered small steps mapping to files)
- Implementation (code snippets or file paths and exact edits to make)
- Verification (manual + automated steps)
- Risks / Unknowns (explicit)

EVIDENCE RULE: Every claim must cite a file path or a captured network trace. If the file isn't present, ask before changing.

UNCERTAINTY RULE: If confidence < 90% about an assumption (e.g., SSR config), state it and request environment reproduction steps.

---

IMPLEMENTATION GUIDELINES (rules)

- Minimal scope changes; prefer facades/services updates over component logic when possible.
- No console logs, no TODOs, no magic numbers.
- Use existing API clients under `src/app/api/`.
- Make UI changes in `src/app/pages/**` and shared components under `src/app/shared/reusable-components`.
- For new tests, use existing test setup (see `test-setup.ts` and `package.json` scripts).
- When adding a loader, ensure it is renderer-safe and SSR-compatible (use Angular renderer or platform checks).

---

EXAMPLE TASK (fully-specified)

Objective: Prevent refresh redirect to home on event details page.

Success Criteria:

- When browsing to `/events/123` and refreshing, the client shows event 123 instead of navigating to `/`.

Plan:

1. Inspect `app.routes.ts` and top-level guards for unconditional redirects; check `main.ts` router initial navigation config.
2. Reproduce in browser, capture network and console logs.
3. If redirect originates in a guard, change guard to return UrlTree only when a condition is met; otherwise, allow navigation.
4. Run `npm run test` and `npm start` locally and verify refresh behavior.

Files to change:

- `src/app/app.routes.ts` (review guards)
- `src/app/core/guards/*` (fix logic)

Verification:

- Manual refresh test + unit test for guard logic.

---

FINAL VALIDATION CHECKLIST

- [ ] All success criteria reproducible and passing locally.
- [ ] Evidence (network traces, screenshots) attached to the task.
- [ ] No console logs / TODOs introduced.
- [ ] TypeScript strict rules maintained.

---

NEXT STEP
I’ve converted your original bullets into the structured, evidence-first prompt above and prepared a concrete checklist and execution plan. Would you like me to:

- A) Generate the exact change PR/patches for one selected item (pick which), or
- B) Start implementing the highest-priority fix (preserve route on refresh) and run tests locally?

(If you prefer a different next step, tell me which item to prioritize.)
