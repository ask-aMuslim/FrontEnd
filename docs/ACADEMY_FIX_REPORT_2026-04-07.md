# Academy Fix Report — 2026-04-07

## Scope

This report documents completion status for the 5 requested Academy fixes:

1. Course stage/level regression after entering/leaving overview.
2. Quiz visibility in sidebar (overview + lesson pages) for test course.
3. Full lesson list visibility for long courses (>10 lessons) + sidebar scrollbar when >6 lessons.
4. Important-note width alignment with other Academy sections.
5. Recent lesson card data/visibility corrections.

## Done ✅

### 1) Stage regression fixed

- Root cause addressed in `src/app/core/services/academy-progress.service.ts` by preserving resolved stage/level and avoiding incorrect cache mutation.
- Verified visually: after opening `Test course` and returning to `/academy`, the course remains under `AAM_ITG_2026_03_09 Level` (not moved to Level 1).

### 2) Quiz now appears in sidebar for test course

- Added robust quiz synthesis for course/lesson sidebars when quiz exists via quizzes API linkage (`lessonId`) even if no explicit lesson row exists.
- Corrected false lesson type inference (`test` in title no longer auto-classifies lesson as quiz).
- Verified visually on test course `cea7c80e-13ca-43ad-8094-08de8aa1c3b2`:
  - Course overview sidebar shows `Quiz` item.
  - Lesson player sidebar shows `Ready?` divider + `Quiz` item.

### 3) Full lesson list + scroll behavior fixed

- Increased lesson retrieval to full page (`PageSize: 1000`) in `src/app/api/facades/lesson.facade.ts`.
- Removed client-side lesson filtering by `isPublished` in Academy lesson mapping to ensure complete roadmap visibility in course sidebar.
- Added scroll threshold behavior in sidebar component (`scrollThreshold = 6`) with `lessons-list--scrollable` class.
- Verified visually on `Explanation of 40 Hadiths` (`40de79e2-78c8-49e1-8085-08de8aa1c3b2`):
  - Sidebar shows `Lessons: 20`.
  - Scroll is active (`clientHeight: 416`, `scrollHeight: 1432`, scrollable class present).

### 4) Important-note width alignment fixed

- Updated `src/app/pages/academy/academy.component.scss` so note padding is applied on inner `.section-block` and width aligns with peer sections.
- Verified visually/DOM metrics on `/academy`:
  - Important note width = 923
  - Recent lesson section width = 923

### 5) Recent lesson card behavior corrected

- `categoryLabel` now sourced dynamically from course mapping (no hardcoded label).
- Lesson count now uses real lesson feed count fallback to avoid `0 out of 0` errors.
- Duration displayed only when current recent lesson is video with a valid duration.
- Emoji shown only when progress is `>= 50%`.
- Progress computed from completed/total lessons and clamped to 0..100.
- Verified on `/academy` recent card:
  - `0 out of 1 lessons` (correct for current test recent lesson)
  - No duration shown for non-video case
  - No emoji at 0% progress

## Validation run summary

### Build

- `npm run build` ✅ successful (with existing repo-wide warnings about unused TS files).

### Tests

- `npm run test -- --watch=false --browsers=ChromeHeadless` ⚠️ fails due known baseline repo issue:
  - `Can't resolve src/test.ts`

### Lint

- `npm run lint` ⚠️ fails with widespread pre-existing repository lint violations (not specific to this Academy patch).

## Pending / Follow-up ⚠️

1. **Repository baseline quality gates** (pre-existing):
   - Restore/fix `src/test.ts` test entry for Karma.
   - Address broad lint baseline (`no-undef`, `prefer-inject`, etc.).
2. Optional UX follow-up:
   - Consider whether Academy should hide unpublished lessons or always show full roadmap by product policy (currently set to show full roadmap to satisfy requested behavior).

## Files updated

- `src/app/core/services/academy-progress.service.ts`
- `src/app/api/facades/lesson.facade.ts`
- `src/app/pages/academy/quiz/quiz.component.ts`
- `src/app/pages/academy/shared/academy-course-sidebar/academy-course-sidebar.component.ts`
- `src/app/pages/academy/shared/academy-course-sidebar/academy-course-sidebar.component.html`
- `src/app/pages/academy/shared/academy-course-sidebar/academy-course-sidebar.component.scss`
- `src/app/pages/academy/academy.component.ts`
- `src/app/pages/academy/academy.component.html`
- `src/app/pages/academy/academy.component.scss`
- `src/app/pages/academy/course/course.component.ts`
- `src/app/pages/academy/lesson-player/lesson-player.component.ts`
