---
name: design-first-development
description: Use when implementing substantial new features that require UI/visual design decisions before code implementation - prevents jumping from request directly to UI code
---

# Design-First Development

## Overview

A workflow that separates design thinking from code implementation for substantial UI/UX work. Prevents premature coding by enforcing understanding, research, user flow, information architecture, and design exploration before any implementation begins.

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

## HARD GATE — User Approval

The agent MUST NOT proceed to implementation after the design phase until the user explicitly approves the proposed design/plan.

Valid approval examples:

- "approved"
- "go ahead"
- "implement it"
- "looks good, continue"

If the user requests changes, return to the appropriate design phase. Do not interpret silence as approval. Do not implement while waiting for approval.

## Workflow

### Phase 1 — Understand

Understand the request before designing. Identify:

- User goal
- Business goal
- Target user
- Required functionality
- Constraints
- Existing related pages/components
- Required states
- Responsive requirements
- Success criteria

If requirements are ambiguous, ask focused questions before continuing.

### Phase 2 — Explore Existing Project

Before proposing UI, inspect the existing repository. Read relevant project memory files (`.ai/PROJECT.md`, `.ai/ARCHITECTURE.md`, `.ai/CURRENT_STATE.md`, `DESIGN.md` when it exists). Examine existing related pages, components, routes, state management, and design tokens.

Use GitNexus when relationships or impact analysis are important. The goal is to extend the existing system rather than invent a disconnected UI.

### Phase 3 — Research

Use the research hierarchy defined by `AGENTS.md`. Choose tools intentionally:

- **Project knowledge:** Use `.ai/`
- **Codebase relationships:** Use GitNexus
- **Library/API questions:** Use Context7
- **Current/external information:** Use web research when necessary
- **Visual/UI exploration:** Use Stitch

Do not call every tool automatically. Use only the tools that materially improve the result.

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

Define what information belongs on the page and how it is prioritized. Determine:

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

Before calling Stitch, establish a design direction. Define:

- Visual hierarchy
- Layout structure
- Typography
- Color usage
- Spacing
- Components
- Interaction patterns
- Motion/animation
- Responsive behavior

Reuse the existing project design system whenever appropriate. Do not invent a new visual language unless the user explicitly requests a redesign.

### Phase 7 — Stitch

Use Stitch for visual exploration when appropriate. Provide Stitch with structured requirements including:

- Page purpose
- Target user
- Information architecture
- User flow
- Content hierarchy
- Required sections
- Required interactions
- Required states
- Responsive requirements
- Existing design direction

When designing a page, request the COMPLETE PAGE rather than isolated components. When the feature requires multiple pages, design the COMPLETE FLOW rather than only one screen.

The design must account for: desktop, tablet (when relevant), mobile, loading, empty, error, success, disabled, validation, and hover/focus/active states where relevant.

Stitch output is a design reference, not automatically approved implementation.

### Phase 8 — Design Review

After design exploration, present a concise design proposal to the user. Include:

1. User flow
2. Page/section structure
3. Component structure
4. Interaction behavior
5. Responsive behavior
6. Important states
7. Visual direction
8. What Stitch contributed
9. Any assumptions

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

### Phase 9 — Implementation Plan

Only after approval, use Superpowers `writing-plans` when the implementation is substantial. The plan should identify:

- Files to create
- Files to modify
- Components
- State changes
- API changes if needed
- Data changes if needed
- Testing requirements
- Verification steps

Use GitNexus impact analysis before modifying important shared code.

### Phase 10 — Implement

Use Superpowers `executing-plans` when appropriate. Follow the existing project's architecture, coding conventions, design system, state management, and API patterns. Do not perform unrelated refactoring. Do not replace working architecture merely to match the visual design.

### Phase 11 — Verify

After implementation, run appropriate verification. Prefer:

- Build
- Lint
- Existing tests
- Playwright browser verification
- Responsive verification
- Visual screenshots when useful

For UI work, verify the actual browser result rather than trusting source code alone. Check: layout, typography, spacing, responsive behavior, navigation, interactions, loading/error/empty states, accessibility basics, console errors. Fix issues and verify again.

### Phase 12 — Update Memory

After a material UI/UX change, update relevant project memory. At minimum, update `.ai/CURRENT_STATE.md`. Update other memory files only when the architecture, design system, or important project decisions changed. Record important design decisions in `.ai/DECISIONS.md` if that file exists.

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

## Output Behavior

During the design phase, communicate decisions clearly and concisely. Do not dump unnecessary implementation details before approval.

Before approval:

```text
Understand
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
Plan
→ Implement
→ Verify
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
