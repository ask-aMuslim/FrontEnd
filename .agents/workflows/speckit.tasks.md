# Speckit Workflow: Creating Tasks (.agents/workflows/speckit.tasks.md)

## Overview

When a **plan is APPROVED**, the tasks phase converts workstreams into **atomic, checkboxable developer tasks**:

1. ✅ One task = approximately 30min - 4 hours of focused work
2. ✅ NO ambiguity - clear steps, expected verification
3. ✅ Hierarchical structure (phases → workstreams → tasks)
4. ✅ Each task blocks on previous ones (sequential execution)
5. ✅ Burndown tracking by phase

**Expected Output:** `/specs/N-feature-name/tasks.md` (ready for execution)

---

## When to Use This Workflow

✅ **USE THIS WORKFLOW WHEN:**

- Plan is APPROVED by Tech Lead
- Ready to execute (developer assigned)
- Need atomic, checkboxable work items
- Tracking progress/burndown

❌ **DON'T USE THIS WORKFLOW FOR:**

- Unapproved features (go back to .speckit.specify.md)
- Strategic decisions (go back to .speckit.plan.md)
- Hotfixes (use constitution amendment process)

---

## Role: Task Master / Developer

**Your Job (Planning Phase):**

- Break workstreams into atomic tasks
- Verify no task is > 4 hours
- Create clear, unambiguous steps
- Define verification criteria for each task

**Your Job (Execution Phase):**

- Work top-to-bottom
- Check off tasks ONLY after verification
- If stuck > 15 min, ask for help
- Commit code after each workstream completes

---

## Step-by-Step Workflow

### PHASE 1: TASK BREAKDOWN

#### Step 1.1: Review Plan

**Read these sections:**

1. Executive Summary (complexity level)
2. Detailed Work Breakdown (7 workstreams)
3. Timeline & Milestones

#### Step 1.2: Convert Workstreams → Tasks

**For each workstream:**

```
Workstream 2: Facade Implementation [1-2 days]
  ↓
Task 2.1: Create Facade Service File [45m]
  - Step 1: Create file
  - Step 2: Add imports
  - Step 3: Implement CRUD methods
  - Verification: npm run build passes

Task 2.2: Implement Paging Support [30m]
  - Step 1: Add parameters
  - Step 2: Test with Postman
  - Verification: Paging works end-to-end

Task 2.3: Export Facade [10m]
  - Step 1: Update barrel
  - Verification: Import works cleanly
```

**Rules:**

- Each task: 30 min - 4 hours
- If > 4 hours: break into 2-3 tasks
- If < 30 min: combine with adjacent task
- Include verification step for each

#### Step 1.3: Create Task File

**File Location:** `/specs/N-feature-name/tasks.md`

**Use Template:** `.specify/templates/tasks-template.md`

---

### PHASE 2: TASK STRUCTURE

#### Step 2.1: Header Metadata

```markdown
# Development Tasks Template

**Spec ID:** `N-feature-name`
**Plan ID:** [Link to plan.md]
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
5. **Total tasks:** 40+ (this example)
```

#### Step 2.2: Phase Structure

**Organize into phases:**

```markdown
## PHASE 1: API CONTRACT ALIGNMENT

### ✓ Task 1.1: Verify API Endpoints in Postman `[30m]`

**Objective:** Confirm backend endpoints exist and match specification.

**Steps:**

1. [ ] Open Postman → "AskAMuslimBackend API Copy" collection
2. [ ] Navigate to folder: `[Endpoint category]`
3. [ ] Locate endpoints: GET, POST, PUT, DELETE
4. [ ] Click each endpoint and verify:
   - [ ] Request parameters defined
   - [ ] Response schema shows sample data
   - [ ] Success status code (200, 201, etc.)
   - [ ] Error status codes
5. [ ] Send test request to each endpoint
6. [ ] Document any discrepancies in `ai/api-contracts.md`
7. [ ] Commit findings

**Verification:**

- All endpoints respond with valid JSON
- Response models contain expected fields
- No errors on valid requests

**Blocker If:**

- Endpoints don't exist → Alert backend team
```

#### Step 2.3: Task Format Pattern

**Every task should have:**

```markdown
### ✓ Task X.Y: [Action] `[Duration]`

**Objective:** [One sentence describing outcome]

**Steps:**

1. [ ] First step
2. [ ] Second step
3. [ ] Third step
4. [ ] Verification

**Verification:**

- Criterion 1
- Criterion 2
- Criterion 3

**Blocker If:**

- Condition that prevents progress
```

---

### PHASE 3: TASK CONTENT GUIDELINES

#### Step 3.1: Clear, Atomic Steps

**❌ WRONG (ambiguous):**

```
1. [ ] Create component
2. [ ] Add template
3. [ ] Implement logic
```

**✅ RIGHT (detailed):**

```
1. [ ] Create file: `src/app/pages/[feature]/[feature].component.ts`
2. [ ] Import: `import { Component, OnInit, ... } from '@angular/core'`
3. [ ] Add decorator:
   @Component({
     selector: 'app-[feature]',
     standalone: true,
     imports: [CommonModule],
     changeDetection: ChangeDetectionStrategy.OnPush,
   })
4. [ ] Implement OnInit: `ngOnInit() { this.load(); }`
5. [ ] Run: `npm run build` → Verify NO errors
```

#### Step 3.2: Verification Criteria

**Every task must define HOW to verify:**

```markdown
**Verification:**

- [ ] Terminal shows: "Build successful"
- [ ] No red squiggles in IDE
- [ ] Component renders in browser
- [ ] Loading spinner shows while fetching
- [ ] Data displays correctly
```

**Not just:** "Task Done" ❌

#### Step 3.3: Expected Duration

**Estimate conservatively:**

```
[30m]   = Simple, straightforward
[1h]    = Moderate complexity
[2h]    = Complex, needs problem-solving
[3-4h]  = Very complex, research needed

Rule: If >4h, break into 2-3 tasks
```

---

### PHASE 4: THE 7 PHASES TEMPLATE

#### Standard Task Organization

```markdown
## PHASE 1: API CONTRACT ALIGNMENT [0.5 days]

### ✓ Task 1.1: Verify API Endpoints in Postman [30m]

### ✓ Task 1.2: Generate OpenAPI Client [20m]

### ✓ Task 1.3: Document Generated Types [15m]

## PHASE 2: FACADE LAYER IMPLEMENTATION [1-2 days]

### ✓ Task 2.1: Create Facade Service File [45m]

### ✓ Task 2.2: Implement Paging Support [30m]

### ✓ Task 2.3: Export Facade from Barrel [10m]

## PHASE 3: COMPONENT IMPLEMENTATION [2-3 days]

### ✓ Task 3.1: Create Component File [1h]

### ✓ Task 3.2: Create Component Template [45m]

### ✓ Task 3.3: Add Component Styles [30m]

### ✓ Task 3.4: Link Template & Styles [10m]

## PHASE 4: ROUTING & NAVIGATION [0.5 days]

### ✓ Task 4.1: Add Route to App Routes [20m]

### ✓ Task 4.2: Test Navigation [15m]

## PHASE 5: ERROR HANDLING & RESILIENCE [1 day]

### ✓ Task 5.1: Test Error Scenarios [1h]

### ✓ Task 5.2: Add Fallback/Empty States [20m]

## PHASE 6: TESTING & QUALITY ASSURANCE [1-2 days]

### ✓ Task 6.1: Unit Tests for Facade [1h]

### ✓ Task 6.2: Integration Tests for Component [1h]

### ✓ Task 6.3: E2E Manual Testing [1h]

### ✓ Task 6.4: Build & Lint Validation [15m]

## PHASE 7: DOCUMENTATION & VERSIONING [0.5 days]

### ✓ Task 7.1: Commit API Contract Code [10m]

### ✓ Task 7.2: Commit Facade Implementation [10m]

### ✓ Task 7.3: Commit Component & Template [10m]

### ✓ Task 7.4: Commit Routing [5m]

### ✓ Task 7.5: Add Feature Documentation [20m]

### ✓ Task 7.6: Final Build Verification [10m]
```

---

### PHASE 5: EXECUTION TRACKING

#### Step 5.1: Final Checklist

**Add at end of tasks file:**

```markdown
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
```

#### Step 5.2: Burndown Tracking

**Add table for progress:**

```markdown
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
```

---

### PHASE 6: DEVELOPER EXECUTION

#### Step 6.1: Developer Instructions

**Provide at top of tasks file:**

```markdown
# How to Use This Tasks Document

1. **Read this entire document FIRST** (10 minutes)
2. **Work top-to-bottom** (don't skip ahead)
3. **Check boxes ONLY after verification**
4. **If stuck > 15 minutes:**
   - Document the issue
   - Ask team lead for help
   - MARK AS BLOCKED with explanation
5. **Commit after each phase** (7 commits total)
6. **Update burndown table** daily

**Phase Typical Flow:**

- Start work on Phase 1 (API)
- Complete 2-3 tasks
- Commit work
- Move to Phase 2
- Repeat for all 7 phases
- Total: 6-11 days depending on complexity
```

#### Step 6.2: Example Task Execution

**Developer perspective:**

```
🚀 DAY 1: Starting PHASE 1 (API CONTRACT ALIGNMENT)

✅ Task 1.1 [COMPLETE]
   - Opened Postman collection
   - Found 5 endpoints for [Feature]
   - All tested successfully
   - Verified in spreadsheet

✅ Task 1.2 [COMPLETE]
   - Ran: npm run generate:api
   - New models generated: [Feature], [FeatureName]DTO
   - npm run build passed with 0 errors

✅ Task 1.3 [COMPLETE]
   - Documented types in architecture.md
   - Ready for Phase 2

📝 PHASE 1 STATUS: 100% COMPLETE (1 hour spent)
🎯 NEXT: Phase 2 - Facade Implementation

git commit -m "feat(api): generate openapi client for feature
         - New models: Feature, FeatureDTO
         - New functions: list, get, create, update, delete
         [speckit-ref: N-featurename]"

---

⏳ DAY 2: Starting PHASE 2 (FACADE LAYER IMPLEMENTATION)

⏳ Task 2.1 [IN PROGRESS]
   - Creating file: src/app/api/facades/[feature].facade.ts
   - Implementing CRUD methods...
```

---

## Troubleshooting

**"Task is taking too long (> 4 hours)"**
→ Break it into 2-3 smaller tasks. No single task should be > 4 hours.

**"I'm blocked on a task"**
→ Mark as BLOCKED with explanation. Notify team lead. Move to next available task.

**"Verification criteria don't match reality"**
→ Document the discrepancy. Ask team lead. Update criteria if needed.

**"Two tasks seem to have same output"**
→ Combine them if possible. Or clarify the distinction.

**"Can't find clear step to execute"**
→ Time to ask for help. This shouldn't be vague.

---

## AI Agent Guidelines

**When an agent creates tasks, it MUST:**

1. ✅ **Review approved plan first** - don't create tasks for unapproved features
2. ✅ **Keep tasks atomic** - max 4 hours each
3. ✅ **Provide crystal-clear steps** - a junior dev should execute them
4. ✅ **Define verification criteria** - what "done" means
5. ✅ **Organize into 7 phases** - API, Facade, Component, Routes, Error, Tests, Docs
6. ✅ **Estimate conservatively** - include verification time
7. ✅ **Include blocking checklist** - what must be complete before next phase
8. ✅ **Add burndown table** - for progress tracking
9. ✅ **Reference spec ID** - in all commit suggestions

**Tasks Phase BLOCKER Checklist:**

- [ ] Plan is APPROVED
- [ ] All dependencies listed
- [ ] All tasks estimated
- [ ] Total <= 15-20 days (realistic for one developer)
- [ ] Verification criteria clear
- [ ] No ambiguous steps
- [ ] Phases sequential with clear handoff
- [ ] Burndown table included

---

## Expected Outcomes

After following this workflow, you should have:

✅ `/specs/N-feature-name/tasks.md` (READY FOR EXECUTION)

- 40+ atomic, checkboxable tasks
- Organized into 7 phases
- Each task: 30min - 4 hours
- Clear steps with verification
- Estimated total: 6-11 days
- Burndown table for tracking
- 7 suggested git commits (one per phase)

✅ Developer Ready to Execute

- Can work autonomously
- Clear what "done" means
- Can track progress visually
- Can commit with meaningful history

✅ Completed Feature

- All tests passing
- Build succeeding
- Code reviewed
- Ready for merge

---

**Workflow Version:** 1.0  
**Last Updated:** 2026-03-11
