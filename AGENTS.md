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
