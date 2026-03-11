# 🤖 AI Agent Speckit Onboarding Guide

When you (an AI agent or developer) return to this project, follow this checklist **EVERY TIME** before starting work.

---

## 🔵 MANDATORY: Pre-Session Initialization (10 minutes)

### Step 1: Sync Latest Governance State
```bash
# Verify constitution is loaded
cat .specify/memory/constitution.md | head -50

# Check for recent amendments
ls -la .specify/memory/amendments/ | tail -5 
cat .specify/memory/amendments/[latest if any].md
```

**What to verify:**
- Constitution exists and is readable
- No critical amendments have passed since your last session
- Timestamp is recent (last few weeks)

### Step 2: Verify Project Baseline
```bash
# Can the project still build?
npm run build

# Do tests still pass?
npm run test

# Is the API contract in sync?
npm run swagger:check
```

**What to verify:**
- ✅ Build: Zero TypeScript errors
- ✅ Tests: All pass with >= 75% coverage
- ✅ API: No contract mismatches

### Step 3: Understand Your Task Context

**If starting a NEW feature:**
→ Read `.agents/workflows/speckit.specify.md`
→ Your output: `/specs/N-feature-name/spec.md`

**If implementing an APPROVED spec:**
→ Read `.agents/workflows/speckit.plan.md`
→ Your output: `/specs/N-feature-name/plan.md`

**If executing from a plan:**
→ Read `.agents/workflows/speckit.tasks.md`
→ Your output: `/specs/N-feature-name/tasks.md` (then execute)

---

## 🟢 ESSENTIAL: Read These Documents (In Order)

### Document 1: Constitution (Non-Negotiable)
**File:** `.specify/memory/constitution.md`  
**Read Time:** 20 minutes  
**What You'll Learn:**
- 10 unbreakable rules (Section 3)
- Architecture patterns (Section 3)
- Tech stack (Section 2)
- How AI agents must behave (Section 5)

**Key Sections to Highlight:**
```markdown
## 3. ARCHITECTURE PATTERNS (UNBREAKABLE)
### Component Architecture
### Data Flow Pattern (Mandatory)
### State Management Pattern
### Error Handling (Centralized)
### Change Detection Strategy

## 5. EXECUTION GUIDELINES
### AI Agent Behavior Rules
```

### Document 2: Project Overview
**File:** `.specify/README.md`  
**Read Time:** 10 minutes  
**What You'll Learn:**
- Directory structure
- Quick navigation
- Developer workflow
- How to use templates

### Document 3: Compliance Checklist
**File:** `.specify/COMPLIANCE-CHECKLIST.md`  
**Read Time:** 5 minutes (reference)  
**When to Consult:**
- Before submitting code
- When in doubt about a pattern
- To verify your implementation

### Document 4: Your Specific Workflow
**File:** `.agents/workflows/speckit.[specify|plan|tasks].md`  
**Read Time:** 15 minutes  
**When to Use:**
- Depends on your task (see Step 3 above)

---

## 🟡 CRITICAL: The 10 Unbreakable Rules

Before writing ANY code, internalize these:

```
1. ✅ Standalone Components ONLY (no NgModule-based)
2. ✅ Signal-based state (no BehaviorSubject)
3. ✅ Strict TypeScript (no `any`, no unsafe casts)
4. ✅ NO HTTP in components (use Facades)
5. ✅ NO business logic in templates
6. ✅ OnPush change detection ALWAYS
7. ✅ Immutable state updates (signal-safe)
8. ✅ NO inline styles (use tokens)
9. ✅ Error flow through error-normalizer.ts
10. ✅ markForCheck() after async subscriptions
```

**Each rule has detailed examples in constitution.md**

---

## 🟣 DECISION TREE: What Should I Do?

```
┌─ DO I HAVE CLEAR REQUIREMENTS?
├─ NO → Go back, clarify requirements first
└─ YES ↓
    ├─ IS THIS A NEW FEATURE?
    │  ├─ YES → Use .agents/workflows/speckit.specify.md
    │  │        Output: /specs/N-*/spec.md
    │  └─ NO ↓
    └─ IS THERE AN APPROVED SPEC?
       ├─ NO → Get spec approved first
       └─ YES ↓
           ├─ IS THERE AN APPROVED PLAN?
           │  ├─ NO → Use .agents/workflows/speckit.plan.md
           │  │       Output: /specs/N-*/plan.md
           │  └─ YES ↓
           └─ USE .agents/workflows/speckit.tasks.md
              Output: /specs/N-*/tasks.md
              Action: Execute tasks
```

---

## 🔴 FORBIDDEN: What NOT to Do

```
❌ DON'T deviate from the constitution without amendment
❌ DON'T assume endpoints exist (verify in Postman)
❌ DON'T create "quick fixes" without spec
❌ DON'T use `any` type (use `unknown` + narrow)
❌ DON'T skip the ANALYZE-PLAN-IMPLEMENT workflow
❌ DON'T commit without running build + tests
❌ DON'T add inline styles
❌ DON'T call HTTP from component
❌ DON'T mutate state directly (use signal.set())
❌ DON'T skip TypeScript strict mode
```

---

## 🟢 SESSION CHECKLIST

Copy this checklist and complete it every session:

```markdown
# Session Start Checklist - [DATE]

## Pre-Session (10 min)
- [ ] Read constitution section 1-3 (understanding)
- [ ] Check for amendments since last session
- [ ] Run `npm run build` - passes ✅
- [ ] Run `npm run test` - passes ✅
- [ ] Run `npm run swagger:check` - passes ✅

## Task Analysis (5 min)
- [ ] Understand task context (spec/plan/tasks)
- [ ] Verify specification is clear and approved
- [ ] Identity which workflow to use (specify/plan/tasks)
- [ ] Know the outputs expected

## Implementation (ongoing)
- [ ] Follow ANALYZE-PLAN-IMPLEMENT workflow
- [ ] Reference constitution for patterns
- [ ] Use compliance checklist before submitting
- [ ] Commit with [speckit-ref: N] tag

## Pre-Commit (10 min)
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm run test`
- [ ] Lint passes: `npm run lint`
- [ ] Compliance checklist reviewed
- [ ] Commit message has spec ID

## Sign-Off
- [ ] All checkboxes complete
- [ ] Ready to push/submit PR
- [ ] Handoff notes documented
```

---

## 📞 Common Questions

**Q: "Can I modify the constitution?"**  
A: No. File an amendment in `.specify/memory/amendments/`. Constitution is law.

**Q: "The constitution says X, but the code does Y. What do I do?"**  
A: File a bug report + amendment proposal. Don't work around it.

**Q: "I want to use BehaviorSubject instead of Signals."**  
A: That's a constitution violation. Propose an amendment with evidence.

**Q: "Where do I put my feature code?"**  
A: Follow the directory structure in `constitution.md` Section 3.

**Q: "The spec isn't clear. Should I just start coding?"**  
A: NO. Use `speckit.specify.md` workflow to clarify requirements first.

**Q: "Can I hot-fix this issue?"**  
A: Only if it's a blocker AND has a spec. Otherwise, propose amendment.

**Q: "How do I know if I'm following the patterns correctly?"**  
A: Use `COMPLIANCE-CHECKLIST.md` before every commit.

---

## 🎯 Success Metrics (How to Know You're Doing It Right)

After your session:

- ✅ `npm run build` passes with **zero errors**
- ✅ `npm run test` passes with **>= 75% coverage**
- ✅ Code follows all **10 unbreakable rules**
- ✅ Spec is **approved and traceable** in git history
- ✅ Commit has **[speckit-ref: N]** tag
- ✅ PR references **spec ID** in description
- ✅ No governance **amendments needed** (unless proposing one intentionally)

---

## 🚀 QUICK START FOR EXPERIENCED DEVELOPERS

If you've read the constitution before:

```bash
# 1. Quick sync
git pull
cat .specify/memory/amendments/[latest].md

# 2. Verify baseline
npm run build && npm run test

# 3. Find your spec
cat /specs/N-feature-name/spec.md

# 4. Start workflow
# Pick one:
# - New feature? → Use speckit.specify
# - Making plan? → Use speckit.plan  
# - Executing? → Use speckit.tasks

# 5. Work through it
# Reference constitution.md for patterns

# 6. Pre-commit check
npm run build && npm run test && npm run lint

# 7. Commit with specs
git commit -m "feat(scope): description [speckit-ref: N-feature]"
```

---

## 📚 Reference Stack

Keep these files open while working:

1. `.specify/memory/constitution.md` - Project DNA
2. `.agents/workflows/speckit.[workflow].md` - Your current workflow
3. `.specify/COMPLIANCE-CHECKLIST.md` - Validation gate
4. `Postman collection` - API reference
5. Your feature's `/specs/N-/` folder - Task source

---

## 🔒 Governance Compliance Pledge

By working in this project, you agree to:

✅ Read and follow the constitution  
✅ Use ANALYZE-PLAN-IMPLEMENT workflow  
✅ Get spec approval before coding  
✅ Submit code that passes all checks  
✅ Propose amendments (don't work around)  
✅ Tag commits with [speckit-ref: N]  

---

**Agent Onboarding Version:** 1.0  
**Last Updated:** 2026-03-11  
**Next Review:** When constitution is amended

---

**Welcome to Speckit Governance! 🎯**

You're now equipped to build features that are compliant, traceable, and maintainable.

Questions? Reference `.specify/README.md` or the constitution.
