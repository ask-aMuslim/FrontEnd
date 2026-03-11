# AskAMuslim Project Constitution

**Version:** 1.0  
**Last Updated:** 2026-03-11  
**Governance Model:** Speckit Architectural Compliance

---

## 1. PROJECT IDENTITY

**Project Name:** AskAMuslim  
**Description:** A comprehensive Islamic knowledge platform with Q&A, courses, and community features.  
**Mission:** Provide accessible, accurate Islamic education through interactive learning experiences.

---

## 2. CORE TECH STACK (IMMUTABLE)

### Runtime & Language

- **Framework:** Angular 20.3.17 (latest LTS)
- **Language:** TypeScript 5.x (strict mode MANDATORY)
- **Runtime:** Node.js 20.x LTS
- **Change Detection:** Zoneless (`provideZonelessChangeDetection()`)

### State Management

- **Pattern:** Signal-based reactivity (Angular Signals)
- **Principles:** NO BehaviorSubject, NO Observable-first patterns
- **Immutability:** All state mutations must be signal-safe (computed signals, signal.set())

### HTTP & API

- **API Layer:** OpenAPI generated client via `ng-openapi-gen`
- **Architecture:** Generated Fn → Facades → Core Services → Components
- **Base URL (Dev):** `/api` (relative, injected via `provideApiConfiguration`)
- **Versioning:** OpenAPI 3.x contract-first

### Styling & Design

- **Framework:** Tailwind CSS v4
- **Component Library:** Flowbite v3.1.2
- **Design System:** Custom design tokens (`/src/styles/tokens/variables.css`)
- **Icons:** Font Awesome 7.1.0
- **Approach:** CSS-first, NO inline styles

### UI/UX Critical Libraries

- **Rich Text Editing:** Tiptap 3.20.1 (with custom Viewer component)
- **Animations:** GSAP 3.13.0, AOS 2.3.4
- **PDF Export:** jsPDF 4.2.0
- **DOM Sanitization:** DOMPurify 3.3.2

### Authentication & Social

- **OAuth2 Providers:** Google, Facebook
- **Library:** `@abacritt/angularx-social-login` v2.5.1
- **Pattern:** OAuth delegated tokens + JWT refresh

### Server-Side Rendering

- **Framework:** Angular SSR (@angular/ssr 20.3.17)
- **Server:** Express 5.1.0
- **Strategy:** Prerender + dynamic SSR for auth-dependent routes
- **Hydration:** Full hydration with ClientHydration strategy

---

## 3. ARCHITECTURE PATTERNS (UNBREAKABLE)

### Directory Structure

```
src/app/
├── api/                      # Generated OpenAPI client (READ-ONLY)
│   ├── fn/                   # Generated service functions
│   ├── models/               # Generated types
│   ├── facades/              # Data mapping layer (CUSTOM)
│   └── request-builder.ts    # Shared request utilities (CUSTOM)
│
├── core/                     # Business logic, auth, guards
│   ├── auth/                 # Authentication state & guards
│   ├── services/             # Domain services (Facades consumer)
│   ├── errors/               # Error normalization (CENTRAL)
│   ├── guards/               # Route guards (lazy loading, auth)
│   ├── http/                 # Interceptors (auth, loading, error)
│   ├── models/               # Shared types & enums
│   └── helpers/              # Pure utility functions
│
├── pages/                    # Feature modules (LAZY-LOADED)
│   ├── home/
│   ├── academy/
│   ├── ask-and-contact/
│   ├── account/
│   └── [feature]/            # Each is a self-contained feature
│
├── shared/                   # Reusable UI components & utilities
│   ├── reusable-components/  # Generic UI components
│   ├── layouts/              # App layout shells
│   └── pipes/                # Custom transformation pipes
│
├── app.routes.ts             # Client-side routing (CSR)
├── app.routes.server.ts      # Server-side rendering (SSR)
├── app.config.ts             # Application bootstrap config
└── app.ts                    # Root component
```

### Component Architecture

**RULE: All Components Must Be STANDALONE**

```typescript
// ✅ CORRECT: Standalone Component
@Component({
  selector: "app-example",
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
})
export class ExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private service: MyService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.service.data$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      // This triggers change detection
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ❌ WRONG: NgModule-based component
```

### Data Flow Pattern (Mandatory)

```
User Action
    ↓
Component calls Facade method
    ↓
Facade calls generated API function & maps response
    ↓
Facade returns Observable/Signal
    ↓
Component subscribes with takeUntil(destroy$)
    ↓
Component calls cdr.markForCheck() if OnPush + async
    ↓
Template renders via async pipe or signals
```

### State Management Pattern

```typescript
// ✅ CORRECT: Signal-based state
export class MyStore {
  private readonly store = inject(MongooseService);

  // Private signals
  private readonly _data = signal<DataType[]>([]);
  private readonly _loading = signal(false);

  // Public read-only signals
  data = this._data.asReadonly();
  loading = this._loading.asReadonly();

  // Computed derived state
  nonEmpty = computed(() => this._data().length > 0);

  // Methods update state
  loadData(): void {
    this._loading.set(true);
    this.store
      .fetchData()
      .pipe(
        tap((data) => this._data.set(data)),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }
}

// ❌ WRONG: Observable-first (old pattern)
```

### Error Handling (Centralized)

**RULE: All errors must flow through `error-normalizer.ts`**

```typescript
// Located: src/app/core/errors/error-normalizer.ts
export interface NormalizedError {
  code: string;
  message: string; // User-facing
  details?: unknown; // Dev-facing
  statusCode: number;
}

// In HTTP interceptor or service:
try {
  return this.http.get(url).pipe(catchError((err) => throwError(() => normalizeError(err))));
} catch (err) {
  const normalized = normalizeError(err);
  // Log, display user message, etc.
}
```

### Change Detection Strategy

**RULE: ALL Components use `ChangeDetectionStrategy.OnPush`**

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // MANDATORY
})
export class MyComponent {
  constructor(private cdr: ChangeDetectorRef) {}

  // Async subscriptions require markForCheck()
  ngOnInit(): void {
    this.service.data$.subscribe((data) => {
      this._data.set(data);
      this.cdr.markForCheck(); // REQUIRED when subscribed
    });
  }
}
```

---

## 4. GOVERNANCE & VERSIONING

### Speckit Compliance Levels

**Agent Compliance Level: STRICT**

- **Agents MUST follow constitution.md without deviation**
- **Feature specs MUST be pre-approved by human architect before coding**
- **All generated API changes MUST trigger `npm run api:sync` validation**
- **Build MUST pass with zero TypeScript errors before commit**
- **No hot-fixes to core files** (auth, error-normalizer, interceptors)

### Git & Commit Discipline

- **Commit Message Format:** `type(scope): description [speckit-ref: spec-id]`
  - `feat(auth): add social login [speckit-ref: 1-social-auth]`
  - `fix(quiz): guard duplicate submission [speckit-ref: 2-quiz]`
  - `refactor(api): align facade pattern [speckit-ref: 0-baseline]`

### Code Review Checklist (Before Merge)

```markdown
- [ ] Component is standalone + OnPush
- [ ] No HTTP calls in component
- [ ] Signal-based state (if Facade needed)
- [ ] Error handling path exits gracefully
- [ ] TypeScript strict mode compliance
- [ ] NO inline styles
- [ ] NO any types
- [ ] markForCheck() applied after async subscriptions
- [ ] takeUntil(destroy$) pattern on subscriptions
- [ ] Build passes: npm run build
- [ ] Tests pass: npm run test
```

### Version Control

- **Angular:** 20.3.17 (pinned, NO upgrades without constitution amendment)
- **TypeScript:** 5.x (strict mode always ON)
- **Feature Versioning:** Spec IDs increment (0, 1, 2, ...) - see `/specs/`

---

## 5. EXECUTION GUIDELINES

### AI Agent Behavior Rules

#### Rule 1: ANALYZE-PLAN-IMPLEMENT Workflow

1. **ANALYZE:** Identify which module (Page, Shared, Core, API) needs change
2. **PLAN:** Present numbered implementation plan with specific files
3. **IMPLEMENT:** Write code ONLY after getting implicit plan confirmation
4. **VERIFY:** Run build, tests, and confirm no regressions

#### Rule 2: API Contract Integrity

- ✅ DO: `npm run api:sync` before feature work
- ✅ DO: Validate generated models match Postman collection
- ❌ DON'T: Edit `/src/app/api/fn/**` files (they're generated)
- ❌ DON'T: Create custom API functions outside Facades

#### Rule 3: No Assumptions

- ✅ DO: Check file existence before referencing it
- ✅ DO: Validate environment variables exist
- ❌ DON'T: Invent API endpoints (reference Postman)
- ❌ DON'T: Assume module structure (verify in list_dir)

#### Rule 4: Type Safety Zero-Tolerance

- ✅ DO: Explicitly type all function parameters and returns
- ✅ DO: Use `unknown` then narrow, NEVER `any`
- ✅ DO: Validate API responses against generated models
- ❌ DON'T: Use `as any` or `as unknown` without exhaustive narrowing

#### Rule 5: State Mutation Safety

- ✅ DO: Use `signal.set(newValue)` for immutable updates
- ✅ DO: Use `computed()` for derived state
- ✅ DO: Use `linkedSignal()` for dependent state
- ❌ DON'T: Mutate arrays in place (create new arrays)
- ❌ DON'T: Share uncontrolled state outside Facades

---

## 6. SPECIAL PATTERNS & KNOWN GOTCHAS

### Pattern: Tiptap RichText Rendering

**Issue:** Tiptap content fails to render with OnPush + async subscription.  
**Solution:** Call `cdr.markForCheck()` immediately after data assignment.

```typescript
this.service.getQuestion(id).subscribe((q) => {
  this.question = q;
  this.cdr.markForCheck(); // ← REQUIRED
});
```

### Pattern: Quiz Completion Guard

**Issue:** Re-entrant calls to quiz completion create duplicate submissions.  
**Solution:** Guard with `inFlight` flag + validate all questions answered.

```typescript
if (this.inFlight || !allQuestionsAnswered()) return;
this.inFlight = true;
this.quizService
  .submitCompletion(attemptId)
  .pipe(finalize(() => (this.inFlight = false)))
  .subscribe();
```

### Pattern: Social Login OAuth2 Flow

**Issue:** Double `/api` prefix when using `environment.apiBaseUrl + '/endpoint'`.  
**Solution:** Use relative paths only; router will append api base.

```typescript
// ✅ CORRECT in Facades:
return this.http.post('/Authentication/social-callback', ...);

// ❌ WRONG:
return this.http.post(environment.apiBaseUrl + '/Authentication/...', ...);
```

### Pattern: SSR Hydration Safety

**Issue:** Components execute twice (server + client); state can diverge.  
**Solution:** Use OnPush, signals-only state, and validate initial state in ngOnInit.

```typescript
ngOnInit(): void {
  // This runs on server AND client
  // Signals will reconcile during hydration
  this.data$.subscribe(d => this._data.set(d));
}
```

---

## 7. SUCCESS METRICS

### Project Health Checklist

- [ ] **Zero TypeScript Errors:** `npm run build` completes without errors
- [ ] **Type Coverage:** No `any` types in /src/app/pages or /src/app/core
- [ ] **API Sync:** `npm run swagger:check` always passes
- [ ] **Component Compliance:** All components in /src/app are standalone + OnPush
- [ ] **Signal-First State:** NO BehaviorSubject in facades
- [ ] **Centralized Errors:** All error handling flows through error-normalizer
- [ ] **Spec Tracking:** Every feature has a spec ID in git history
- [ ] **Clean Builds:** No hot-fixes; constitution amendments only

---

## 8. AMENDMENT PROCESS

To amend this Constitution:

1. **Create a Proposal:** Draft changes in `.specify/memory/amendments/YYYY-MM-DD-amendment.md`
2. **Justify:** Reference code violations or architectural improvements
3. **Apply:** Update this file and all affected templates
4. **Announce:** Update `.specify/README.md` with summary
5. **Agents:** Re-ingest updated constitution for next session

---

## 9. AGENT ONBOARDING

When starting a new development session:

1. **Read:** `.specify/memory/constitution.md` (this file)
2. **Check:** Latest amendment in `.specify/memory/amendments/`
3. **Reference:** Active spec in `/specs/` directory
4. **Verify:** `npm run swagger:check` passes
5. **Build:** Confirm baseline build succeeds
6. **Execute:** Follow ANALYZE-PLAN-IMPLEMENT workflow

---

**Constitution Maintainer:** AskAMuslim Architecture Team  
**Last Review:** 2026-03-11  
**Status:** ACTIVE ✅
