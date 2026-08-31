# AGENTS.md — AI Coding Agent Instructions for Store3D

## Source of Truth

**`.ai/CANONICAL_CONTEXT.md`** is the single source of truth for all project context. When this file conflicts with CANONICAL_CONTEXT.md, prefer CANONICAL_CONTEXT.md.

**Before making any changes, read:**
1. `.ai/CANONICAL_CONTEXT.md` — requirements, constraints, architecture, design direction, decisions
2. `.ai/CURRENT_STATE.md` — what's implemented, known issues, tech debt (for context on current state only)

Do NOT read other `.ai/` files (PROJECT.md, ARCHITECTURE.md, KNOWLEDGE_MAP.md) unless CANONICAL_CONTEXT.md explicitly references them for a specific detail.

## Required Workflow

### 1. UNDERSTAND
- Read `.ai/CANONICAL_CONTEXT.md` sections relevant to your task (REQUIREMENTS, CONSTRAINTS, DESIGN DIRECTION, DECISIONS)
- Read `.ai/CURRENT_STATE.md` to understand what's already implemented
- Understand the request fully before acting
- Clarify ambiguous requirements with the user

### 2. EXPLORE
- Use `Glob` and `Grep` to find relevant files
- Read existing code to understand patterns before modifying
- Check similar features for conventions (e.g., how other controllers/services/routes are structured)

### 3. RESEARCH (when necessary)
- Follow the research hierarchy in CANONICAL_CONTEXT.md §5 (RESEARCH)
- Use the decision tree in CANONICAL_CONTEXT.md §5 to choose the right tool
- Apply research discipline rules from CANONICAL_CONTEXT.md §5

### 4. BRAINSTORM (when appropriate)
- Use Superpowers brainstorming skill for substantial new features
- Skip for trivial changes (typo fixes, small config changes)
- Get user approval before implementing substantial features

### 5. PLAN (for complex implementation)
- Create a todo list for multi-step tasks
- Break complex work into smaller, verifiable steps
- Write plans to `docs/superpowers/plans/` for major features

### 6. IMPLEMENT
- Follow existing code patterns exactly
- Follow all OUTPUT REQUIREMENTS in CANONICAL_CONTEXT.md §11 (code style, response format, file naming)
- Do NOT refactor unrelated code

### 7. VERIFY
- Follow VERIFICATION steps in CANONICAL_CONTEXT.md §10
- Follow ACCEPTANCE CRITERIA in CANONICAL_CONTEXT.md §9
- Verify no regressions in existing functionality
- **If task involved frontend code:** Run frontend quality gate (skill: `frontend-quality-checklist`)
  - Determine task profile from context (UI Change, Performance, Accessibility, Security, SEO, Production Release, New Project)
  - Run only applicable checklist categories per profile
  - Fix Critical issues before completing
  - Fix or explicitly justify High issues before completing
  - Report Medium/Low issues appropriately
  - Backend-only, database-only, documentation-only, and unrelated config tasks skip the frontend quality gate

### 8. UPDATE MEMORY
- Update `.ai/CURRENT_STATE.md` after material project changes (new features, completed work, new known issues)

## Safety Rules

- **NEVER** violate hard constraints in CANONICAL_CONTEXT.md §4 (C1–C7)
- **NEVER** modify existing files unless the task requires it
- **NEVER** refactor unrelated code while working on a feature
- **NEVER** invent requirements or architecture decisions
- **NEVER** add dependencies without user approval
- **NEVER** change environment variables or deployment configuration
- **ALWAYS** preserve existing functionality
- **ALWAYS** follow existing patterns
- **ALWAYS** verify changes before claiming completion

## Tool Usage Policy

### GitNexus
**USE WHEN:**
- Tracing unfamiliar code across multiple files (callers, callees, impact)
- Architecture/code relationship discovery
- Impact analysis before modifying shared code
- Renaming symbols across the codebase

**DO NOT USE WHEN:**
- Simple one-file edits
- You already know the exact file and function to change
- Searching for a string/keyword (use `Grep` instead)

### Context7
**USE WHEN:**
- External library/API documentation is actually needed
- Verifying current API syntax for a library the project already uses
- Migration guidance between library versions

**DO NOT USE WHEN:**
- The repository already demonstrates the correct API usage
- You are editing existing code that already uses the library correctly
- The question can be answered by reading project source code

### Playwright
**USE WHEN:**
- Browser/UI verification is needed
- Visual QA for layout, spacing, responsive behavior
- Testing user interactions, navigation, form submissions

**DO NOT USE WHEN:**
- Pure backend logic or TypeScript type changes
- Server-side API verification (use curl or server tests)
- Simple CSS changes that don't need visual verification

### Stitch
**USE WHEN:**
- UI/design generation is genuinely required
- Creating entirely new pages or major redesigns
- Exploring visual directions before implementation

**DO NOT USE WHEN:**
- Backend tasks
- A usable design already exists
- Minor UI tweaks (use existing components)

### Git
**USE TARGETED COMMANDS:**
- `git status` — check working tree state
- `git diff` — see what changed
- `git log --oneline -N` — recent history (keep N small)
- `git diff -- <file>` — specific file changes
- `git add -A && git commit -m "message"` — batch commits

**DO NOT:**
- Dump large git histories
- Run git commands "just in case"

### File Inspection
**RULES:**
- Search first (`Grep`, `Glob`) when location is unknown
- Read only the smallest relevant file/range
- Do not repeatedly read the same file
- Do not read entire large files when only a section is needed
- After reading, hold the information in context — do not re-read the same content

### Testing
**PROPORTIONAL VERIFICATION:**
- One-file UI change → TypeScript check + build
- Backend logic → targeted server test + TypeScript check
- Major feature → TypeScript + build + relevant tests + Playwright smoke
- Simple config change → build only

**DO NOT:**
- Run full test suite for trivial changes
- Claim success without running any verification

## Anti-Guessing Policy

**BEFORE CHANGING CODE:**

1. **Identify the exact feature** — what does the user want?
2. **Locate the existing implementation** — where is the current code?
3. **Inspect related types/interfaces** — what data structures are involved?
4. **Inspect existing API/service/component usage** — how is it currently used?
5. **Confirm the actual current behavior** — what does the code actually do?
6. **Only then modify code**

**IF INFORMATION IS MISSING:**
- SEARCH THE REPOSITORY
- Do NOT invent

**DO NOT ASSUME:**
- A route exists (check `server/src/routes/`)
- An API exists (check ARCHITECTURE.md § API Route Map)
- A component exists (check `client/src/components/`)
- A database field exists (check `server/src/models/`)
- A hook exists (check `client/src/hooks/`)
- An environment variable exists (check `server/src/config/`)
- A library API works a certain way (check existing usage in codebase)

**IF MULTIPLE IMPLEMENTATIONS EXIST:**
- Prefer the implementation already used by the project
- Prefer the smallest change
- Prefer existing abstractions
- Avoid introducing new dependencies unless necessary

## Anti-Redundancy Policy

**MAINTAIN A TASK-LEVEL INVENTORY:**

- Files already inspected
- Architecture already discovered
- Decisions already confirmed
- Tests already passed

**Do not repeatedly perform the same discovery.**

**FOR EACH TASK:**
```
DISCOVER → DECIDE → MODIFY → VERIFY
```

**NOT:**
```
DISCOVER → REDISCOVER → REDISCOVER → MODIFY
```

**WHEN A PREVIOUS AGENT ALREADY PRODUCED A VERIFICATION REPORT:**
- Verify the relevant claims
- Do not restart the entire audit
- Only inspect changed/affected areas

## Task Classification

### SMALL TASK (typo, config change, single-line fix)
```
Understand → targeted inspect → implement → build check
```
**No planning needed. No brainstorming. No full audit.**

### MEDIUM TASK (bug fix, feature enhancement, new component)
```
Understand → inspect relevant files → implement → verify (TypeScript + build)
```
**Short plan acceptable. No full research phase needed.**

### LARGE/ARCHITECTURAL TASK (new page, major feature, redesign)
```
Research → Design → Plan → Implement → Verify → Update memory
```
**Full workflow required. Use design-first-development skill.**

### DEBUGGING
```
Reproduce → isolate → root cause → fix → regression verify
```
**Use systematic-debugging skill. Do not guess at fixes.**

### UI/DESIGN
```
Inspect current UI → design/reference if needed → implement → browser verify
```
**Use design-first-development skill for substantial UI work.**

**DO NOT force every task through every skill.**

## Token Optimization

### MINIMUM NECESSARY CONTEXT

1. **Search before reading large files**
2. **Read relevant ranges instead of entire files**
3. **Do not paste huge files into context unnecessarily**
4. **Do not repeatedly explain the entire project to the model**
5. **Keep canonical project information in `.ai/` files**
6. **Update CURRENT_STATE after meaningful changes**
7. **Keep temporary/debug information out of permanent context**
8. **Avoid duplicate documentation**
9. **Prefer concise verification reports**
10. **Do not run multiple overlapping tools for the same question**

### REDUNDANT `.ai/` FILES

- `.ai/PROJECT.md` — use CANONICAL_CONTEXT.md instead
- `.ai/ARCHITECTURE.md` — use CANONICAL_CONTEXT.md instead
- `.ai/KNOWLEDGE_MAP.md` — use CANONICAL_CONTEXT.md instead
- `.ai/OUTPUT_CONTRACT.md` — reference when needed, not always read

**Only read CANONICAL_CONTEXT.md + CURRENT_STATE.md before starting work.**

## Skill Workflow Selection

### When to Use Each Skill

| Skill | When | Skip When |
|-------|------|-----------|
| `brainstorming` | Substantial new feature, creative work | Trivial changes, config fixes |
| `writing-plans` | Complex multi-step implementation | Single-file edits, small fixes |
| `executing-plans` | Large plan with independent tasks | Simple sequential changes |
| `systematic-debugging` | Bug, test failure, unexpected behavior | Feature implementation |
| `test-driven-development` | Feature or bugfix with test infrastructure | No test infrastructure (C3) |
| `verification-before-completion` | About to claim work is done | Mid-implementation |
| `design-first-development` | New page, major redesign, complex UI | Backend-only, small UI tweaks |
| `frontend-quality-checklist` | Frontend code change complete | Backend-only, config-only |
| `requesting-code-review` | After major feature implementation | Small changes |
| `receiving-code-review` | Got review feedback | No feedback yet |

### Conditional Workflow

**SMALL TASK:**
```
Understand → targeted inspect → implement → targeted verify
```

**MEDIUM TASK:**
```
Understand → inspect → short plan → implement → verify
```

**LARGE/ARCHITECTURAL TASK:**
```
Research → Design → Plan → Implement → Verify
```

**DEBUGGING:**
```
Reproduce → isolate → root cause → fix → regression verify
```

**UI/DESIGN:**
```
Inspect current UI → design/reference if needed → implement → browser verify
```

## Git / Commit Policy

- **Do NOT create commits automatically** unless the task is fully verified
- If changes are correct:
  1. Show concise summary
  2. Verify (TypeScript + build at minimum)
  3. Create one clean commit
  4. Do NOT create many tiny commits for trivial changes
- **Never push unless explicitly instructed**

## Important Behavior

**THE MOST IMPORTANT GOAL IS:**

```
HIGH ACCURACY + LOW TOKEN USAGE + LOW TOOL CALL COUNT + NO GUESSING + NO REDUNDANT WORK
```

**USE THE REPOSITORY AS THE SOURCE OF TRUTH.**

- Do not hallucinate architecture
- Do not call tools merely because they are available
- Do not use MCP tools when normal local file inspection is enough
- Do not use GitNexus when simple search is enough
- Do not use Context7 when the repository already shows the correct API usage
- Do not use Playwright for backend-only tasks
- Do not use Stitch for non-design tasks
- Do not use an LLM when deterministic logic is sufficient
