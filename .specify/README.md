# Speckit Governance Hub

Welcome to the AskAMuslim Speckit Governance Layer! This directory contains the **Project Constitution** and standardized templates that enable **zero-drift architectural compliance**.

---

## 📋 Quick Navigation

### 🏛️ Core Documents

| Document                                           | Purpose                                                           | Read When                              |
| -------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------- |
| [`memory/constitution.md`](memory/constitution.md) | Project DNA - immutable rules, tech stack, architectural patterns | Starting any work; updating governance |
| [`memory/amendments/`](memory/amendments/)         | Amendment history - changes to constitution                       | Reviewing what changed and why         |

### 📐 Templates (For Creating New Specs)

| Template                                                     | Purpose                           | Use Case                                 |
| ------------------------------------------------------------ | --------------------------------- | ---------------------------------------- |
| [`templates/spec-template.md`](templates/spec-template.md)   | Feature specification structure   | Starting a new feature                   |
| [`templates/plan-template.md`](templates/plan-template.md)   | Implementation planning breakdown | Converting spec → implementation roadmap |
| [`templates/tasks-template.md`](templates/tasks-template.md) | Atomic developer tasks            | Converting plan → executable tasks       |

### 🔄 Workflows (For AI Agents & Developers)

Located in `.agents/workflows/`:

| Workflow          | Purpose                           | When to Use                        |
| ----------------- | --------------------------------- | ---------------------------------- |
| `speckit.specify` | Creating feature specifications   | Starting feature work              |
| `speckit.plan`    | Creating implementation plans     | Spec is approved, ready to code    |
| `speckit.tasks`   | Creating atomic development tasks | Plan is approved, ready to execute |

### 📂 Live Specifications

Organized by spec ID in `/specs/`:

| Spec                       | Status           | Phase      |
| -------------------------- | ---------------- | ---------- |
| `0-baseline-verification/` | 🟢 BOOTSTRAPPING | Foundation |
| `1-feature-name/`          | (Create next)    | --         |

---

## 🚀 Getting Started (Developer Workflow)

### Step 1: Understand the Constitution

```bash
# Read project DNA (15 min)
cat .specify/memory/constitution.md
```

**Key sections to understand:**

1. **Core Principles** - non-negotiable engineering rules
2. **Architecture & Boundaries** - module ownership and layering
3. **Development Workflow & Quality Gates** - Analyze/Plan/Implement/Verify + required checks
4. **Governance** - amendment process, semver policy, and compliance review

### Step 2: Review Latest Amendments

```bash
# Check what changed since last session
ls -la .specify/memory/amendments/ | head -5
cat .specify/memory/amendments/[latest].md
```

### Step 3: Pick Your Workflow

**SCENARIO A: New Feature**

→ Use `.agents/workflows/speckit.specify.md`

→ Create `/specs/N-feature-name/spec.md`

→ Get approval from Tech Lead

**SCENARIO B: Approved Spec, Need Plan**

→ Use `.agents/workflows/speckit.plan.md`

→ Create `/specs/N-feature-name/plan.md`

→ Get approval from Tech Lead

**SCENARIO C: Plan Ready, Need Tasks**

→ Use `.agents/workflows/speckit.tasks.md`

→ Create `/specs/N-feature-name/tasks.md`

→ Execute and check off tasks

### Step 4: Verify Your Work

Before committing:

```bash
# Type check
npm run build

# Test
npm run test

# Lint
npm run lint

# API sync (if touched API)
npm run api:sync
```

---

## 🤖 For AI Agents

### Pre-Execution Checklist

Before starting ANY task:

1. **Read this README** (you're reading it! ✅)
2. **Read `memory/constitution.md`** - know all core principles
3. **Check amendments** - understand what changed
4. **Verify baseline** - `npm run build` passes
5. **Know the workflow** - use appropriate `.agents/workflows/*.md`

### Compliance Rules (Non-Negotiable)

```typescript
// ✅ DO: Follow constitution strictly
// ✅ DO: Ask for spec approval before coding
// ✅ DO: Use ANALYZE-PLAN-IMPLEMENT workflow
// ✅ DO: Verify build passes before commit

// ❌ DON'T: Deviate from tech stack
// ❌ DON'T: Create hot-fixes (use amendment process)
// ❌ DON'T: Assume endpoints exist (verify in Postman)
// ❌ DON'T: Skip type checking or tests
```

### Reference the Constitution

When making architectural decisions:

```markdown
**Per Constitution Section 3.3:**
"All errors must flow through error-normalizer.ts"

**Implementation:** src/core/errors/error-normalizer.ts
```

---

## 📊 Governance Metrics

### Project Health Dashboard

- ✅ **Constitution:** Version 2.0.0, Last Updated: 2026-03-14
- ✅ **Compliance Level:** STRICT (agents follow without deviation)
- ✅ **Build Status:** Zero TypeScript errors (baseline: `npm run build`)
- ✅ **Test Coverage:** >= 75% (baseline: `npm run test`)
- ✅ **API Sync:** Valid (baseline: `npm run swagger:check`)
- ✅ **Component Compliance:** All standalone + OnPush (baseline verified)

### Recent Activity

| Date       | Change                                    | Type       |
| ---------- | ----------------------------------------- | ---------- |
| 2026-03-11 | Constitution v1.0 created                 | Governance |
| 2026-03-14 | Constitution v2.0.0 amended and synced    | Governance |
| 2026-03-11 | Spec 0: Baseline Verification initialized | Spec       |

---

## 🔧 Amending the Constitution

If you find a rule that doesn't match reality:

### Step 1: Document the Gap

Create a file: `.specify/memory/amendments/YYYY-MM-DD-amendment-name.md`

```markdown
# Amendment: [Title]

**Date:** 2026-03-11
**Reason:** [Why this change?]
**Impact:** [What files/workflows change?]

## Current Rule (Wrong)

...

## Proposed Rule (Right)

...
```

### Step 2: Get Approval

- Tech Lead review
- Update `constitution.md`
- Update affected templates
- Update this README

### Step 3: Announce

Update the "Recent Activity" table above.

---

## 🗂️ Directory Structure

```
.specify/
├── memory/                          # Persistent project laws
│   ├── constitution.md              # Project DNA (this is law)
│   └── amendments/                  # History of constitution changes
│       └── [YYYY-MM-DD-subject].md
│
└── templates/                       # Standardized templates
    ├── spec-template.md             # Use for new specs
    ├── plan-template.md             # Use for new plans
    └── tasks-template.md            # Use for new tasks

.agents/workflows/                   # Agent instruction workflows
├── speckit.specify.md               # How to write specs
├── speckit.plan.md                  # How to write plans
└── speckit.tasks.md                 # How to write tasks

specs/                               # Live feature specifications
├── 0-baseline-verification/         # Bootstrap spec
│   ├── spec.md                      # What we're building
│   ├── plan.md                      # How we'll build it
│   └── tasks.md                     # Atomic work items
│
└── [N-feature-name]/                # Future specs follow this pattern
    ├── spec.md
    ├── plan.md
    └── tasks.md
```

---

## 🎯 Success Criteria

Your project has **Zero-Drift Governance** when:

- ✅ Constitution accurately reflects code reality
- ✅ All new specs follow spec-template.md
- ✅ All plans follow plan-template.md
- ✅ All tasks follow tasks-template.md
- ✅ Build always passes with zero errors
- ✅ Tests always pass with >= 75% coverage
- ✅ No `any` types in /src/app
- ✅ All components are standalone + OnPush
- ✅ All errors flow through error-normalizer
- ✅ All commits reference spec IDs
- ✅ Amendments tracked and approved

---

## 📞 Questions?

| Question                   | Answer                                                                  | Contact           |
| -------------------------- | ----------------------------------------------------------------------- | ----------------- |
| "What's the tech stack?"   | Read `memory/constitution.md` Core Principles and Architecture sections | Tech Lead         |
| "How do I write a spec?"   | Read `.agents/workflows/speckit.specify.md`                             | Architecture Team |
| "Can I break the rules?"   | Only with constitution amendment                                        | Tech Lead         |
| "What's a core principle?" | Read `memory/constitution.md` Core Principles                           | Tech Lead         |

---

**Status:** 🟢 ACTIVE  
**Governance Version:** 2.0.0  
**Last Updated:** 2026-03-14  
**Maintained By:** AskAMuslim Architecture Team
