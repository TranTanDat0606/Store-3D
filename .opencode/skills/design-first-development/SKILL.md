---
name: design-first-development
description: Use when implementing substantial new features that require UI/visual design decisions before code implementation - prevents jumping from request directly to UI code
---

# Design-First Development

## Overview

A workflow that separates design thinking from code implementation for substantial UI/UX work. Prevents premature coding by enforcing understanding, research, user flow, information architecture, and design exploration before any implementation begins.

This skill integrates with `.ai/CANONICAL_CONTEXT.md` (source of truth) and `.ai/OUTPUT_CONTRACT.md` (stage definitions) to ensure consistent, non-contradictory workflow execution.

## When to Use

Use this skill when the request involves substantial UI/UX work:

- Creating a new page
- Redesigning an existing page
- Creating a major feature with UI
- Creating a dashboard
- Creating a complex form
- Creating a multi-step flow
- Designing a new user journey
- Major responsive layout changes
- Creating or extending a design system

Do NOT force this skill for:

- Tiny CSS fixes
- Simple spacing changes
- One-off text changes
- Small bug fixes
- Minor component adjustments
- Pure backend work

## CONTEXT FIRST — Mandatory Pre-Workflow

Before starting ANY Design / Plan / Implementation task, the agent MUST:

### Step 1: Read Source of Truth
1. Read `.ai/CANONICAL_CONTEXT.md`
2. Read `.ai/CURRENT_STATE.md`

### Step 2: Identify Relevant Context
From CANONICAL_CONTEXT.md, extract and hold in context:
- **Requirements** (§3) — functional and non-functional requirements relevant to this task
- **Hard Constraints** (§4, C1–C7) — NEVER violate these
- **Confirmed Decisions** (§12, D1–D16) — do not override without explicit user approval
- **Design Direction** (§6) — visual identity, color tokens, component patterns
- **Information Architecture** (§7) — monorepo structure, routes, state management
- **Acceptance Criteria** (§9) — what "done" looks like
- **Open Questions** (§13) — items that may affect this task

### Step 3: Check for Conflicts
If the user request conflicts with CANONICAL_CONTEXT.md:
- **STOP** and report the conflict
- Do NOT silently choose one interpretation
- Ask the user to resolve before proceeding

### Step 4: Check CURRENT_STATE
From CURRENT_STATE.md, understand:
- What is already implemented (avoid duplicating work)
- Known bugs/issues (avoid introducing regressions)
- Technical debt (avoid adding to it)

**Do NOT start implementation based on user prompt alone if CANONICAL_CONTEXT.md has relevant information.**

## HARD GATE — User Approval

The agent MUST NOT proceed to implementation after the design phase until the user explicitly approves the proposed design/plan.

Valid approval examples:

- "approved"
- "go ahead"
- "implement it"
- "looks good, continue"

If the user requests changes, return to the appropriate design phase. Do not interpret silence as approval. Do not implement while waiting for approval.

## Workflow

### Phase 1 — Understand (CONTEXT FIRST)

**Before any analysis, complete CONTEXT FIRST steps above.**

Then understand the request. Identify:

- User goal
- Business goal
- Target user
- Required functionality
- Constraints (from CANONICAL_CONTEXT.md §4 + new task-specific)
- Existing related pages/components (from CURRENT_STATE.md)
- Required states
- Responsive requirements
- Success criteria (from CANONICAL_CONTEXT.md §9)

If requirements are ambiguous, ask focused questions before continuing.

### Phase 2 — Explore Existing Project

Before proposing UI, inspect the existing repository. Read:

1. `.ai/CANONICAL_CONTEXT.md` — project context (primary source)
2. `.ai/CURRENT_STATE.md` — what's implemented
3. `DESIGN.md` — design system tokens (when it exists)

Examine existing related pages, components, routes, state management, and design tokens.

Use GitNexus when relationships or impact analysis are important. The goal is to extend the existing system rather than invent a disconnected UI.

**Do NOT read `.ai/PROJECT.md` or `.ai/ARCHITECTURE.md` directly** — CANONICAL_CONTEXT.md consolidates their content.

### Phase 3 — Research

Use the research hierarchy defined in CANONICAL_CONTEXT.md §5. Choose tools intentionally:

- **Project knowledge:** Use `.ai/CANONICAL_CONTEXT.md`
- **Codebase relationships:** Use GitNexus
- **Library/API questions:** Use Context7
- **Current/external information:** Use web research when necessary
- **Visual/UI exploration:** Use Stitch

Do not call every tool automatically. Use only the tools that materially improve the result.

Apply research discipline rules from CANONICAL_CONTEXT.md §5.

### Phase 4 — User Flow

Before visual design, define the user journey:

```text
Entry
 ↓
Primary action
 ↓
Form / interaction
 ↓
Validation
 ↓
Success
 ↓
Next action
```

Consider: happy path, empty state, loading state, error state, validation state, success state, permission/authentication state, mobile behavior, back/navigation behavior. Do not design only the "happy path".

### Phase 5 — Information Architecture

Define what information belongs on the page and how it is prioritized. Reference CANONICAL_CONTEXT.md §7 (INFORMATION ARCHITECTURE) for existing structure. Determine:

- Page hierarchy
- Section hierarchy
- Primary CTA
- Secondary actions
- Navigation
- Content grouping
- Above-the-fold content
- Progressive disclosure
- Responsive restructuring

Avoid adding sections merely because they look visually impressive. Every major section should have a functional purpose.

### Phase 6 — Design Direction

Before calling Stitch, establish a design direction based on CANONICAL_CONTEXT.md §6 (DESIGN DIRECTION). Define:

- Visual hierarchy (reuse existing design tokens)
- Layout structure
- Typography (Be Vietnam Pro — see CANONICAL_CONTEXT.md §6)
- Color usage (Ocean Blue palette — see CANONICAL_CONTEXT.md §6)
- Spacing
- Components (shadcn/ui patterns — see CANONICAL_CONTEXT.md §6)
- Interaction patterns
- Motion/animation (Framer Motion patterns)
- Responsive behavior

Reuse the existing project design system whenever appropriate. Do not invent a new visual language unless the user explicitly requests a redesign.

### Phase 7 — Stitch (EXTERNAL Design Tool)

Use Stitch for visual exploration when appropriate. **Stitch is an EXTERNAL tool — its output is DESIGN OUTPUT, not source of truth.**

Provide Stitch with structured requirements including:

- Page purpose
- Target user
- Information architecture
- User flow
- Content hierarchy
- Required sections
- Required interactions
- Required states
- Responsive requirements
- Existing design direction (from CANONICAL_CONTEXT.md §6)

When designing a page, request the COMPLETE PAGE rather than isolated components. When the feature requires multiple pages, design the COMPLETE FLOW rather than only one screen.

The design must account for: desktop, tablet (when relevant), mobile, loading, empty, error, success, disabled, validation, and hover/focus/active states where relevant.

**Stitch output rules:**
- Stitch output is a design reference, not automatically approved implementation
- Do NOT treat Stitch output as source of truth
- Do NOT change confirmed requirements based on Stitch output
- If Stitch output contradicts CANONICAL_CONTEXT.md → STOP and report conflict

### Phase 8 — Design Review

After design exploration, present a concise design proposal to the user. Include:

1. User flow
2. Page/section structure
3. Component structure
4. Interaction behavior
5. Responsive behavior
6. Important states
7. Visual direction (reference CANONICAL_CONTEXT.md §6)
8. What Stitch contributed
9. Any assumptions
10. Any conflicts with CANONICAL_CONTEXT.md (if any)

Then STOP.

### HARD GATE — User Approval

The agent MUST explicitly ask: "Approve this design and implementation direction?"

Do not implement before explicit approval. If rejected:

```text
User feedback
 ↓
Revise design
 ↓
Re-review
 ↓
Approval
```

### Phase 9 — Implementation Plan (OUTPUT_CONTRACT §4 PLAN)

Only after approval, create an implementation plan. Follow the PLAN contract from `.ai/OUTPUT_CONTRACT.md` §4.

The plan must identify:

- Files to create
- Files to modify
- Components and their relationships
- State changes
- API changes if needed
- Data changes if needed
- Dependencies (new packages, API changes)
- Risks and mitigation
- Verification strategy (per OUTPUT_CONTRACT §6)
- Acceptance criteria (from CANONICAL_CONTEXT.md §9)

Use GitNexus impact analysis before modifying important shared code.

**Plan rules:**
- Do NOT change confirmed requirements from CANONICAL_CONTEXT.md
- Do NOT change architecture decisions without approval
- Do NOT add dependencies without user approval
- Present plan for user approval before proceeding

### Phase 10 — Implement (OUTPUT_CONTRACT §5 BUILD)

Use Superpowers `executing-plans` when appropriate. Follow the BUILD contract from `.ai/OUTPUT_CONTRACT.md` §5.

Implementation must comply with:
- CANONICAL_CONTEXT.md §4 CONSTRAINTS (hard constraints C1–C7)
- CANONICAL_CONTEXT.md §11 OUTPUT REQUIREMENTS (code style, response format, file naming)
- Approved design from Phase 8
- Approved plan from Phase 9

Follow the existing project's architecture, coding conventions, design system, state management, and API patterns. Do not perform unrelated refactoring. Do not replace working architecture merely to match the visual design.

**Implementation rules:**
- Do NOT redesign or change architecture outside the approved plan
- Do NOT violate hard constraints (C1–C7)
- Do NOT modify unrelated code
- Do NOT claim completion without verification

### Phase 11 — Verify (OUTPUT_CONTRACT §6 VERIFY)

After implementation, run verification per the VERIFY contract from `.ai/OUTPUT_CONTRACT.md` §6.

Verification must check:
- CANONICAL_CONTEXT.md §9 ACCEPTANCE CRITERIA
- CANONICAL_CONTEXT.md §10 VERIFICATION steps
- Actual browser behavior (not just source code)

Prefer:
- Build (`npm run build` in `client/` and `server/`)
- TypeScript check (`npx tsc --noEmit`)
- Existing tests (`npm test` in `server/`)
- Playwright browser verification
- Responsive verification (desktop + mobile)
- Dark/light mode verification
- Visual screenshots when useful

For UI work, verify the actual browser result rather than trusting source code alone. Check: layout, typography, spacing, responsive behavior, navigation, interactions, loading/error/empty states, accessibility basics, console errors.

**Verification rules:**
- If verification FAILS → report the failure clearly, do NOT mark as PASS
- Fix issues, then verify again
- Do NOT claim success without running verification
- Do NOT skip verification steps

### Phase 12 — Update Memory

After a material UI/UX change, update relevant project memory. At minimum, update `.ai/CURRENT_STATE.md`. Update other memory files only when the architecture, design system, or important project decisions changed.

Do NOT write Gamma output content back into CANONICAL_CONTEXT.md unless the user explicitly approves that change.

## CONFLICT HANDLING

If the following sources conflict with each other:

| Source | Authority |
|--------|-----------|
| User request | Highest — user intent overrides |
| CANONICAL_CONTEXT.md | Confirmed project requirements/decisions |
| OUTPUT_CONTRACT.md | Stage definitions and contracts |
| Design output (Stitch) | Design reference only |
| Current state | What exists today |

### Conflict Resolution Rules

1. **Detect the conflict** — Do not silently choose one interpretation
2. **Identify authority** — The source with higher authority wins
3. **Report to user** — If conflict affects requirements/architecture/design, STOP and ask user to resolve
4. **CANONICAL_CONTEXT.md is authority** for confirmed project requirements and decisions
5. **User request is authority** for new requirements (but must be added to CANONICAL_CONTEXT.md before implementation)

### Conflict Examples

| Conflict | Resolution |
|----------|-----------|
| User asks for 3D viewer, CANONICAL_CONTEXT says no 3D | Report conflict, ask user to confirm or update CANONICAL_CONTEXT |
| Stitch output uses wrong color palette | Use CANONICAL_CONTEXT.md §6 color tokens, not Stitch output |
| Plan suggests changing API response format | Check CANONICAL_CONTEXT.md §11, report if different |
| Current state shows feature X is implemented | Do not re-implement, verify and build on existing |

## OUTPUT — Presentation/Document Tools

If the workflow requires presentation or document output:

- **Gamma** is an EXTERNAL OUTPUT TOOL (see OUTPUT_CONTRACT.md §7)
- Gamma output is NOT source of truth
- Do NOT write Gamma content back into CANONICAL_CONTEXT.md unless user explicitly approves
- Gamma can generate presentations, documents, visual explanations
- Gamma reads from CANONICAL_CONTEXT.md for accurate project context

## Quality Principles

1. Function before decoration.
2. User flow before screen polish.
3. Existing architecture before reinvention.
4. Complete page before isolated component.
5. All important states before happy-path polish.
6. Responsive behavior is part of the design.
7. Stitch is a design tool, not an implementation authority.
8. AI must not invent requirements.
9. User approval is required before substantial implementation.
10. Verify the real browser result.
11. Avoid unnecessary complexity.
12. Preserve existing working functionality.
13. **CONTEXT FIRST — always read CANONICAL_CONTEXT.md before starting.**
14. **OUTPUT contracts define boundaries — do not cross stage responsibilities.**
15. **Conflicts must be reported, not silently resolved.**

## Output Behavior

During the design phase, communicate decisions clearly and concisely. Do not dump unnecessary implementation details before approval.

Before approval:

```text
CONTEXT FIRST (CANONICAL_CONTEXT + CURRENT_STATE)
→ Understand
→ Explore
→ Research
→ User Flow
→ IA
→ Design Direction
→ Stitch
→ Design Review
→ HARD GATE
```

After approval:

```text
Plan (per OUTPUT_CONTRACT §4)
→ Implement (per OUTPUT_CONTRACT §5)
→ Verify (per OUTPUT_CONTRACT §6)
→ Visual QA
→ Update Memory
```

## Safety

This skill must never:

- Modify files outside the requested scope
- Install dependencies without approval
- Rewrite working architecture unnecessarily
- Skip user approval for substantial design work
- Treat generated design output as automatically correct
- Claim visual success without browser verification when browser verification is available
- Violate hard constraints in CANONICAL_CONTEXT.md §4 (C1–C7)
- Change confirmed requirements without user approval
- Silently resolve conflicts between sources
- Write external tool output back into CANONICAL_CONTEXT.md without approval
