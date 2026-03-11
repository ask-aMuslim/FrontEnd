# Spec 0: Baseline Verification

**Spec ID:** `0-baseline-verification`  
**Version:** 1.0  
**Status:** BOOTSTRAPPING  
**Author:** Speckit Integration  
**Created:** 2026-03-11  
**Target Timeline:** 1-2 sprints

---

## 1. OVERVIEW

### Problem Statement

The AskAMuslim project requires an **architectural governance framework** to ensure all future features comply with the Project Constitution. This bootstrap spec verifies:

1. ✅ **Constitution is accurate** - reflects actual project DNA
2. ✅ **Templates are functional** - can be used to specify next features
3. ✅ **Build baseline established** - zero TypeScript errors, tests pass
4. ✅ **AI compliance enabled** - agents follow strict governance model

### Success Criteria

- [ ] Constitution reflects 100% of actual tech stack (Angular 20, TypeScript strict, Signals, etc.)
- [ ] All 10 "Unbreakable Rules" verified in codebase
- [ ] `.specify/` directory structure complete
- [ ] Templates tested with minimal example
- [ ] Build passes: `npm run build` → 0 errors
- [ ] Tests pass: `npm run test` → >= 75% coverage
- [ ] Agents understand governance model via constitution
- [ ] Zero-drift policy enabled for future features

### Scope

**INCLUDED:**

- Verify Angular 20 + Signals + Standalone components
- Verify TypeScript strict mode enforced
- Verify API pattern (Generated Fn → Facades → Components)
- Verify Tailwind + design tokens styling
- Verify error-normalizer centralization
- Verify change detection with OnPush + markForCheck
- Document all 10 unbreakable rules
- Create Speckit governance structure

**EXPLICITLY OUT:**

- New features (this is meta-work only)
- Breaking changes to existing code
- Dependency upgrades
- Backend API changes

---

## 2. USER STORIES & SCENARIOS

### Story 1: Architecture Auditor verifies project compliance

**Scenario:** Given the AskAMuslim codebase
When I read the constitution.md
Then I see 100% accuracy in:

- Tech Stack (Angular 20.3.17, TypeScript 5.x strict, Signals, etc.)
- Architecture patterns (Standalone, OnPush, API flow)
- Unbreakable rules (10 total, all enforced)

### Story 2: AI Agent reads Constitution and understands constraints

**Scenario:** Given a new feature request
When an agent loads the project
Then it can:

- Read `.specify/memory/constitution.md`
- Understand strict compliance requirements
- Apply ANALYZE-PLAN-IMPLEMENT workflow
- Generate feature specs using `.specify/templates/`

### Story 3: Developer creates first feature after bootstrap

**Scenario:** Given the template structure is ready
When a developer starts Feature 1
Then they can:

- Copy `spec-template.md` → `specs/1-feature-name/spec.md`
- Copy `plan-template.md` → `specs/1-feature-name/plan.md`
- Copy `tasks-template.md` → `specs/1-feature-name/tasks.md`
- Customize for their feature

---

## 3. TECHNICAL DESIGN

### Architecture Decision: Governance Layers

```
💾 Constitution Layer (.specify/memory/)
   ↓ Defines unbreakable rules

📋 Template Layer (.specify/templates/)
   ↓ Standardizes spec creation

🎯 Spec Layer (/specs/)
   ↓ Feature-specific requirements

🔧 Workflow Layer (.agents/workflows/)
   ↓ AI guidance for multi-phase work

🏗️ Implementation Layer (src/app/)
   ↓ Code follows constitution
```

### State Management Verification

All components must follow this pattern:

```typescript
// ✅ VERIFIED: Signal-based state
import { signal, computed } from "@angular/core";

export class MyStore {
  private readonly _data = signal([]);
  data = this._data.asReadonly();

  loadData(): void {
    this._data.set(newData); // Signal update
  }
}

// ❌ VERIFIED VIOLATIONS: Use old patterns (will find and document)
```

### Data Flow Verification

Must follow: **Generated API Fn → Facade → Service → Component**

```
✅ VERIFIED:
src/app/api/fn/generated.ts (READ-ONLY)
           ↓
src/app/api/facades/[feature].facade.ts (CUSTOM mapping)
           ↓
src/app/core/services/[domain].service.ts (BUSINESS LOGIC)
           ↓
src/app/pages/[feature]/[feature].component.ts (DISPLAY only)
           ↓
src/app/pages/[feature]/[feature].component.html (NO HTTP)
```

---

## 4. IMPLEMENTATION TASKS

### Phase 1: Constitution Verification

- [ ] **Audit Tech Stack**
  - [ ] Verify Angular version: `ng version` → 20.3.17
  - [ ] Verify TypeScript: `tsc --version` → 5.x
  - [ ] Verify strict mode: `tsconfig.json` → `"strict": true`
  - [ ] Verify zoneless: `app.config.ts` → `provideZonelessChangeDetection()`

- [ ] **Audit Architecture**
  - [ ] Count standalone components: `src/app/pages/**/*.ts`
  - [ ] Verify NO NgModules (except app.config)
  - [ ] Count signals vs BehaviorSubject in `/src/app/api/facades/`
  - [ ] Verify API flow: Generated Fn → Facades → Services

- [ ] **Audit Styling**
  - [ ] Verify NO inline styles: `grep "style=" src/app/**/*.ts`
  - [ ] Verify Tailwind: `tailwind.config.js` exists
  - [ ] Verify design tokens: `src/styles/tokens/variables.css`

- [ ] **Audit Error Handling**
  - [ ] Verify centralized error-normalizer: `src/app/core/errors/error-normalizer.ts`
  - [ ] Verify all HTTP errors flow through it
  - [ ] Document all error codes users can see

### Phase 2: Template Scaffolding

- [ ] Create `.specify/templates/spec-template.md`
- [ ] Create `.specify/templates/plan-template.md`
- [ ] Create `.specify/templates/tasks-template.md`
- [ ] **Verify templates are:** Realistic, actionable, complete

### Phase 3: Baseline Spec Creation

- [ ] Create this spec: `specs/0-baseline-verification/spec.md`
- [ ] Create rules file: `specs/0-baseline-verification/unbreakable-rules.md`
- [ ] Document 10 rules with code examples

### Phase 4: Build Validation

- [ ] `npm run build` → 0 TypeScript errors
- [ ] `npm run test` → All pass, >= 75% coverage
- [ ] `npm run lint` → No violations
- [ ] `npm run swagger:check` → Passes

### Phase 5: Documentation

- [ ] Create `.specify/README.md` (quickstart for agents)
- [ ] Create `specs/README.md` (all spec listing)
- [ ] Create `.agents/workflows/README.md` (workflow guide)

---

## 5. RISKS & MITIGATION

| Risk                               | Impact                      | Likelihood | Mitigation                                  |
| ---------------------------------- | --------------------------- | ---------- | ------------------------------------------- |
| Constitution doesn't match reality | Agents follow wrong rules   | MEDIUM     | Audit codebase line-by-line vs constitution |
| Templates are too rigid            | Developers can't adapt them | MEDIUM     | Add customization examples                  |
| Build baseline fails               | Bootstrap blocked           | LOW        | Start fresh if needed                       |

---

## 6. DELIVERABLES

### Files Created

```
.specify/
├── memory/
│   └── constitution.md              ← Project law
│   └── amendments/                  ← (future amendments history)
├── templates/
│   ├── spec-template.md             ← Feature requirements template
│   ├── plan-template.md             ← Implementation plan template
│   └── tasks-template.md            ← Developer tasks template
└── README.md                        ← Quick start for agents

specs/
├── 0-baseline-verification/
│   ├── spec.md                      ← This file
│   ├── unbreakable-rules.md         ← 10 rules + code examples
│   └── plan.md                      ← Bootstrap plan
└── README.md                        ← Spec directory guide

.agents/
└── workflows/
    ├── README.md                    ← Workflow overview
    ├── speckit.specify.md           ← How to create specs
    ├── speckit.plan.md              ← How to create plans
    └── speckit.tasks.md             ← How to create tasks
```

### Verification Checklist

- [ ] Constitution reflects 100% of actual tech stack
- [ ] All 10 unbreakable rules documented with code
- [ ] Templates are complete and actionable
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run test`
- [ ] Agents can read and understand governance
- [ ] Zero-drift policy enabled

---

## 7. ROLLOUT PLAN

### How Future Features Use This Bootstrap

**When starting Feature 1:**

1. Read constitution: `.specify/memory/constitution.md`
2. Copy spec template: `spec-template.md` → `specs/1-feature-name/spec.md`
3. Customize for feature
4. Get approval
5. Copy plan template: `plan-template.md` → `specs/1-feature-name/plan.md`
6. Copy task template: `tasks-template.md` → `specs/1-feature-name/tasks.md`
7. Execute tasks
8. Follow ANALYZE-PLAN-IMPLEMENT workflow

### Agent Onboarding

**Every new session:**

1. Agent reads: `.specify/memory/constitution.md`
2. Agent checks: Latest amendment in `.specify/memory/amendments/`
3. Agent loads: Active spec in `/specs/`
4. Agent analyzes: Project constraints
5. Agent executes: Strictly following constitution

---

## 8. SUCCESS METRICS

Should meet ALL criteria:

✅ **Constitution Accuracy**

- [ ] 100% alignment with actual codebase
- [ ] All 10 rules verifiable in code
- [ ] All 5 patterns demonstrable

✅ **Template Completeness**

- [ ] Spec template: 100+ lines, 5+ sections
- [ ] Plan template: 150+ lines, detailed workstreams
- [ ] Task template: 200+ lines, 40+ atomic tasks

✅ **Build Baseline**

- [ ] `npm run build` → 0 errors ✅
- [ ] `npm run test` → >= 75% coverage ✅
- [ ] `npm run lint` → 0 violations ✅

✅ **Zero-Drift Policy Enabled**

- [ ] Constitution enforced for all agents ✅
- [ ] Future features must reference spec ID in commits ✅
- [ ] No hot-fixes allowed (constitution amendments only) ✅

---

## 9. SIGN-OFF

**This spec is APPROVED when:**

- [ ] Technical Audit: Constitution reflects reality
- [ ] Templates: Ready for next feature
- [ ] Build: Baseline established
- [ ] Agents: Can read and comply with governance

---

**Spec Status:** BOOTSTRAPPING 🚀  
**Bootstrap Completion Target:** 2026-03-15  
**Next Feature Spec:** `1-[feature-name]`
