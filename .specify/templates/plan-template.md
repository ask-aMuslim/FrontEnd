# Implementation Plan Template

**Spec ID:** `N-feature-name`  
**Plan Version:** 1.0  
**Owner:** [Your Name]  
**Created:** YYYY-MM-DD  
**Estimated Duration:** N days

---

## 1. EXECUTIVE SUMMARY

**What are we building?**

- High-level feature description
- Why now?
- Expected impact

**Complexity Assessment:**

- ⭐ Simple (1-2 days, single Facade)
- ⭐⭐ Moderate (3-5 days, new component + API)
- ⭐⭐⭐ Complex (5+ days, multi-component, SSR considerations)

---

## 2. DETAILED WORK BREAKDOWN

### Workstream 1: API Contract Alignment

**Owner:** [Name]  
**Duration:** 0.5 days

#### Task 1.1: Verify API Endpoints in Postman

- [ ] Open "AskAMuslimBackend API Copy" collection
- [ ] Locate endpoint(s) for this feature: `[List endpoints]`
- [ ] Validate request/response schemas
- [ ] Document any discrepancies in `architecture.md`

**Acceptance Criteria:**

- All endpoints exist and respond correctly
- Response models match specification
- Authentication requirements documented

#### Task 1.2: Update Swagger (if needed)

- [ ] Export OpenAPI spec from Postman
- [ ] Run: `npm run swagger:update`
- [ ] Verify schema changes applied
- [ ] Commit: `docs: update swagger [speckit-ref: N-featurename]`

**Acceptance Criteria:**

- `npm run swagger:check` passes
- Generated models compile without errors

#### Task 1.3: Generate OpenAPI Client

- [ ] Run: `npm run generate:api`
- [ ] Verify new models in `src/app/api/models/`
- [ ] Verify new functions in `src/app/api/fn/`
- [ ] Test compilation: `npm run build`

**Acceptance Criteria:**

- TypeScript compilation succeeds
- No type errors in generated code
- Generated files are READ-ONLY (baseline verified)

---

### Workstream 2: Facade Layer Implementation

**Owner:** [Name]  
**Duration:** 1-2 days

#### Task 2.1: Create Facade Service

- [ ] Create file: `src/app/api/facades/[feature].facade.ts`
- [ ] Import generated API functions
- [ ] Define public methods: `list()`, `get()`, `create()`, `update()`, `delete()`
- [ ] Implement error handling via `normalizeError()`

**Template:**

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { [GeneratedFunction] } from '../fn/[generated-file]';
import { normalizeError } from '../../core/errors/error-normalizer';
import { [Model] } from '../models/[model]';

@Injectable({ providedIn: 'root' })
export class [Feature]Facade {
  private readonly http = inject([GeneratedService]);

  list(params?: { pageNumber: number; pageSize: number }): Observable<[Model][]> {
    return [GeneratedFunction](params).pipe(
      catchError(err => {
        const normalized = normalizeError(err);
        console.error(`Failed to list [feature]:`, normalized);
        return throwError(() => normalized);
      })
    );
  }

  get(id: string): Observable<[Model]> {
    return [GeneratedFunction]({ id }).pipe(
      catchError(err => throwError(() => normalizeError(err)))
    );
  }

  create(dto: [CreateDTO]): Observable<[Model]> {
    return [GeneratedFunction]({ body: dto }).pipe(
      catchError(err => throwError(() => normalizeError(err)))
    );
  }

  update(id: string, dto: [UpdateDTO]): Observable<[Model]> {
    return [GeneratedFunction]({ id, body: dto }).pipe(
      catchError(err => throwError(() => normalizeError(err)))
    );
  }

  delete(id: string): Observable<void> {
    return [GeneratedFunction]({ id }).pipe(
      catchError(err => throwError(() => normalizeError(err)))
    );
  }
}
```

**Acceptance Criteria:**

- All CRUD methods implemented
- Error handling via centralized normalizer
- Compilation succeeds with no TypeScript errors
- No `any` types

#### Task 2.2: Implement Paging/Filtering (if applicable)

- [ ] Add paging parameters (pageNumber, pageSize)
- [ ] Add filter parameters (if API supports)
- [ ] Document query parameters in JSDoc
- [ ] Test with Postman

**Acceptance Criteria:**

- API correctly receives and processes filters
- Pagination parameters work end-to-end
- Responses validated against models

#### Task 2.3: Add to Barrel Export

- [ ] Update `src/app/api/facades/index.ts` (if exists)
- [ ] Or create it if doesn't exist
- [ ] Export: `export * from './[feature].facade';`

**Acceptance Criteria:**

- Facade importable from `@facades` (if using path aliases)

---

### Workstream 3: Component Implementation

**Owner:** [Name]  
**Duration:** 2-3 days

#### Task 3.1: Create Standalone Component

- [ ] Create directory: `src/app/pages/[feature]/`
- [ ] Create component: `[feature].component.ts`
- [ ] Use `@Component` with `standalone: true`
- [ ] Inject Facade via DI: `constructor(private facade = inject([Feature]Facade))`

**Template:**

```typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { [Feature]Facade } from '@facades';
import { [Model] } from '@models';
import { normalizeError } from '@core/errors/error-normalizer';

@Component({
  selector: 'app-[feature]',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="loading$ | async">Loading...</div>
    <div *ngIf="error$ | async as err">
      <p>{{ err.message }}</p>
      <button (click)="retry()">Retry</button>
    </div>
    <div *ngIf="items$ | async as items">
      <div *ngFor="let item of items">{{ item.name }}</div>
    </div>
  `,
})
export class [Feature]Component implements OnInit, OnDestroy {
  private readonly facade = inject([Feature]Facade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading$ = new BehaviorSubject(false);
  error$ = new BehaviorSubject<NormalizedError | null>(null);
  items$ = new BehaviorSubject<[Model][]>([]);

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading$.next(true);
    this.error$.next(null);

    this.facade.list()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading$.next(false))
      )
      .subscribe({
        next: (items) => {
          this.items$.next(items);
          this.cdr.markForCheck(); // ← REQUIRED for OnPush
        },
        error: (err) => {
          const normalized = normalizeError(err);
          this.error$.next(normalized);
          this.cdr.markForCheck();
        },
      });
  }

  retry(): void {
    this.load();
  }
}
```

**Acceptance Criteria:**

- Component is standalone + OnPush
- No HTTP calls in component (uses Facade)
- No `any` types
- `markForCheck()` called after async updates
- Compilation succeeds
- Component renders

#### Task 3.2: Add Component Template

- [ ] Create `[feature].component.html` (or inline in `@Component`)
- [ ] Implement UI from design spec
- [ ] Use style tokens (no inline styles)
- [ ] Add ARIA labels for accessibility
- [ ] Test keyboard navigation

**Acceptance Criteria:**

- Template renders without console errors
- Responsive on mobile/tablet/desktop
- WCAG AA compliant

#### Task 3.3: Add Component Styles

- [ ] Create `[feature].component.css`
- [ ] Use Tailwind CSS classes
- [ ] Reference tokens from `src/styles/tokens/variables.css`
- [ ] Avoid inline styles
- [ ] Test dark mode (if applicable)

**Acceptance Criteria:**

- Styles match design spec
- No layout shifts (CLS < 0.1)
- Dark mode works

---

### Workstream 4: Routing & Navigation

**Owner:** [Name]  
**Duration:** 0.5 days

#### Task 4.1: Update Routes

- [ ] Open `src/app/app.routes.ts`
- [ ] Add route entry for new feature:
  ```typescript
  {
    path: '[feature]',
    component: [Feature]Component,
    canActivate: [authGuard], // if needed
    data: { title: '[Feature Title]' },
  }
  ```
- [ ] If lazy loading needed, use `loadComponent:`
- [ ] Test navigation

**Acceptance Criteria:**

- Route loads correct component
- Route guards work (auth, authorization)
- Navigation from other pages works

#### Task 4.2: Update SSR Routes (if needed)

- [ ] Open `src/app/app.routes.server.ts`
- [ ] Add route with prerender or dynamic SSR
- [ ] Test: `npm run serve:ssr:AskAMuslim`

**Acceptance Criteria:**

- Page pre-renders correctly
- Hydration works without errors
- No console warnings

#### Task 4.3: Update Navigation UI

- [ ] Add link to feature in header/navbar (if applicable)
- [ ] Add breadcrumb navigation
- [ ] Test navigation accessibility

**Acceptance Criteria:**

- Users can discover and navigate to feature
- Links are keyboard-accessible

---

### Workstream 5: Error Handling & Resilience

**Owner:** [Name]  
**Duration:** 1 day

#### Task 5.1: Centralized Error Handling

- [ ] Verify `src/app/core/errors/error-normalizer.ts` handles all error types
- [ ] Update error messages to be user-friendly
- [ ] Add logging hook for developer debugging
- [ ] Test with Postman (simulate errors)

**Error Scenarios to Test:**

- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Server Error
- Network timeout

**Acceptance Criteria:**

- All errors normalized consistently
- User sees helpful messages
- Errors logged to console/monitoring
- Retry logic works

#### Task 5.2: Fallback & Empty States

- [ ] Component shows spinner while loading
- [ ] Component shows error message if failed
- [ ] Component shows "No results" if empty
- [ ] Component shows retry button on error

**Acceptance Criteria:**

- All states render correctly
- UX is clear and non-confusing

---

### Workstream 6: Testing & Quality Assurance

**Owner:** [Name]  
**Duration:** 1-2 days

#### Task 6.1: Unit Tests (Facade)

- [ ] Create `[feature].facade.spec.ts`
- [ ] Mock HTTP client
- [ ] Test CRUD methods return expected data
- [ ] Test error handling returns normalized errors
- [ ] Run: `npm run test`

**Acceptance Criteria:**

- All tests pass
- Coverage >= 80% for Facade

#### Task 6.2: Integration Tests (Component + Facade)

- [ ] Test component loads data on init
- [ ] Test component displays data
- [ ] Test component handles errors
- [ ] Test retry functionality
- [ ] Run: `npm run test`

**Acceptance Criteria:**

- All tests pass
- No flaky tests

#### Task 6.3: E2E Testing (Manual)

- [ ] Load page in Chrome
- [ ] Verify data loads
- [ ] Test create/update/delete (if applicable)
- [ ] Test error scenarios
- [ ] Test on mobile device
- [ ] Run Lighthouse audit

**Acceptance Criteria:**

- All flows work as expected
- Lighthouse score >= 80
- No console errors/warnings

#### Task 6.4: Build Validation

- [ ] Run: `npm run build`
- [ ] Verify zero TypeScript errors
- [ ] Verify bundle size (no increase > 10%)
- [ ] Run: `npm run lint`

**Acceptance Criteria:**

- Build succeeds
- No TypeScript errors
- No ESLint violations
- Bundle size acceptable

---

### Workstream 7: Documentation & Commits

**Owner:** [Name]  
**Duration:** 0.5 days

#### Task 7.1: Code Documentation

- [ ] Add JSDoc comments to Facade methods
- [ ] Add inline comments for complex logic
- [ ] Update README if new workflows introduced
- [ ] Add troubleshooting section if needed

**Acceptance Criteria:**

- Code is self-documenting
- Future developers understand intent

#### Task 7.2: Commit History

- [ ] Commit Workstream 1: API contract
- [ ] Commit Workstream 2: Facade
- [ ] Commit Workstream 3: Components
- [ ] Commit Workstream 4: Routes
- [ ] Commit Workstream 5: Error handling
- [ ] Commit Workstream 6: Tests
- [ ] Commit Workstream 7: Docs

**Format:**

```
feat(feature-name): add [feature] component and facade
- Create [Feature]Facade with CRUD methods
- Create [Feature]Component with OnPush strategy
- Add route in app.routes.ts
- Include error handling and loading states
- Add unit and integration tests

[speckit-ref: N-featurename]
```

**Acceptance Criteria:**

- Commits are atomic and logical
- Messages follow convention
- History is clear and traceable

---

## 3. TIMELINE & MILESTONES

| Milestone          | Workstreams | Duration | Deadline | Status |
| ------------------ | ----------- | -------- | -------- | ------ |
| API Contract Ready | WS1         | 0.5 days | TBD      | ⏳     |
| Facade Implemented | WS2         | 1-2 days | TBD      | ⏳     |
| Component Alpha    | WS3         | 2-3 days | TBD      | ⏳     |
| Routing Setup      | WS4         | 0.5 days | TBD      | ⏳     |
| Error Handling     | WS5         | 1 day    | TBD      | ⏳     |
| QA Complete        | WS6         | 1-2 days | TBD      | ⏳     |
| Merged to Main     | WS7         | 0.5 days | TBD      | ⏳     |

**Total Estimate:** 6-11 days

---

## 4. DEPENDENCIES & PREREQUISITES

**Must Be Complete Before Starting:**

- [ ] API endpoints implemented in backend
- [ ] Swagger/OpenAPI spec updated
- [ ] Design wireframes/mockups approved
- [ ] Database schema finalized (if applicable)

**External Blockers:**

- [ ] Backend team confirmation: Endpoints ready by [DATE]
- [ ] Design approval: Completed by [DATE]

---

## 5. RISKS & CONTINGENCY

| Risk                      | Likelihood | Impact | Contingency                                               |
| ------------------------- | ---------- | ------ | --------------------------------------------------------- |
| API endpoints delayed     | MEDIUM     | BLOCKS | Mock API with hardcoded data; swap real endpoint later    |
| Design changes mid-sprint | MEDIUM     | REWORK | Implement MVP first; design phases second                 |
| SSR hydration issues      | LOW        | REWORK | Disable SSR temporarily; fix after feature complete       |
| TypeScript type conflicts | LOW        | BLOCK  | Validate generated models early; update swagger if needed |

---

## 6. SUCCESS HANDOFF

### Checklist for "Done"

- [ ] All commits merged to `main`
- [ ] `npm run build` passes with zero errors
- [ ] `npm run test` passes
- [ ] Lighthouse score >= 80
- [ ] E2E tests all pass
- [ ] Code review approved
- [ ] Documentation complete
- [ ] Deployed to staging (if applicable)

### Demo Preparation

- [ ] Record screen capture of feature in action
- [ ] Prepare talking points
- [ ] Test demo scenario multiple times
- [ ] Have backup plan if live demo fails

---

## 7. POST-IMPLEMENTATION REVIEW

**Scheduled for:** [DATE]

- [ ] Gather team feedback
- [ ] Document lessons learned
- [ ] Update constitution if patterns discovered
- [ ] Plan improvements for next iteration

---

**Plan Version:** 1.0  
**Last Updated:** 2026-03-11
