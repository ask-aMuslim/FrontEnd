---
description: Spec-Driven Development — define a new feature spec (what & why). Creates /specs/N-feature-name/spec.md following the project constitution.
---

# Speckit Workflow: Creating Specifications (.speckit.specify)

## Overview

When an AI agent or developer needs to **define a new feature**, they use this workflow to create a clear, actionable specification that:

1. ✅ Satisfies Product needs (user stories, acceptance criteria)
2. ✅ Satisfies Technical constraints (architecture, tech stack)
3. ✅ Satisfies Compliance requirements (constitution, governance)
4. ✅ Enables Planning (can be handed to developer for implementation)

**Expected Output:** `/specs/N-feature-name/spec.md` (approved and ready for planning phase)

---

## When to Use This Workflow

✅ **USE THIS WORKFLOW WHEN:**

- Starting a new feature request
- Refining vague requirements
- Before any coding begins
- When architecture needs pre-approval

❌ **DON'T USE THIS WORKFLOW FOR:**

- Hotfixes (use constitution amendment process)
- One-liner tasks (use tasks template directly)
- Documentation updates (use constitution amendments)

---

## Role: Specification Engineer

**Your Job:**

- Ask clarifying questions (never assume)
- Bridge product intent → technical design
- Identify risks early
- Get approval before planning starts

**Tools You Need:**

- `.specify/memory/constitution.md` (project DNA)
- `.specify/templates/spec-template.md` (structure)
- Postman "AskAMuslimBackend API Copy" (API reference)
- Project tech stack knowledge

---

## Step-by-Step Workflow

### PHASE 1: INTAKE & CLARIFICATION

#### Step 1.1: Understand the Request

**Ask Questions:**

- "What problem does this solve?"
- "Who is affected?" (users, admins, developers)
- "Why NOW?" (priority, dependencies)
- "What's OUT OF SCOPE?" (document explicitly)

**Example:**

```
Request: "Add user profile editing"

Questions:
- Can users edit ANY field? (Or just name/bio/avatar?)
- Must handle image upload? (File size limits?)
- Real-time preview or confirmation screen?
- Is this a feature flag or always-on?
```

#### Step 1.2: Map to Project Architecture

**Checklist:**

- [ ] Is this a NEW page? (add to `src/app/pages/`)
- [ ] Or NEW component in existing page?
- [ ] Requires NEW API endpoints? (check Postman)
- [ ] NEW facade methods? (data transformation layer)
- [ ] NEW signals? (state management)

**Example:**

```
Profile Editing:
- NEW page: src/app/pages/profile/
- Uses EXISTING API: /api/StudentProfiles/{id} (PUT)
- NEW facade method: updateProfile()
- NEW signals: _profileForm, _saving, _errors
```

#### Step 1.3: Verify Against Constitution

**Checklist - Must align with:**

- [ ] Angular 20 + Standalone components + OnPush
- [ ] Signal-based state (NO BehaviorSubject)
- [ ] Strict TypeScript (NO any types)
- [ ] Feature-first architecture
- [ ] API flow: Generated Fn → Facades → Components
- [ ] Centralized error handling
- [ ] NO inline styles (use design tokens)

**If violates constitution:**
→ Propose amendment or redesign the feature

---

### PHASE 2: SPECIFICATION WRITING

#### Step 2.1: Create Spec File

**File Location:** `/specs/N-feature-name/spec.md`

**Naming Convention:**

- Use incrementing spec ID: `0`, `1`, `2`, ...
- Use kebab-case feature name: `0-user-profile`, `1-quiz-scoring`
- Example: `/specs/1-user-profile/spec.md`

#### Step 2.2: Fill Out Spec Template Sections

**Use:** `.specify/templates/spec-template.md`

**Sections to Complete:**

**1. OVERVIEW**

- Problem statement (1-2 sentences)
- Success criteria (5-7 testable criteria)
- Scope (included + explicitly out)

**2. USER STORIES**

- At least 2-3 stories
- Format: `As [role], I want [action] to [benefit]`
- Include scenarios (Given/When/Then)

**3. TECHNICAL DESIGN**

- Architecture impact (which layers affected?)
- Data model (new types/interfaces)
- State management (signals/facades)
- Error scenarios (what can go wrong?)

**4. IMPLEMENTATION TASKS**

- 5-7 workstreams (API, Facade, Component, Routes, etc.)
- Each with sub-tasks

**5. RISKS & MITIGATION**

- Document 3-5 risks with contingencies

#### Example: Filled Spec

```markdown
# Spec 1: User Profile Editing

## Overview

### Problem Statement

Users cannot edit their profile information (name, bio, avatar).
Currently stuck with default profile.

### Success Criteria

- [ ] User can edit name, email, bio via form
- [ ] User can upload profile picture (< 5MB)
- [ ] Form validates in real-time
- [ ] Save shows spinner + success message
- [ ] Component loads from /api/StudentProfiles/{id}

### Scope

INCLUDED: Edit, upload image, validation, loading states
OUT: Batch editing, profile sharing, privacy settings

## Tech Design

### Layer Impact

- **API:** PUT /api/StudentProfiles/{id} (verify in Postman)
- **Facade:** New updateProfile() method in StudentFacade
- **Component:** New ProfileEditComponent (standalone, OnPush)
- **Route:** /account/profile-edit

### State Management

private \_profileForm = signal<ProfileForm>({...})
public profileErrors = computed(() => validate(this.\_profileForm()))
```

---

### PHASE 3: VALIDATION & REVIEW

#### Step 3.1: Self-Review Against Checklist

Before submitting, verify:

**[ ] Specification Quality**

- [ ] Problem is clearly stated
- [ ] Success criteria are testable
- [ ] Scope is explicit (what's OUT?)
- [ ] Technical design is sound
- [ ] Risks identified with mitigations

**[ ] Architecture Compliance**

- [ ] Aligns with constitutionrules
- [ ] API endpoints verified in Postman
- [ ] Data model appropriate
- [ ] State management uses Signals
- [ ] Component uses Standalone + OnPush

**[ ] Actionability**

- [ ] A developer could implement from this spec
- [ ] All file paths specified
- [ ] API endpoints documented
- [ ] Error scenarios covered

**[ ] No Red Flags**

- [ ] NO "TBD" (must be decided now)
- [ ] NO mega-features (break into 2-3 specs)
- [ ] NO assumptions (verify all claims)

#### Step 3.2: Get Approval

**Approval Flow:**

1. **From Tech Lead:**
   - Validates architecture alignment
   - Queries on design decisions
   - Approves technical approach

2. **From Product Owner:**
   - Validates user need
   - Confirms priorities
   - Approves scope

3. **From QA/Design (if applicable):**
   - QA: Test strategy realistic?
   - Design: Mockups/wireframes approved?

**Table in Spec:**

```markdown
| Role          | Name   | Date       | Status      |
| ------------- | ------ | ---------- | ----------- |
| Tech Lead     | [Name] | YYYY-MM-DD | ✅ APPROVED |
| Product Owner | [Name] | YYYY-MM-DD | ✅ APPROVED |
```

---

### PHASE 4: HAND-OFF TO PLANNING

#### Step 4.1: Create Plan Document

**When spec is APPROVED:**

1. Copy template: `.specify/templates/plan-template.md`
2. Save to: `/specs/N-feature-name/plan.md`
3. Use spec as input for plan
4. Detail implementation workstreams (Façade, Component, Routes, etc.)

**Spec → Plan Mapping:**

```
Spec Section          → Plan Section
Technical Design      → Detailed workstreams (API, Fac, Component, Routes)
Implementation Tasks  → Phase 1-7 with checkboxes
Risks & Mitigation    → Contingency decisions
```

#### Step 4.2: Create Tasks Document

**When plan is ready:**

1. Copy template: `.specify/templates/tasks-template.md`
2. Save to: `/specs/N-feature-name/tasks.md`
3. Break each workstream into atomic tasks
4. Add time estimates and dependencies

**Plan → Tasks Mapping:**

```
Plan Workstream       → Detailed tasks with checkboxes
"Phase 1: API"        → Task 1.1, 1.2, 1.3, ... (each < 2 hours)
"Phase 2: Facade"     → Task 2.1, 2.2, 2.3, ...
```

---

### PHASE 5: DOCUMENT & COMMIT

#### Step 5.1: Create Supporting Docs

**Optional (if needed):**

- Wireframes/mockups (reference Figma link)
- API endpoint details (reference Postman collection)
- Database schema changes (if applicable)
- Integration points (third-party APIs?)

#### Step 5.2: Commit to Git

```bash
git add specs/N-feature-name/spec.md
git commit -m "spec(N-feature-name): define [feature] requirements

- User stories and scenarios
- Technical architecture design
- Implementation plan overview
- Risks and mitigation strategies
- Approved by Tech Lead & Product Owner

[speckit-ref: N-feature-name]"
```

---

## Troubleshooting

**"I'm not sure if this violates the constitution"**
→ Open `.specify/memory/constitution.md`, search for the concept, or propose amendment

**"The feature seems too big"**
→ Break into 2-3 specs. Example: [Feature] = [Core] + [UI] + [Validation]

**"One stakeholder said yes, another said no"**
→ Resolve conflict in INTAKE phase (Step 1.1). Don't proceed until aligned

**"API endpoint doesn't exist"**
→ Document as blocker. Contact backend team. Plan won't start until API ready

**"Success criteria seem vague"**
→ Make them testable: Instead of "works", say "loads < 2s (Lighthouse)"

---

## AI Agent Guidelines

**When an agent creates a spec, it MUST:**

1. ✅ **Read constitution first** - all 9 sections
2. ✅ **Ask clarifying questions** - never assume
3. ✅ **Reference Postman collection** - API endpoints MUST exist
4. ✅ **Verify architecture** - draw the data flow
5. ✅ **Identify risks early** - 3+ risk scenarios
6. ✅ **Get explicit approval** - before moving to planning phase
7. ✅ **Include spec ID in commits** - `[speckit-ref: N-feature]`
8. ✅ **NEVER skip the spec phase** - code-first = chaos

**Spec Phase BLOCKER Checklist:**

- [ ] Constitution read and complied
- [ ] API endpoints verified in Postman
- [ ] Architecture diagram drawn (data flows)
- [ ] Tech Lead approval obtained
- [ ] Product Owner approval obtained
- [ ] No "TBD" or assumptions remain

---

## Expected Outcomes

After following this workflow, you should have:

✅ `/specs/N-feature-name/spec.md` (APPROVED)

- Clear problem statement
- Testable success criteria
- Technical architecture documented
- 5+ implementation workstreams identified
- 3+ risks mitigated
- All stakeholders signed off

✅ Ready for **PLANNING PHASE**

- Next: Follow `.agents/workflows/speckit.plan.md`
- Output: `/specs/N-feature-name/plan.md` (detailed implementation)

✅ Git History

- Clean commit trail
- All decisions documented
- Ready for code review phase

---

**Workflow Version:** 1.0  
**Last Updated:** 2026-03-11
