# 🔒 Speckit Compliance Checklist

Use this checklist **before committing code** to ensure your implementation adheres to the Project Constitution.

---

## 📋 Code Review Checklist (Developer Self-Check)

### Component Architecture

- [ ] Component is **standalone** (declares `standalone: true`)
- [ ] Component uses **OnPush** change detection strategy
- [ ] Component has explicit imports in `@Component.imports`
- [ ] NO NgModule imports (no `CommonModule`, `FormsModule` at root)
- [ ] Implements `OnDestroy` with cleanup logic

### State Management

- [ ] All state uses **Signals** (not BehaviorSubject)
- [ ] Signals are properly typed (no implicit `any`)
- [ ] State mutations use `signal.set()` or `signal.update()` (immutable)
- [ ] Derived state uses `computed()`
- [ ] Component has `private destroy$ = new Subject<void>()`

### HTTP & Facade Pattern

- [ ] **NO HTTP calls in component** (all via Facades)
- [ ] Uses `private service: MyFacade` (injected)
- [ ] Facade method is called, not API function directly
- [ ] Subscriptions use `takeUntil(this.destroy$)` pattern
- [ ] Async operations handled gracefully (loading, error states)

### Error Handling

- [ ] Errors caught and processed via `normalizeError()`
- [ ] User-facing error messages for failed operations
- [ ] Stack traces logged but NOT shown to users
- [ ] Error state properly reflected in component (loading, disabled buttons)
- [ ] Graceful fallback if API fails

### Type Safety

- [ ] NO `any` types (use `unknown` then narrow if needed)
- [ ] NO `as any` casts (use proper typing)
- [ ] All function parameters explicitly typed
- [ ] All function returns explicitly typed
- [ ] Generic types properly constrained (`<T extends Base>`)

### Styling

- [ ] NO inline `style=""` attributes
- [ ] NO inline CSS in component metadata
- [ ] All styles in `.scss` file or Tailwind classes
- [ ] Uses design tokens from `src/styles/tokens/variables.css`
- [ ] Responsive design tested on mobile/tablet/desktop

### Template Best Practices

- [ ] NO business logic in template (use component methods)
- [ ] NO complex conditionals (extract to component property)
- [ ] NO function calls in template `{{ methodCall() }}` (use pipe/property)
- [ ] Safe navigation operator used `object?.property`
- [ ] Async pipe used for subscriptions (if not Signals)
- [ ] `*ngIf` properly handles null/undefined cases

### Change Detection & Performance

- [ ] `cdr.markForCheck()` called after async subscriptions (OnPush)
- [ ] Subscriptions properly unsubscribed in `ngOnDestroy`
- [ ] OnInit loads data, not constructor
- [ ] No setTimeout/setInterval without cleanup
- [ ] No memory leaks (every subscribe has unsubscribe)

### Accessibility

- [ ] Buttons have `aria-label` or visible text
- [ ] Form inputs have associated `<label>`
- [ ] Images have descriptive `alt` text
- [ ] Color contrast >= 4.5:1 (AA standard)
- [ ] Keyboard navigation supported (if interactive)

---

## 🏗️ Architecture Review Checklist (Tech Lead)

### API Layer

- [ ] New endpoints documented in Postman collection
- [ ] `npm run api:sync` executed and passed
- [ ] Generated models in `/src/app/api/models/` are correct
- [ ] No manual API function modifications (they're generated)
- [ ] Request/response validation matches spec

### Facade Layer

- [ ] Facade file created in `/src/app/api/facades/`
- [ ] Facade methods map to business operations (create, read, update, delete)
- [ ] All Facade methods return typed Observable/Signal (no `any`)
- [ ] Error handling flows through `normalizeError()`
- [ ] Facade is injected into Core Service or Component correctly

### Core Service Layer

- [ ] Core service imports Facade (not generated API functions)
- [ ] Business logic isolated from HTTP logic
- [ ] State management centralized (no scattered signals)
- [ ] Services properly scoped (singleton vs component-scoped)

### Module Boundary

- [ ] Feature page is lazy-loaded in `app.routes.ts`
- [ ] Route guards applied (auth, data preload)
- [ ] Proper route parameter handling
- [ ] Route transitions tested (resolve guards, preloadData)

### Build & Testing

- [ ] `npm run build` passes with **zero errors**
- [ ] `npm run lint` passes (no warnings ignored)
- [ ] `npm run test` passes with >= **75% coverage**
- [ ] TypeScript strict mode enforced (no `// @ts-ignore`)
- [ ] No console.log or debug code left behind

### Git Discipline

- [ ] Commit message format: `type(scope): description [speckit-ref: spec-id]`
- [ ] Spec ID referenced (e.g., `[speckit-ref: 0-baseline]`)
- [ ] Feature branch follows pattern: `spec/N-feature-name`
- [ ] No merge conflicts left unresolved
- [ ] Atomic commits (one logical change per commit)

### Spec Traceability

- [ ] Feature has corresponding spec in `/specs/N-/`
- [ ] All success criteria from spec.md are met
- [ ] Tasks in tasks.md are checked off
- [ ] Plan.md workstreams are completed
- [ ] Code review comments reference constitution sections

---

## 🚀 Pre-Commit Validation Script

Copy-paste to verify everything before pushing:

```bash
#!/bin/bash
echo "🔒 Running Speckit Compliance Checks..."

echo "📝 1. TypeScript Build..."
npm run build
if [ $? -ne 0 ]; then echo "❌ Build failed"; exit 1; fi

echo "✅ 2. Lint..."
npm run lint
if [ $? -ne 0 ]; then echo "❌ Lint failed"; exit 1; fi

echo "🧪 3. Tests..."
npm run test
if [ $? -ne 0 ]; then echo "❌ Tests failed"; exit 1; fi

echo "🔄 4. API Sync Check..."
npm run swagger:check
if [ $? -ne 0 ]; then echo "⚠️ API might be out of sync"; fi

echo ""
echo "✅ ALL COMPLIANCE CHECKS PASSED!"
echo ""
echo "Checklist before push:"
echo "- [ ] Commit message has [speckit-ref: X]"
echo "- [ ] Feature branch is spec/N-feature-name"
echo "- [ ] PR description references spec ID"
echo "- [ ] Code review checklist completed"
```

---

## ❌ Common Violations & How to Fix

### Violation 1: Component has HTTP Call

```typescript
// ❌ WRONG
export class MyComponent {
  onLoad(): void {
    this.http.get('/api/data').subscribe(...); // Direct HTTP in component!
  }
}

// ✅ CORRECT
export class MyComponent {
  constructor(private facade: MyFacade) {}

  onLoad(): void {
    this.facade.loadData().subscribe(...);
  }
}
```

### Violation 2: State is BehaviorSubject

```typescript
// ❌ WRONG
private data$ = new BehaviorSubject([]);

// ✅ CORRECT
private _data = signal<DataType[]>([]);
data = this._data.asReadonly();
```

### Violation 3: No Unsubscribe

```typescript
// ❌ WRONG
ngOnInit(): void {
  this.service.data$.subscribe(d => this.data = d); // Leaks memory!
}

// ✅ CORRECT
private destroy$ = new Subject<void>();

ngOnInit(): void {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe(d => this.data = d);
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Violation 4: Inline Styles

```typescript
// ❌ WRONG
@Component({
  styles: [`
    .button { color: red; padding: 10px; }
  `]
})

// ✅ CORRECT
@Component({
  styleUrl: './my.component.scss'
})
```

### Violation 5: `any` Type

```typescript
// ❌ WRONG
const result: any = this.facade.getData();

// ✅ CORRECT
const result = this.facade.getData(); // Type inferred from Facade
// OR
const result: DataType = this.facade.getData();
```

### Violation 6: Business Logic in Template

```typescript
// ❌ WRONG
<div>{{ user.name.split(' ')[0] + '!' }}</div>

// ✅ CORRECT
<!-- Component.ts -->
get firstName(): string {
  return this.user.name.split(' ')[0] + '!';
}

<!-- Template -->
<div>{{ firstName }}</div>
```

### Violation 7: Missing markForCheck()

```typescript
// ❌ WRONG (OnPush + async subscription)
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {
  ngOnInit(): void {
    this.service.data$.pipe(takeUntil(this.destroy$)).subscribe((d) => this._data.set(d)); // Change not detected!
  }
}

// ✅ CORRECT
export class MyComponent {
  ngOnInit(): void {
    this.service.data$.pipe(takeUntil(this.destroy$)).subscribe((d) => {
      this._data.set(d);
      this.cdr.markForCheck(); // Force detection
    });
  }
}
```

---

## 📊 Compliance Metrics

Track these over time:

| Metric                               | Goal   | Current |
| ------------------------------------ | ------ | ------- |
| % specs with governance tag          | 100%   | --      |
| TypeScript strict errors             | 0      | --      |
| `any` type count                     | 0      | --      |
| Component OnPush adoption            | 100%   | --      |
| Standalone component adoption        | 100%   | --      |
| Test coverage                        | >= 75% | --      |
| Build failure rate                   | 0%     | --      |
| Code review pass rate (first review) | >= 80% | --      |

---

## 🔄 Amendment Trigger Points

If you find a pattern that VIOLATES the constitution, don't work around it—**propose an amendment:**

```markdown
# Amendment: [Title]

**Discovered:** This rule doesn't match our needs
**Example:** [Show violation]
**Proposed Fix:** [Better rule]
```

File: `.specify/memory/amendments/YYYY-MM-DD-[subject].md`

---

**Checklist Version:** 1.0  
**Last Updated:** 2026-03-11  
**Status:** 🟢 ACTIVE
