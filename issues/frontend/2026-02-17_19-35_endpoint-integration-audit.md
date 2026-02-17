# Frontend Endpoint Integration Audit — 2026-02-17 19:35

## Scope
Audit target: all currently wired frontend API domains with focus on:
- payload extraction correctness
- endpoint-to-state-to-UI binding
- null/undefined safety
- formatting of user-facing values (especially events date/time)

## High-impact issues found and fixed

### 1) Facade envelope extraction dropped list payloads in common API shape
- **Root cause**: `src/app/api/facades/shared.ts` previously returned only `data` from envelopes; for payloads like `{ data: { items: [...] } }`, array facades resolved to `[]`.
- **Impact**: facade-backed lists (`courses`, `lessons`, `quizzes`, `questions`, `students`, `enrollments`, `instructors`, `progress`, `student-notes`) could appear empty despite successful API responses.
- **Fix applied**:
  - `src/app/api/facades/shared.ts` now recursively resolves arrays through common keys (`data`, `items`, `$values`, `results`, `value`) with depth + cycle protection.
  - Non-array extraction now unwraps nested records safely.

### 2) Events date/time mapping omitted canonical backend fields
- **Root cause**: event list/detail mappers prioritized `date/startDate/eventDate` and ignored canonical `startDateTime/endDateTime`.
- **Impact**: events could render with fallback placeholders (`TBD`) while network returned valid datetime fields.
- **Fix applied**:
  - Added shared formatter: `src/app/core/helpers/event-display.helper.ts`.
  - Updated mappings:
    - `src/app/pages/events/events.component.ts`
    - `src/app/pages/events/event.service.ts`
    - `src/app/pages/home/home.ts`
  - Updated featured hero bindings in `src/app/pages/events/events.component.html` to use dynamic time/day/month.
  - Extended event-card contract with optional `timeRange` in `src/app/pages/events/event-card/event-card.component.ts`.

## Endpoint integration status (active user-facing flows)

### PASS (wired, mapped, and null-safe)
- `/api/Events` and `/api/Events/{id}`
  - Consumers: events page + home + event detail service.
  - Notes: now supports `startDateTime/endDateTime` formatting and fallback behavior.
- `/api/QAs`
  - Consumer: ask-qa page.
  - Notes: robust extraction + safe field fallbacks.
- `/api/InquiryRequests` (create flow)
  - Consumer: send-inquiry form.
  - Notes: status-aware error handling in UI.
- `/api/MeetingRequests` (create flow)
  - Consumer: meet-scholar form.
  - Notes: date/time and topic payload handling present; 401 routing handled.
- `/api/Questions` + `/api/QuizAttempts`
  - Consumer: academy quiz flow.
  - Notes: parser-based mapping and guarded fallbacks in quiz component.

### PARTIAL (integrated in services/facades but not fully represented in current UI)
- `/api/Courses`, `/api/Lessons`, `/api/Progress`, `/api/StudentNotes`, `/api/Students`, `/api/Enrollments`, `/api/Instructors`
  - Mostly consumed through `AcademyProgressService` and/or facade methods.
  - Several endpoints are available but only subsets of attributes are displayed in current academy views.
  - This is an implementation-scope gap (not a parsing failure after extractor fix).

### NOT CURRENTLY SURFACED IN USER PAGES
- Many generated admin/backoffice domains in `src/app/api/fn/**` (permissions, moderators, notifications, tags, muslim-tube admin operations, etc.) have endpoint contracts but no active user-page rendering path in current route set.

## Runtime/build validation
- `npm run build` completed successfully after fixes.
- Existing CSS selector warnings (`Empty sub-selector`) are pre-existing and unrelated to this audit patch.

## Recommended next audit pass (if required)
1. Build a route-by-route field matrix (template binding coverage) for academy pages.
2. Add explicit UI mapping for additional facade attributes where product wants them visible.
3. Add focused integration tests for envelope variants (`data.items`, `data.$values`, plain arrays).
