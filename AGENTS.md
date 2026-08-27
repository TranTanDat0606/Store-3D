# AGENTS.md — AI Coding Agent Instructions for Store3D

## Project Context

Store3D is a Vietnamese e-commerce platform for 3D-printed models. React 19 + Vite + Tailwind CSS frontend, Express + MongoDB backend. All UI text is Vietnamese.

**Before making any changes, read (in order of priority):**
- `.ai/CANONICAL_CONTEXT.md` — **canonical source of truth**; when conflicts arise, prefer this over all other `.ai/` docs
- `.ai/PROJECT.md` — purpose, users, features, constraints
- `.ai/ARCHITECTURE.md` — full technical architecture
- `.ai/CURRENT_STATE.md` — what's implemented, known issues, tech debt

## Required Workflow

### 1. UNDERSTAND
- Read the relevant `.ai/` files listed above
- Understand the request fully before acting
- Clarify ambiguous requirements with the user

### 2. EXPLORE
- Use `Glob` and `Grep` to find relevant files
- Read existing code to understand patterns before modifying
- Check similar features for conventions (e.g., how other controllers/services/routes are structured)

### 3. RESEARCH (when necessary)

Use the appropriate knowledge source based on what the question involves. See **Research Hierarchy** and **Research Decision Tree** below.

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
- Use Vietnamese for all user-facing strings and error messages
- Use the standard response envelope: `{ success, message, data, pagination, errors }`
- Use `asyncHandler` for async route handlers
- Use `validate` middleware with Zod schemas for input validation
- Use `AppError` for operational errors
- Do NOT refactor unrelated code

### 7. VERIFY
- Run `npm run build` in both `client/` and `server/` to check for TypeScript errors
- Run `npm run lint` in `client/` to check for lint errors
- Run `npm test` in `server/` to run existing tests
- Verify no regressions in existing functionality

### 8. UPDATE MEMORY
- Update `.ai/CURRENT_STATE.md` after material project changes (new features, completed work, new known issues)

## Research Hierarchy

### 1. Project Memory — `.ai/`

Use first to understand:
- Project purpose, users, features, constraints
- Architecture (client, server, database, API, auth, state management)
- Current state (what's implemented, known issues, tech debt)
- Existing decisions and constraints

Read `.ai/` files before substantial work. They are the source of truth for project-level knowledge.

### 2. GitNexus — Codebase Knowledge

Use GitNexus when the question involves the **existing codebase**.

Examples:
- Finding where a feature is implemented
- Understanding relationships between modules
- Tracing data flow across files
- Finding callers/callees of a function
- Performing impact analysis before modifying shared code
- Investigating bugs involving multiple files
- Understanding unfamiliar architecture

Do not use GitNexus unnecessarily for trivial isolated changes.

Before modifying important shared code, prefer `impact()` analysis.

### 3. Context7 — Library Documentation

Use Context7 when the question involves **external libraries/frameworks** and accurate documentation matters.

Examples:
- React, Vite, Tailwind CSS, React Router
- Express, Mongoose, Zod
- Framer Motion, Radix/shadcn-related libraries
- Any dependency whose current API/version matters

Prefer official/current documentation over relying on model memory.

Do NOT use Context7 merely to answer general programming questions that do not depend on a specific library API.

### 4. Web Research — External Knowledge

Use web research when information is:
- Current or time-sensitive
- Not available in project memory
- Not library documentation
- Related to external services/APIs
- Related to current best practices, compatibility, pricing, releases, or platform behavior

When researching, prefer authoritative primary sources.

Do not browse unnecessarily.

### 5. Stitch — Design/Visual Research

Use Stitch when the task involves:
- UI design exploration
- Page layouts and visual direction
- Design system exploration
- Component visual references

Do not treat Stitch as a replacement for understanding the existing Store3D architecture.

### 6. Playwright — Verification

Use Playwright when visual/browser verification is useful:
- Checking page behavior
- Testing user flows
- Verifying navigation and forms
- Checking responsive behavior
- Taking screenshots for visual QA

Playwright is a verification tool, not a replacement for unit/integration testing.

## Research Decision Tree

```
USER REQUEST
    ↓
Does it concern existing project code?
    → GitNexus
    ↓
Does it concern project-specific knowledge?
    → .ai/
    ↓
Does it concern a library/framework API?
    → Context7
    ↓
Does it require current/external information?
    → Web Research
    ↓
Does it concern visual/UI design?
    → Stitch
    ↓
Does it require browser verification?
    → Playwright
```

Multiple tools may be used when appropriate.

## Research Discipline

1. Do not research just because a tool exists.
2. Use the smallest set of tools needed.
3. Prefer primary/official sources.
4. Cross-check important technical assumptions.
5. Distinguish facts from assumptions.
6. Do not invent undocumented project behavior.
7. After research, apply the findings to the actual repository.
8. Do not replace repository inspection with generic documentation.
9. Do not replace documentation research with guesses when version-specific behavior matters.

## Code Conventions

### Server (Express)
- **Routes** → **Controllers** → **Services** → **Models** (layered)
- Validate inputs at route level with Zod schemas
- Controllers are thin: parse request, call service, return response
- Services contain all business logic
- Use `asyncHandler` wrapper on all async route handlers
- Use `successResponse()` / `errorResponse()` for standard envelope
- Use `apiFeatures()` for list/search/filter/sort/pagination
- Vietnamese error messages in Zod schemas and service errors

### Client (React)
- Lazy-load page components with `React.lazy()`
- Use Context + useReducer for state (no Redux)
- Use shadcn/ui components from `components/ui/`
- Use `cn()` utility for class merging
- Use React Hook Form + Zod for form validation
- Use Axios with `withCredentials: true` for API calls

### Database (MongoDB/Mongoose)
- Models in `server/src/models/`
- Validators in `server/src/validators/`
- Services handle all Mongoose operations
- Slug fields use Vietnamese-aware `slugify` utility

## Safety Rules

- **NEVER** modify existing files unless the task requires it
- **NEVER** refactor unrelated code while working on a feature
- **NEVER** invent requirements or architecture decisions
- **NEVER** add dependencies without user approval
- **NEVER** change environment variables or deployment configuration
- **ALWAYS** preserve existing functionality
- **ALWAYS** follow existing patterns
- **ALWAYS** verify changes before claiming completion
