# Development Tasks Template

**Spec ID:** `N-feature-name`  
**Plan ID:** Reference link to plan-template.md  
**Sprint:** [Sprint number/dates]  
**Owner:** [Developer name]  
**Start Date:** YYYY-MM-DD  
**Target Completion:** YYYY-MM-DD

---

## Task Execution Rules

1. **Work through tasks TOP-TO-BOTTOM** (dependencies matter)
2. **Check off boxes ONLY after verification**
3. **If stuck:** Mark as BLOCKED, document issue, notify team lead
4. **Estimated duration per task:** Listed in brackets `[Xh]`
5. **Total tasks:** Count remaining for burndown tracking

---

## PHASE 1: API CONTRACT ALIGNMENT

### ✓ Task 1.1: Verify API Endpoints in Postman `[30m]`

**Objective:** Confirm backend endpoints exist and match specification.

**Steps:**

1. [ ] Open Postman → "AskAMuslimBackend API Copy" collection
2. [ ] Navigate to folder: `[Endpoint category]`
3. [ ] Locate endpoints:
   - [ ] GET `/api/[resource]` (list with paging)
   - [ ] GET `/api/[resource]/{id}` (get single)
   - [ ] POST `/api/[resource]` (create)
   - [ ] PUT `/api/[resource]/{id}` (update)
   - [ ] DELETE `/api/[resource]/{id}` (delete)
4. [ ] Click each endpoint and verify:
   - [ ] Request parameters defined (query, body, path)
   - [ ] Response schema shows sample data
   - [ ] Success status code (200, 201, etc.)
   - [ ] Error status codes (400, 401, 404, 500)
5. [ ] Send test request to each endpoint (if dev server running)
6. [ ] Document any discrepancies in `ai/api-contracts.md`
7. [ ] Commit findings: `docs: document [feature] API contract`

**Verification:**

- All endpoints respond with valid JSON
- Response models contain expected fields
- No 404 or 500 errors on valid requests

**Blocker If:**

- Endpoints don't exist → Alert backend team
- Response schema incorrect → Request Swagger update

---

### ✓ Task 1.2: Generate OpenAPI Client `[20m]`

**Objective:** Regenerate TypeScript models and API functions from Swagger.

**Steps:**

1. [ ] Navigate to project root in terminal
2. [ ] Run: `npm run swagger:check`
3. [ ] If check FAILS (API changed):
   - [ ] Run: `npm run generate:api`
   - [ ] Verify new files in `src/app/api/models/`
   - [ ] Verify new files in `src/app/api/fn/`
4. [ ] Run: `npm run build` (compiles TypeScript)
5. [ ] Verify NO TypeScript errors:
   - [ ] No red squiggles in src/app/api/
   - [ ] Console shows "✔ Build successful"
6. [ ] Run: `npm run swagger:update` (update hash)
7. [ ] Commit: `chore: regenerate OpenAPI client [speckit-ref: N-feature]`

**Verification:**

- Terminal shows: "Build successful"
- `npm run swagger:check` passes
- No TypeScript errors in generated files

**Blocker If:**

- Generation fails → Check swagger.json validity
- Build fails → Generated models incompatible (alert backend)

---

### ✓ Task 1.3: Document Generated Types `[15m]`

**Objective:** Review and document new API types for component usage.

**Steps:**

1. [ ] Open `src/app/api/models/index.ts`
2. [ ] Identify new models introduced:
   - [ ] Main entity: `[Feature]` or similar
   - [ ] Request DTOs: `Create[Feature]Request`, `Update[Feature]Request`
   - [ ] Response DTOs: `[Feature]Response`, `[Feature]ListResponse` (with paging)
3. [ ] Review each model in IDE (hover to see types)
4. [ ] Create cheat-sheet in `ai/api-contracts.md`:
   ```markdown
   ### [Feature] API Types

   - **Model:** [FeatureName] { id, name, createdAt, ... }
   - **Create Request:** { name, ... }
   - **Update Request:** { name?, ... } (partial)
   - **List Response:** { items: [Feature][], pageNumber, pageSize, total }
   ```
5. [ ] Store in project memory for quick reference

**Verification:**

- Types are documented and understood
- Ready to create Facade using these types

**Blocker If:**

- Models are poorly typed (contain `any`) → escalate to backend

---

## PHASE 2: FACADE LAYER IMPLEMENTATION

### ✓ Task 2.1: Create Facade Service File `[45m]`

**Objective:** Build data mapping layer between API and components.

**Steps:**

1. [ ] Create file: `src/app/api/facades/[feature].facade.ts`
2. [ ] Copy template (see below)
3. [ ] Update class name: `[Feature]Facade`
4. [ ] Import generated API functions:
   - [ ] Review `src/app/api/fn/index.ts`
   - [ ] Identify functions for CRUD operations
   - [ ] Import: `import { list[Feature], create[Feature], ... } from '../fn/...'`
5. [ ] Import generated models:
   - [ ] `import { [Feature], Create[Feature]Request, ... } from '../models'`
6. [ ] Implement methods with error handling:
   ```typescript
   list(params?: PagingParams): Observable<[Feature][]> {
     return list[Feature](params).pipe(
       map(response => response.items || []),
       catchError(err => {
         const normalized = normalizeError(err);
         this.logError('Failed to list features', normalized);
         return throwError(() => normalized);
       })
     );
   }
   ```
7. [ ] Run: `npm run build`
8. [ ] Verify NO TypeScript errors

**Facade Template:**

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import {
  list[Feature],
  get[Feature],
  create[Feature],
  update[Feature],
  delete[Feature]
} from '../fn/[feature]-api';
import {
  [Feature],
  Create[Feature]Request,
  Update[Feature]Request
} from '../models';
import { normalizeError } from '../../core/errors/error-normalizer';
import { PagingParams } from '../models/paging-params';

@Injectable({ providedIn: 'root' })
export class [Feature]Facade {
  private readonly logger = console; // Or inject LoggerService

  list(params?: PagingParams): Observable<[Feature][]> {
    return list[Feature](params).pipe(
      // API returns array or paginated response
      tap(data => this.logger.log('[Feature] list loaded:', data)),
      catchError(err => {
        const normalized = normalizeError(err);
        this.logger.error('[Feature] list failed:', normalized);
        return throwError(() => normalized);
      })
    );
  }

  get(id: string): Observable<[Feature]> {
    return get[Feature]({ id }).pipe(
      catchError(err => throwError(() => normalizeError(err)))
    );
  }

  create(dto: Create[Feature]Request): Observable<[Feature]> {
    return create[Feature]({ body: dto }).pipe(
      tap(created => this.logger.log('[Feature] created:', created)),
      catchError(err => throwError(() => normalizeError(err)))
    );
  }

  update(id: string, dto: Update[Feature]Request): Observable<[Feature]> {
    return update[Feature]({ id, body: dto }).pipe(
      tap(updated => this.logger.log('[Feature] updated:', updated)),
      catchError(err => throwError(() => normalizeError(err)))
    );
  }

  delete(id: string): Observable<void> {
    return delete[Feature]({ id }).pipe(
      tap(() => this.logger.log('[Feature] deleted:', id)),
      catchError(err => throwError(() => normalizeError(err)))
    );
  }
}
```

**Verification:**

- Build succeeds with NO TypeScript errors
- Facade imports cleanly
- Methods accept expected parameters
- Return types are Observable<Model>

**Blocker If:**

- Generated API functions don't exist → regenerate with `npm run generate:api`
- Type mismatches → check generated models in IDE

---

### ✓ Task 2.2: Add Paging Support (if applicable) `[30m]`

**Objective:** Implement pagination for list operations.

**Steps:**

1. [ ] Review Postman API: GET `/api/[resource]`
2. [ ] Verify request params: `pageNumber`, `pageSize`
3. [ ] Verify response format: `{ items: [...], pageNumber, pageSize, total }`
4. [ ] Update Facade list method:
   ```typescript
   list(pageNumber: number = 1, pageSize: number = 10): Observable<[Feature][]> {
     return list[Feature]({ pageNumber, pageSize }).pipe(
       map(response => response.items || []),
       catchError(err => throwError(() => normalizeError(err)))
     );
   }
   ```
5. [ ] Optional: Create PagingParams interface:
   ```typescript
   export interface PagingParams {
     pageNumber: number;
     pageSize: number;
   }
   ```
6. [ ] Run: `npm run build`

**Verification:**

- Facade accepts paging parameters
- API receives correct page/size
- Postman test with paging works

---

### ✓ Task 2.3: Export Facade from Barrel Module `[10m]`

**Objective:** Make Facade easily importable by components.

**Steps:**

1. [ ] Check if `src/app/api/facades/index.ts` exists
2. [ ] If YES:
   - [ ] Add: `export * from './[feature].facade';`
3. [ ] If NO:
   - [ ] Create `src/app/api/facades/index.ts`
   - [ ] Add: `export * from './[feature].facade';`
4. [ ] Verify import works in IDE:
   - [ ] Open any component file
   - [ ] Type: `import { [Feature]Facade } from '../facades'`
   - [ ] IDE autocomplete shows facade
5. [ ] Run: `npm run build`

**Verification:**

- Facade is importable from `../facades`
- No import errors in build

---

## PHASE 3: COMPONENT IMPLEMENTATION

### ✓ Task 3.1: Create Component File `[1h]`

**Objective:** Build standalone Angular component with OnPush strategy.

**Steps:**

1. [ ] Create directory: `src/app/pages/[feature]/` (if not exists)
2. [ ] Create file: `[feature].component.ts`
3. [ ] Copy template (see below):

   ```typescript
   import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { FormsModule } from '@angular/forms';
   import { Subject, BehaviorSubject } from 'rxjs';
   import { takeUntil, finalize } from 'rxjs/operators';
   import { [Feature]Facade } from '../../api/facades';
   import { [Feature] } from '../../api/models';
   import { NormalizedError } from '../../core/errors/error-normalizer';

   @Component({
     selector: 'app-[feature]',
     standalone: true,
     imports: [CommonModule, FormsModule],
     changeDetection: ChangeDetectionStrategy.OnPush,
     templateUrl: './ [feature].component.html',
     styleUrls: ['./ [feature].component.css'],
   })
   export class [Feature]Component implements OnInit, OnDestroy {
     // Dependencies
     private readonly facade = inject([Feature]Facade);
     private readonly cdr = inject(ChangeDetectorRef);
     private readonly destroy$ = new Subject<void>();

     // State as BehaviorSubject
     readonly loading$ = new BehaviorSubject(false);
     readonly error$ = new BehaviorSubject<NormalizedError | null>(null);
     readonly items$ = new BehaviorSubject<[Feature][]>([]);
     readonly currentPage$ = new BehaviorSubject(1);
     readonly pageSize$ = new BehaviorSubject(10);

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

       const page = this.currentPage$.value;
       const size = this.pageSize$.value;

       this.facade.list({ pageNumber: page, pageSize: size })
         .pipe(
           takeUntil(this.destroy$),
           finalize(() => this.loading$.next(false))
         )
         .subscribe({
           next: (items) => {
             this.items$.next(items);
             this.cdr.markForCheck(); // ← CRITICAL for OnPush
           },
           error: (err) => {
             this.error$.next(err);
             this.cdr.markForCheck();
           },
         });
     }

     retry(): void {
       this.load();
     }

     nextPage(): void {
       this.currentPage$.next(this.currentPage$.value + 1);
       this.load();
     }

     prevPage(): void {
       const current = this.currentPage$.value;
       if (current > 1) {
         this.currentPage$.next(current - 1);
         this.load();
       }
     }
   }
   ```

4. [ ] Verify key patterns:
   - [ ] `standalone: true` present
   - [ ] `ChangeDetectionStrategy.OnPush` set
   - [ ] `destroy$` subject for cleanup
   - [ ] `cdr.markForCheck()` after async updates
   - [ ] `takeUntil(destroy$)` on all subscriptions
5. [ ] Run: `npm run build`

**Verification:**

- Component compiles with NO TypeScript errors
- No red squiggles in IDE
- Component is standalone

**Blocker If:**

- Facade import fails → check barrel export
- Template file missing → create in next task

---

### ✓ Task 3.2: Create Component Template `[45m]`

**Objective:** Build HTML with loading, error, and data states.

**Steps:**

1. [ ] Create file: `[feature].component.html`
2. [ ] Implement loading state:
   ```html
   <div *ngIf="loading$ | async" class="flex justify-center items-center h-screen">
     <div class="spinner"></div>
     <p>Loading...</p>
   </div>
   ```
3. [ ] Implement error state:
   ```html
   <div *ngIf="error$ | async as err" class="bg-red-50 border border-red-200 p-4 rounded">
     <p class="text-red-700 font-bold">{{ err.message }}</p>
     <button (click)="retry()" class="mt-2 bg-red-600 text-white px-4 py-2 rounded">Retry</button>
   </div>
   ```
4. [ ] Implement data state:
   ```html
   <div *ngIf="(items$ | async) as items; else empty">
     <div *ngFor="let item of items" class="border p-4 mb-4 rounded">
       <h3 class="font-bold">{{ item.name }}</h3>
       <p>{{ item.description }}</p>
       <small>Created: {{ item.createdAt | date }}</small>
     </div>
   </div>
   <ng-template #empty>
     <p class="text-gray-500">No items found</p>
   </ng-template>
   ```
5. [ ] Add pagination controls (if applicable):
   ```html
   <div class="flex justify-between mt-4">
     <button (click)="prevPage()" [disabled]="(currentPage$ | async) === 1">Previous</button>
     <span>Page {{ currentPage$ | async }}</span>
     <button (click)="nextPage()">Next</button>
   </div>
   ```
6. [ ] Accessibility checks:
   - [ ] Form labels associated with inputs
   - [ ] Buttons have meaningful text
   - [ ] ARIA labels for icons (if used)
   - [ ] Keyboard navigation works (Tab, Enter)
7. [ ] Visual verification:
   - [ ] Layout matches design spec
   - [ ] Typography is readable
   - [ ] Colors have sufficient contrast

**Verification:**

- Component renders without console errors
- Loading spinner appears
- Error message appears (test by triggering error)
- Data displays correctly
- Pagination works (if implemented)

---

### ✓ Task 3.3: Add Component Styles `[30m]`

**Objective:** Style component using Tailwind CSS and design tokens.

**Steps:**

1. [ ] Create file: `[feature].component.css`
2. [ ] OR use `styleUrls: []` in component
3. [ ] Apply Tailwind classes in HTML template:
   - [ ] Spacing: `p-4`, `mb-4`, `mt-2`
   - [ ] Layout: `flex`, `grid`, `flex-col`
   - [ ] Text: `font-bold`, `text-gray-500`, `text-sm`
   - [ ] Colors: Use design tokens from `variables.css`
4. [ ] If custom CSS needed:
   - [ ] Reference `src/styles/tokens/variables.css`
   - [ ] Use CSS variables: `color: var(--primary-color);`
5. [ ] Test responsive design:
   - [ ] Open DevTools (F12)
   - [ ] Toggle device toolbar (Ctrl+Shift+M)
   - [ ] Test: Mobile (320px), Tablet (768px), Desktop (1024px)
6. [ ] Test dark mode (if applicable):
   - [ ] Open DevTools
   - [ ] Press Ctrl+Shift+P → "dark"
   - [ ] Verify contrast and readability

**Verification:**

- Component renders without style warnings
- Responsive on all screen sizes
- Dark mode works (if applicable)
- No layout shifts (Cumulative Layout Shift < 0.1)

---

### ✓ Task 3.4: Link Component Template & Styles `[10m]`

**Objective:** Ensure template and styles are properly linked in component.

**Steps:**

1. [ ] In component:
   ```typescript
   @Component({
     selector: 'app-[feature]',
     standalone: true,
     imports: [CommonModule, FormsModule],
     templateUrl: './[feature].component.html', // ← Correct path
     styleUrls: ['./[feature].component.css'],
     changeDetection: ChangeDetectionStrategy.OnPush,
   })
   ```
2. [ ] Verify file paths:
   - [ ] `templateUrl` points to existing `.html` file
   - [ ] `styleUrls` points to existing `.css` file
3. [ ] Run: `npm run build`
4. [ ] Verify NO TypeScript errors

**Verification:**

- Build succeeds
- Component renders correctly
- Template and styles apply

---

## PHASE 4: ROUTING & NAVIGATION

### ✓ Task 4.1: Add Route to App Routes `[20m]`

**Objective:** Register component in routing configuration.

**Steps:**

1. [ ] Open `src/app/app.routes.ts`
2. [ ] Import component:
   ```typescript
   import { [Feature]Component } from './pages/[feature]/[feature].component';
   ```
3. [ ] Add route entry to `routes` array:
   ```typescript
   {
     path: '[feature]',
     component: [Feature]Component,
     // canActivate: [authGuard],  // Add if auth-required
     data: { title: '[Feature Title]' },
   }
   ```
4. [ ] For lazy loading (optional):
   ```typescript
   {
     path: '[feature]',
     loadComponent: () => import('./pages/[feature]/[feature].component')
       .then(m => m.[Feature]Component),
     data: { title: '[Feature Title]' },
   }
   ```
5. [ ] Run: `npm run build`
6. [ ] Test route:
   - [ ] Start dev server: `npm start`
   - [ ] Navigate to: `http://localhost:4200/[feature]`
   - [ ] Verify component loads

**Verification:**

- Route resolves without 404
- Component renders
- No console errors

---

### ✓ Task 4.2: Test Navigation `[15m]`

**Objective:** Verify navigation flows work end-to-end.

**Steps:**

1. [ ] Start dev server: `npm start`
2. [ ] Open Chrome to `http://localhost:4200`
3. [ ] Navigate to new feature:
   - [ ] Via direct URL: `/[feature]`
   - [ ] Via back button (if came from another page)
   - [ ] Verify previous state is preserved (if applicable)
4. [ ] Test breadcrumb (if implemented):
   - [ ] Click breadcrumb link
   - [ ] Verify correct page loads
5. [ ] Test keyboard navigation:
   - [ ] Press Tab key repeatedly
   - [ ] Verify focus moves through interactive elements
   - [ ] Press Enter on buttons
   - [ ] Verify actions trigger
6. [ ] Test auth guard (if applicable):
   - [ ] Log out
   - [ ] Try to access `/[feature]`
   - [ ] Verify redirect to login

**Verification:**

- All navigation flows work
- No 404 errors
- Focus management works
- Auth guards block unauthorized access

---

## PHASE 5: ERROR HANDLING & RESILIENCE

### ✓ Task 5.1: Test Error Scenarios `[1h]`

**Objective:** Verify error handling works in all cases.

**Steps:**

1. [ ] Stop dev server and backend (if possible)
2. [ ] Start dev server: `npm start`
3. [ ] Open Chrome DevTools (F12) → Network tab
4. [ ] Test network error (connection timeout):
   - [ ] Throttle network: DevTools → Network tab → Slow 3G
   - [ ] Load component
   - [ ] Verify timeout error displayed
   - [ ] Verify retry button works
5. [ ] Test 404 (not found):
   - [ ] In Postman, test invalid resource ID
   - [ ] Verify 404 response
   - [ ] In component, manually trigger 404 request
   - [ ] Verify error message: "Resource not found"
6. [ ] Test 401 (unauthorized):
   - [ ] Log out or clear auth token
   - [ ] Try to access protected resource
   - [ ] Verify redirect to login
7. [ ] Test 500 (server error):
   - [ ] In Postman, trigger server error (if possible)
   - [ ] Verify user-friendly message appears
   - [ ] Verify error logged to console (for debugging)

**Verification:**

- All error types display user-friendly messages
- Retry works
- No unexpected console errors

---

### ✓ Task 5.2: Add Fallback/Empty States `[20m]`

**Objective:** Ensure component handles empty and edge cases gracefully.

**Steps:**

1. [ ] Add empty state template (already in Task 3.2):
   ```html
   <ng-template #empty>
     <p class="text-gray-500 text-center py-8">No items found</p>
     <!-- Add illustration or helpful message -->
   </ng-template>
   ```
2. [ ] Test empty state:
   - [ ] Manually filter to 0 results
   - [ ] Verify "No items" message displays
   - [ ] Verify it's not confusing with error state
3. [ ] Add loading skeleton (optional, for UX):
   - [ ] Create skeleton component or use CSS
   - [ ] Display while data loads
   - [ ] Matches content layout
4. [ ] Verify all states render:
   - [ ] Loading: Spinner visible
   - [ ] Data: List visible
   - [ ] Error: Error message visible
   - [ ] Empty: "No items" visible

**Verification:**

- All states render correctly
- Transitions are smooth
- UX is clear (not confusing)

---

## PHASE 6: TESTING & QUALITY ASSURANCE

### ✓ Task 6.1: Unit Tests for Facade `[1h]`

**Objective:** Write spec tests for Facade methods.

**Steps:**

1. [ ] Create file: `src/app/api/facades/[feature].facade.spec.ts`
2. [ ] Write test template:

   ```typescript
   import { TestBed } from '@angular/core/testing';
   import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
   import { [Feature]Facade } from './[feature].facade';
   import { [Feature] } from '../models';

   describe('[Feature]Facade', () => {
     let facade: [Feature]Facade;
     let httpMock: HttpTestingController;

     beforeEach(() => {
       TestBed.configureTestingModule({
         imports: [HttpClientTestingModule],
         providers: [[Feature]Facade],
       });
       facade = TestBed.inject([Feature]Facade);
       httpMock = TestBed.inject(HttpTestingController);
     });

     afterEach(() => {
       httpMock.verify(); // Ensure no outstanding HTTP requests
     });

     it('should list items', () => {
       const mockItems: [Feature][] = [
         { id: '1', name: 'Item 1', createdAt: new Date() },
       ];

       facade.list().subscribe(items => {
         expect(items.length).toBe(1);
         expect(items[0].name).toBe('Item 1');
       });

       const req = httpMock.expectOne(req => req.url.includes('[feature]'));
       expect(req.request.method).toBe('GET');
       req.flush(mockItems);
     });

     it('should handle errors gracefully', () => {
       facade.list().subscribe(
         () => fail('should have failed'),
         (err) => {
           expect(err.code).toBeDefined();
           expect(err.message).toBeDefined();
         }
       );

       const req = httpMock.expectOne(req => req.url.includes('[feature]'));
       req.error(new ErrorEvent('Network error'));
     });
   });
   ```

3. [ ] Write tests for each Facade method:
   - [ ] `list()` - returns array
   - [ ] `get(id)` - returns single item
   - [ ] `create()` - POST with body
   - [ ] `update()` - PUT with id and body
   - [ ] `delete()` - DELETE with id
4. [ ] Test error scenarios:
   - [ ] 400 Bad Request
   - [ ] 401 Unauthorized
   - [ ] 404 Not Found
   - [ ] 500 Server Error
5. [ ] Run: `npm run test`
6. [ ] Verify all tests pass
7. [ ] Check coverage: `npm run test -- --code-coverage`

**Verification:**

- All tests pass
- Coverage >= 80%
- No red squiggles in spec file

---

### ✓ Task 6.2: Integration Tests for Component `[1h]`

**Objective:** Test component + Facade together.

**Steps:**

1. [ ] Create file: `[feature].component.spec.ts`
2. [ ] Write test template:

   ```typescript
   import { ComponentFixture, TestBed } from '@angular/core/testing';
   import { [Feature]Component } from './[feature].component';
   import { [Feature]Facade } from '../../api/facades';
   import { of, throwError } from 'rxjs';
   import { [Feature] } from '../../api/models';

   describe('[Feature]Component', () => {
     let component: [Feature]Component;
     let fixture: ComponentFixture<[Feature]Component>;
     let facadeMock: jasmine.SpyObj<[Feature]Facade>;

     beforeEach(async () => {
       facadeMock = jasmine.createSpyObj('[Feature]Facade', ['list', 'create', 'update', 'delete']);

       await TestBed.configureTestingModule({
         imports: [[Feature]Component],
         providers: [
           { provide: [Feature]Facade, useValue: facadeMock }
         ],
       }).compileComponents();

       fixture = TestBed.createComponent([Feature]Component);
       component = fixture.componentInstance;
     });

     it('should load items on init', () => {
       const mockItems: [Feature][] = [
         { id: '1', name: 'Test', createdAt: new Date() },
       ];

       facadeMock.list.and.returnValue(of(mockItems));
       fixture.detectChanges(); // ngOnInit

       expect(component.items$.value).toEqual(mockItems);
       expect(facadeMock.list).toHaveBeenCalled();
     });

     it('should display error message on failure', () => {
       const mockError = { message: 'Load failed', code: 'ERR_500' };

       facadeMock.list.and.returnValue(throwError(() => mockError));
       fixture.detectChanges();

       expect(component.error$.value).toEqual(mockError);
     });

     it('should retry on retry button click', () => {
       facadeMock.list.and.returnValue(of([]));
       component.retry();

       expect(facadeMock.list).toHaveBeenCalled();
     });
   });
   ```

3. [ ] Test user interactions:
   - [ ] Load items
   - [ ] Display error
   - [ ] Retry
   - [ ] Pagination (if applicable)
4. [ ] Run: `npm run test`
5. [ ] Verify all tests pass

**Verification:**

- All tests pass
- Component properly displays facade data
- Error handling works

---

### ✓ Task 6.3: E2E Manual Testing `[1h]`

**Objective:** Test feature end-to-end in real browser.

**Checklist:**

1. [ ] Start dev server: `npm start`
2. [ ] Open `http://localhost:4200/[feature]`
3. [ ] **Load Test:**
   - [ ] Data loads successfully
   - [ ] Spinner briefly appears
   - [ ] No console errors
4. [ ] **Display Test:**
   - [ ] Items match API response
   - [ ] Formatting is correct
   - [ ] Responsive layout works
5. [ ] **Interaction Test (if applicable):**
   - [ ] Click "Create" button → modal opens
   - [ ] Fill form → submit → item added
   - [ ] Click "Edit" → modal opens with data pre-filled
   - [ ] Click "Delete" → confirmation → item removed
6. [ ] **Pagination Test (if applicable):**
   - [ ] Show 10 items per page
   - [ ] Click "Next" → next page loads
   - [ ] Click "Previous" → previous page loads
   - [ ] Verify correct items display
7. [ ] **Error Test:**
   - [ ] Throttle network to offline
   - [ ] Try to load → error message appears
   - [ ] Throttle back to normal
   - [ ] Click "Retry" → loads successfully
8. [ ] **Accessibility Test:**
   - [ ] Press Tab → focus moves through controls
   - [ ] Press Enter on buttons → action triggers
   - [ ] Screen reader (NVDA/JAWS) reads page correctly
9. [ ] **Mobile Test:**
   - [ ] DevTools → toggle device toolbar
   - [ ] Test on iPhone 12 (390px)
   - [ ] Test on iPad (768px)
   - [ ] Layout responsive, text readable

**Verification:**

- All features work as expected
- No console errors
- Responsive and accessible

---

### ✓ Task 6.4: Build & Lint Validation `[15m]`

**Objective:** Ensure code quality and performance.

**Steps:**

1. [ ] Run build:
   ```bash
   npm run build
   ```
2. [ ] Verify output:
   - [ ] Terminal shows "Build successful"
   - [ ] `dist/AskAMuslim/` folder created
   - [ ] NO TypeScript errors
   - [ ] NO Angular warnings
3. [ ] Check bundle size:
   - [ ] Compare size before/after
   - [ ] Alert if increase > 10% (50KB)
4. [ ] Run linter:
   ```bash
   npm run lint
   ```
5. [ ] Fix linting issues:
   - [ ] ESLint errors (auto-fix if possible)
   - [ ] Style consistency issues
6. [ ] Stop dev server before proceeding

**Verification:**

- Build succeeds
- No TypeScript errors
- Linter passes
- Bundle size acceptable

---

## PHASE 7: DOCUMENTATION & VERSIONING

### ✓ Task 7.1: Commit API Contract Code `[10m]`

**Steps:**

1. [ ] Stage files:
   ```bash
   git add src/app/api/models/* src/app/api/fn/* src/app/api/models.ts
   ```
2. [ ] Commit:

   ```bash
   git commit -m "chore: regenerate OpenAPI client for [feature]

   - Generated models: [FeatureName]
   - Generated functions: list, get, create, update, delete
   - Swagger hash updated

   [speckit-ref: N-featurename]"
   ```

3. [ ] Verify: `git log --oneline | head -1`

---

### ✓ Task 7.2: Commit Facade Implementation `[10m]`

**Steps:**

1. [ ] Stage files:
   ```bash
   git add src/app/api/facades/[feature].facade.ts src/app/api/facades/[feature].facade.spec.ts
   ```
2. [ ] Commit:

   ```bash
   git commit -m "feat(facade): add [Feature]Facade with error handling

   - CRUD operations: list, get, create, update, delete
   - Centralized error normalization
   - Unit tests with 80% coverage
   - Paging support: pageNumber, pageSize

   [speckit-ref: N-featurename]"
   ```

---

### ✓ Task 7.3: Commit Component & Template `[10m]`

**Steps:**

1. [ ] Stage files:
   ```bash
   git add src/app/pages/[feature]/*.ts src/app/pages/[feature]/*.html src/app/pages/[feature]/*.css src/app/pages/[feature]/*.spec.ts
   ```
2. [ ] Commit:

   ```bash
   git commit -m "feat(component): add [Feature] page with list and detail views

   - Standalone component with OnPush change detection
   - Async state management via signal + facade
   - Loading, error, empty states
   - Pagination support
   - Unit and integration tests

   [speckit-ref: N-featurename]"
   ```

---

### ✓ Task 7.4: Commit Routing `[5m]`

**Steps:**

1. [ ] Stage:
   ```bash
   git add src/app/app.routes.ts
   ```
2. [ ] Commit:

   ```bash
   git commit -m "feat(routing): add [feature] route

   - Path: /[feature]
   - Component: [Feature]Component
   - Title: [Feature Title]

   [speckit-ref: N-featurename]"
   ```

---

### ✓ Task 7.5: Add Feature Documentation `[20m]`

**Objective:** Document feature for future developers.

**Steps:**

1. [ ] Update or create `ai/architecture.md`:
   - [ ] Document new layer: "### [Feature] Facade"
   - [ ] Document new route: "### [Feature] Page"
   - [ ] Document any gotchas
2. [ ] Add JSDoc comments in component:
   ```typescript
   /**
    * Displays list of [Features] with pagination and filtering.
    * Loads data from [Feature]Facade.
    * Handles loading, error, and empty states.
    * @remarks Standalone component with OnPush change detection
    */
   ```
3. [ ] Add troubleshooting guide:
   - [ ] "If component doesn't render: Check that Facade returns Observable"
   - [ ] "If pagination doesn't work: Verify API supports pageNumber/pageSize"
4. [ ] Commit:

   ```bash
   git commit -m "docs: add [feature] documentation

   - Architecture overview
   - Component and Facade description
   - Troubleshooting guide

   [speckit-ref: N-featurename]"
   ```

---

### ✓ Task 7.6: Final Build Verification `[10m]`

**Objective:** Ensure everything integrates correctly.

**Steps:**

1. [ ] Run final build:
   ```bash
   npm run build
   ```
2. [ ] Verify:
   - [ ] Build successful
   - [ ] NO TypeScript errors
   - [ ] NO Angular warnings
   - [ ] dist folder created
3. [ ] Run tests:
   ```bash
   npm run test
   ```
4. [ ] Verify:
   - [ ] All tests pass
   - [ ] Coverage >= 75%
5. [ ] Run linter:
   ```bash
   npm run lint
   ```
6. [ ] Verify:
   - [ ] NO ESLint errors
7. [ ] Ready for code review!

**Verification:**

- Build: ✅
- Tests: ✅
- Lint: ✅

---

## FINAL CHECKLIST

Verify before marking ALL tasks complete:

- [ ] All tasks in this document are checked OFF
- [ ] `npm run build` passes with NO errors
- [ ] `npm run test` passes with 75%+ coverage
- [ ] `npm run lint` passes
- [ ] 5+ commits in git history (one per phase)
- [ ] Documentation updated
- [ ] Code reviewed by team lead
- [ ] Feature tested on mobile/tablet/desktop
- [ ] Accessibility verified (keyboard, ARIA)
- [ ] Ready for merge to `main` branch

---

## BURNDOWN TRACKING

- **Total Tasks:** 40+ (counted above)
- **Completion Target:** 100% by [TARGET DATE]
- **Weekly Checkpoints:** [Add dates]

**Update this table as you progress:**

| Date       | Completed | Remaining | Status           |
| ---------- | --------- | --------- | ---------------- |
| 2026-03-11 | 0%        | 40+       | ⏳ Starting      |
| 2026-03-12 | 25%       | 30        | ⏳ In Progress   |
| 2026-03-13 | 50%       | 20        | ⏳ On Track      |
| 2026-03-14 | 75%       | 10        | ⏳ Near Complete |
| 2026-03-15 | 100%      | 0         | ✅ COMPLETE      |

---

**Task List Version:** 1.0  
**Last Updated:** 2026-03-11  
**Status:** READY FOR EXECUTION
