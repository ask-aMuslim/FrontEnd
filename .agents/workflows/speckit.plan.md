---
description: Spec-Driven Development — create a technical implementation plan from an approved spec. Produces /specs/N-feature-name/plan.md with workstreams and estimates.
---

# Speckit Workflow: Creating Plans (.agents/workflows/speckit.plan.md)

## Overview

When a **spec is APPROVED**, the planning phase translates feature requirements into **detailed implementation roadmap**:

1. ✅ Breaks spec into 5-7 workstreams (API, Facade, Component, Routes, Testing, Docs)
2. ✅ Estimates effort (duration per workstream)
3. ✅ Identifies dependencies and blockers
4. ✅ Details technical approach for each layer
5. ✅ Enables developers to execute without ambiguity

**Expected Output:** `/specs/N-feature-name/plan.md` (ready for task breakdown)

---

## When to Use This Workflow

✅ **USE THIS WORKFLOW WHEN:**

- Spec is APPROVED by Tech Lead & Product Owner
- Ready to estimate and sequence work
- Developer is assigned to the feature
- Before creating detailed tasks

❌ **DON'T USE THIS WORKFLOW FOR:**

- Unapproved specs (go back to .speckit.specify.md)
- Micro-tasks (go directly to .speckit.tasks.md)
- Architectural changes (propose constitution amendment first)

---

## Role: Implementation Planner

**Your Job:**

- Translate spec into developer roadmap
- Estimate effort accurately
- Identify dependencies and sequence work
- Ensure technical feasibility

**Tools You Need:**

- Approved spec: `/specs/N-feature-name/spec.md`
- `.specify/templates/plan-template.md` (structure)
- Project knowledge (Angular patterns, Facade layer, etc.)
- Git commit history (for similar features)

---

## Step-by-Step Workflow

### PHASE 1: SPEC ANALYSIS

#### Step 1.1: Review Approved Spec

**Read these sections FIRST:**

1. **Overview**
   - Success criteria (5-7 testable items)
   - Scope (explicit OUT-of-scope)

2. **Technical Design**
   - Architecture impact (which layers?)
   - Data model (new types?)
   - State management (signals, facades?)
   - Error scenarios

3. **Implementation Tasks**
   - Workstream outline (5-7 phases)

#### Step 1.2: Map to Codebase Layers

**Create mental/document map:**

```
Feature Name: [Feature]

Layer Impact:
┌─────────────────┐
│ API Layer       │ → New generated functions (if endpoint new)
│ Generated Fn    │   Reference: Postman collection
├─────────────────┤
│ Facade Layer    │ → New methods: list(), get(), create(), update(), delete()
│ src/app/api/    │   Location: src/app/api/facades/[feature].facade.ts
│ facades/        │   Error handling via normalizeError()
├─────────────────┤
│ Component Layer │ → New standalone component (OnPush)
│ src/app/pages/  │   Location: src/app/pages/[feature]/[feature].component.ts
│                 │   State: BehaviorSubject + signals
├─────────────────┤
│ Routing Layer   │ → Add route in src/app/app.routes.ts
│ src/app/        │   Path: /[feature], Component: [Feature]Component
├─────────────────┤
│ Testing Layer   │ → Unit tests: Facade.spec.ts
│ src/**/*.spec   │ → Integration tests: Component.spec.ts
└─────────────────┘
```

#### Step 1.3: Identify External Blockers

**Checklist:**

- [ ] API already implemented? (check Postman)
- [ ] Design approved? (check Figma)
- [ ] Dependencies on other specs? (if yes, sequence)
- [ ] Third-party integrations? (if yes, verify keys exist)
- [ ] Infrastructure ready? (databases, auth, etc.)

**If blockers found:**

- Document in plan
- Set start date AFTER blockers resolved
- Add contingency tasks

---

### PHASE 2: PLAN STRUCTURE

#### Step 2.1: Create Plan File

**File Location:** `/specs/N-feature-name/plan.md`

**Use Template:** `.specify/templates/plan-template.md`

**Section to Fill:**

1. **Executive Summary**
   - High-level overview
   - Complexity assessment (⭐ Simple, ⭐⭐ Moderate, ⭐⭐⭐ Complex)
   - Total effort estimate

2. **Detailed Work Breakdown**
   - 5-7 workstreams (API Contract, Facade, Component, Routes, Error Handling, Testing, Docs)
   - Each with 3-5 tasks
   - Effort estimates per task

3. **Timeline & Milestones**
   - Workstream dates
   - Total estimate (days)
   - Dependencies noted

4. **Risks & Contingency**
   - Key risks
   - Mitigation strategies

#### Step 2.2: Define Workstreams

**Standard 7-phase breakdown:**

```
Workstream 1: API CONTRACT ALIGNMENT [0.5 days]
  - Verify endpoints in Postman
  - Run npm run generate:api
  - Compile TypeScript

Workstream 2: FACADE IMPLEMENTATION [1-2 days]
  - Create Facade service
  - Implement CRUD methods
  - Add error handling

Workstream 3: COMPONENT IMPLEMENTATION [2-3 days]
  - Create standalone component
  - Implement template
  - Add styles (Tailwind)

Workstream 4: ROUTING & NAVIGATION [0.5 days]
  - Add route to app.routes.ts
  - Test navigation
  - Update UI links

Workstream 5: ERROR HANDLING [1 day]
  - Test error scenarios
  - Add fallback/empty states
  - Verify user messages

Workstream 6: TESTING & QA [1-2 days]
  - Unit tests (Facade)
  - Integration tests (Component)
  - E2E testing
  - Build validation

Workstream 7: DOCUMENTATION [0.5 days]
  - Code comments (JSDoc)
  - Architecture docs
  - Commit history
```

#### Step 2.3: Detail Each Workstream

**For EACH workstream:**

1. **Owner:** Who leads this workstream?
2. **Duration:** Estimated hours/days
3. **Tasks:** 3-5 specific, actionable tasks
4. **Acceptance Criteria:** How do we know it's done?
5. **Dependencies:** What must be complete first?

**Example Workstream:**

```markdown
### Workstream 2: Facade Implementation

**Owner:** [Developer name]
**Duration:** 1-2 days

#### Task 2.1: Create Facade Service

- [ ] Create file: src/app/api/facades/student.facade.ts
- [ ] Import generated API functions
- [ ] Implement list(), get(), create(), update(), delete()
- [ ] Add error handling via normalizeError()

**Acceptance Criteria:**

- All CRUD methods implemented
- No TypeScript errors
- No `any` types
- Error handling tested

#### Task 2.2: Implement Paging (if applicable)

- [ ] Add pageNumber, pageSize parameters
- [ ] Map response to paginated result
- [ ] Test with Postman

**Acceptance Criteria:**

- Pagination parameters work end-to-end
- API receives correct params
- Response validated

#### Task 2.3: Add to Barrel Export

- [ ] Update src/app/api/facades/index.ts
- [ ] Export: export \* from './student.facade'

**Acceptance Criteria:**

- Facade importable from @facades
```

#### Step 2.4: Estimate Effort

**For each task:**

```
SIMPLE TASK:    [30m - 1h]   → Low complexity, straightforward
MODERATE TASK:  [1-2h]       → Some complexity, research needed
COMPLEX TASK:   [2-4h]       → High complexity, multiple decisions
RESEARCH TASK:  [Varies]     → Depends on findings
```

**Total Estimate Formula:**

- Sum all tasks
- Add 20% buffer for unknowns
- Example: 12 hours + 2.4 hours = 14.4 hours (~2 days)

---

### PHASE 3: TIMELINE & DEPENDENCIES

#### Step 3.1: Create Milestone Timeline

```markdown
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
```

#### Step 3.2: Identify Dependencies

**Matrix:**

```
WS1 (API Contract)
  ↓ DEPENDS ON: Backend API implemented
  ↓ BLOCKS: WS2, WS3

WS2 (Facade)
  ↓ DEPENDS ON: WS1 (API contract)
  ↓ BLOCKS: WS3, WS6

WS3 (Component)
  ↓ DEPENDS ON: WS2 (Facade ready)
  ↓ BLOCKS: WS4, WS6

WS4 (Routing)
  ↓ DEPENDS ON: WS3 (Component ready)
  ↓ BLOCKS: Integration tests

WS5 (Error Handling)
  ↓ DEPENDS ON: WS2, WS3 (data flow defined)
  ↓ BLOCKS: WS6 (testing)

WS6 (Testing)
  ↓ DEPENDS ON: WS1, WS2, WS3, WS4, WS5
  ↓ BLOCKS: WS7 (merge)

WS7 (Docs & Merge)
  ↓ DEPENDS ON: WS6 (all tests pass)
```

**Critical Path:** WS1 → WS2 → WS3 → WS4 → WS6 → WS7
**Parallel Work:** WS5 can start when WS2, WS3 ready

---

### PHASE 4: RISK & CONTINGENCY

#### Step 4.1: Document Known Risks

**Identify risks from spec:**

```markdown
| Risk                      | Likelihood | Impact     | Contingency                               |
| ------------------------- | ---------- | ---------- | ----------------------------------------- |
| API endpoint delayed      | MEDIUM     | BLOCKS WS1 | Mock data first, swap real endpoint later |
| Design changes mid-sprint | MEDIUM     | REWORK     | Implement MVP first, refine UI later      |
| TypeScript type conflicts | LOW        | BLOCK      | Validate generated models early           |
| SSR hydration issues      | LOW        | REWORK     | Disable SSR, fix after feature complete   |
```

#### Step 4.2: Create Contingency Decisions

**For each risk:**

1. **If API delayed by 3 days:**
   - Decision: Start WS2 with mock data
   - Action: Create `mock-student.service.ts`
   - Recovery: Swap real endpoint when ready

2. **If design changes appear:**
   - Decision: Scope to MVP (core features only)
   - Action: Cut lower priority features
   - Recovery: Plan Phase 2 followup spec

---

### PHASE 5: SIGN-OFF & HAND-OFF

#### Step 5.1: Review & Approval

**Checklist before approving plan:**

- [ ] **Completeness:**
  - [ ] All 7 workstreams detailed
  - [ ] All tasks estimated
  - [ ] All dependencies identified
  - [ ] Timeline realistic

- [ ] **Technical Accuracy:**
  - [ ] API endpoints verified (Postman)
  - [ ] Architecture aligns with constitution
  - [ ] No hidden assumptions
  - [ ] Error scenarios covered

- [ ] **Alignment with Spec:**
  - [ ] Plan implements ALL spec requirements
  - [ ] Success criteria addressed
  - [ ] No scope creep

- [ ] **Feasibility:**
  - [ ] Developer assigned?
  - [ ] Dependencies available?
  - [ ] Estimate reasonable?

#### Step 5.2: Commit Plan

```bash
git add specs/N-feature-name/plan.md
git commit -m "plan(N-feature-name): define implementation roadmap

- 7 workstreams across API, Facade, Component, Routes, Error Handling, Testing, Docs
- Total effort: ~X days
- Dependencies: [List key dependencies]
- Known risks: [List top 3 risks]
- Approved by: [Tech Lead name]

[speckit-ref: N-feature-name]"
```

---

### PHASE 6: HAND-OFF TO TASKS PHASE

#### Step 6.1: Create Tasks Document

**When plan is APPROVED:**

1. Copy template: `.specify/templates/tasks-template.md`
2. Save to: `/specs/N-feature-name/tasks.md`
3. Use plan workstreams to define detailed tasks
4. Each task should be 2-4 hours max

**Plan → Tasks Mapping Example:**

```
Plan - Workstream 2: Facade Implementation (1-2 days)
  ↓
Tasks - Phase 2: FACADE LAYER IMPLEMENTATION (1-2 days)
  ├─ Task 2.1: Create Facade Service File [45m]
  ├─ Task 2.2: Implement Paging Support [30m]
  └─ Task 2.3: Export Facade from Barrel [10m]
```

#### Step 6.2: Hand-Off to Developer

**Provide:**

1. ✅ Approved Spec: `specs/N-feature-name/spec.md`
2. ✅ Approved Plan: `specs/N-feature-name/plan.md`
3. ✅ Tasks Document: `specs/N-feature-name/tasks.md` (created by developer or planner)
4. ✅ Postman Collection URL (for API reference)
5. ✅ Figma Link (if design exists)

**Developer Instructions:**

- Read plan overview
- Open tasks.md
- Work top-to-bottom
- Check off tasks as complete
- Commit after each workstream

---

## Troubleshooting

**"The plan seems too aggressive"**
→ Add 20-30% buffer. If still feels tight, break into 2 specs.

**"Workstream X has too many tasks"**
→ Break into 2-3 sub-workstreams. Max 5 tasks per workstream.

**"I don't know how long this will take"**
→ Look at similar features in git history. Use that as baseline.

**"API endpoint doesn't exist"**
→ Mark as blocker. Contact backend. Plan starts AFTER.

**"Requirements keep changing"**
→ Document as scope creep. Propose amendment to spec. Don't change plan mid-stream.

---

## AI Agent Guidelines

**When an agent creates a plan, it MUST:**

1. ✅ **Read approved spec first** - don't plan what wasn't approved
2. ✅ **Verify all dependencies** - API endpoints, design, auth, etc.
3. ✅ **Use historical data** - estimate based on similar features
4. ✅ **Add 20% buffer** - for unknowns
5. ✅ **Identify critical path** - what blocks everything else?
6. ✅ **Document risks** - at least 3-5 per plan
7. ✅ **Get Tech Lead sign-off** - before handing to developer
8. ✅ **Include spec ID in commits** - `[speckit-ref: N-feature]`

**Plan Phase BLOCKER Checklist:**

- [ ] Spec is APPROVED
- [ ] All API endpoints verified
- [ ] All dependencies identified
- [ ] Architecture reviewed
- [ ] Effort estimated (with buffer)
- [ ] Timeline realistic
- [ ] Risks documented
- [ ] Tech Lead approved

---

## Expected Outcomes

After following this workflow, you should have:

✅ `/specs/N-feature-name/plan.md` (APPROVED)

- Executive summary with complexity assessment
- 7 workstreams with tasks and estimates
- Timeline with milestones
- Dependencies clearly identified
- 5+ risks with contingencies
- Tech Lead sign-off

✅ Ready for **TASKS PHASE**

- Next: Use `.specify/templates/tasks-template.md`
- Output: `/specs/N-feature-name/tasks.md` (atomic developer tasks)

✅ Developer Ready

- Clear roadmap to follow
- Realistic timeline
- No ambiguity about architecture
- Can execute autonomously

---

**Workflow Version:** 1.0  
**Last Updated:** 2026-03-11
