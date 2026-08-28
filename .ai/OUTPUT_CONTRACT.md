# OUTPUT_CONTRACT — Workflow Stage Definitions

> Defines INPUT, RESPONSIBILITY, OUTPUT, and MUST NOT DO for each stage/tool in the Store3D AI development pipeline.
> Last updated: 2026-08-28

---

## Workflow Overview

```
TASK / IDEA
    ↓
RESEARCH ──────────→ findings, evidence, questions
    ↓
CANONICAL CONTEXT ─→ normalized project context (source of truth)
    ↓
DESIGN ────────────→ UI/UX design, structure, visual direction
    ↓
PLAN ──────────────→ implementation plan, affected files
    ↓
BUILD ─────────────→ implementation, code changes
    ↓
VERIFY ────────────→ pass/fail results, discovered issues
    ↓
OUTPUT ────────────→ presentation/document/visual explanation
```

---

## 1. RESEARCH

### Status
**TOOLS:** GitNexus (CURRENT), Context7 (CURRENT), Web Search (CURRENT), NotebookLM (EXTERNAL — manual export/import)

### INPUT
- Task or idea to investigate
- Research sources: `.ai/CANONICAL_CONTEXT.md`, codebase (GitNexus), library docs (Context7), web sources
- Specific questions to answer

### RESPONSIBILITY
- Gather facts from codebase, documentation, and external sources
- Trace code relationships, callers, callees, impact
- Look up library/framework API documentation
- Find current information when needed
- Distinguish facts from assumptions
- Do NOT invent undocumented behavior

### OUTPUT
- **Research findings:** Relevant facts organized by source
- **Evidence:** File paths, function names, code references, documentation citations
- **Relevant facts:** Confirmed information applicable to the task
- **Unresolved questions:** Items that need user input or further investigation

### MUST NOT DO
- Modify any files
- Implement any code changes
- Make architectural decisions (leave to CANONICAL CONTEXT stage)
- Invent requirements or constraints
- Replace repository inspection with generic documentation

---

## 2. CANONICAL CONTEXT

### Status
**SOURCE:** `.ai/CANONICAL_CONTEXT.md` (CURRENT — actively maintained)

### INPUT
- Research findings from stage 1
- Existing `.ai/CANONICAL_CONTEXT.md` content
- User-confirmed decisions and requirements
- Project history from `.ai/CURRENT_STATE.md`

### RESPONSIBILITY
- Serve as single source of truth for all project context
- Normalize research + project context into structured sections
- Preserve confirmed decisions with rationale and status
- Identify and categorize unknowns as OPEN QUESTIONS
- Maintain constraints (hard and soft) with clear labels
- Resolve conflicts by preferring newest implemented state

### OUTPUT
- Updated `.ai/CANONICAL_CONTEXT.md` with:
  - Normalized REQUIREMENTS (functional + non-functional)
  - Documented CONSTRAINTS (hard C1–C7, soft S1–S6)
  - Recorded DECISIONS (D1–D16 with rationale and status)
  - Identified OPEN QUESTIONS (Q1–Q10 with impact)
  - Architecture, design direction, verification criteria

### MUST NOT DO
- Modify application source code
- Implement features
- Make unilateral decisions without user confirmation
- Remove confirmed decisions
- Invent requirements not supported by evidence
- Override user-stated preferences

---

## 3. DESIGN

### Status
**TOOLS:** Stitch (EXTERNAL — API integration not established), AI design tools (EXTERNAL)

### INPUT
- `.ai/CANONICAL_CONTEXT.md` (§ DESIGN DIRECTION, § REQUIREMENTS, § CONSTRAINTS)
- Design-related requirements from user
- Existing design tokens (colors, typography, radius, spacing)
- Existing component patterns and conventions

### RESPONSIBILITY
- Explore UI/UX options and visual directions
- Define page structure and component hierarchy
- Specify responsive behavior (desktop, tablet, mobile)
- Define interaction patterns and states (loading, empty, error, success)
- Propose visual direction aligned with existing design system
- Present design proposal for user approval before proceeding

### OUTPUT
- **UI/UX design:** Page layouts, component arrangements
- **Page structure:** Section hierarchy, information architecture
- **Component hierarchy:** Parent-child relationships, state ownership
- **Responsive behavior:** Breakpoint-specific layouts and interactions
- **Visual direction:** Colors, typography, spacing, animations, shadows
- **Design reference files:** Screens, tokens, specifications

### MUST NOT DO
- Modify functional requirements in CANONICAL_CONTEXT.md
- Override confirmed architecture decisions (D1–D16)
- Change API contracts or data models
- Install new dependencies without approval
- Implement code changes
- Treat design output as automatically approved (requires user approval)

---

## 4. PLAN

### Status
**TOOL:** AI coding agent / OpenCode (CURRENT — native capability)

### INPUT
- `.ai/CANONICAL_CONTEXT.md` (full context)
- Approved design output from stage 3
- Existing codebase patterns (via exploration)
- Current state from `.ai/CURRENT_STATE.md`

### RESPONSIBILITY
- Break implementation into verifiable steps
- Identify all files to create or modify
- Map component dependencies and data flow
- Define verification strategy (build, lint, test, browser check)
- Estimate scope and identify risks
- Present plan for user approval before proceeding

### OUTPUT
- **Implementation plan:** Ordered list of steps
- **Files affected:** New files to create, existing files to modify
- **Dependencies:** New packages, API changes, data model changes
- **Verification strategy:** How to confirm each step works
- **Risk assessment:** Potential issues and mitigation

### MUST NOT DO
- Modify confirmed requirements from CANONICAL_CONTEXT.md
- Change architecture decisions without approval
- Implement code (planning only)
- Add dependencies without user approval
- Skip user approval for substantial plans
- Invent requirements not in CANONICAL_CONTEXT.md

---

## 5. BUILD

### Status
**TOOL:** OpenCode + configured model/router (CURRENT — native capability)

### INPUT
- `.ai/CANONICAL_CONTEXT.md` (constraints, output requirements, code conventions)
- Approved design from stage 3
- Approved plan from stage 4
- Existing codebase (for pattern matching)

### RESPONSIBILITY
- Implement code changes according to approved plan
- Follow existing code patterns exactly
- Follow OUTPUT REQUIREMENTS in CANONICAL_CONTEXT.md §11
- Respect hard constraints in CANONICAL_CONTEXT.md §4 (C1–C7)
- Preserve existing functionality
- Write tests if applicable and test infrastructure exists
- Generate implementation summary

### OUTPUT
- **Implementation:** Code changes (new files, modified files)
- **Tests:** Unit/integration tests if applicable and infrastructure exists
- **Implementation summary:** What was changed, why, how to verify

### MUST NOT DO
- Violate hard constraints (C1–C7)
- Modify unrelated code
- Refactor working architecture without approval
- Add dependencies without user approval
- Change environment variables or deployment config
- Claim completion without verification
- Modify `.ai/` context files (except CURRENT_STATE.md after completion)

---

## 6. VERIFY

### Status
**TOOLS:** Build tools (CURRENT), Playwright (CURRENT — MCP server), Manual testing (CURRENT)

### INPUT
- Implemented application (from stage 5)
- Acceptance criteria from CANONICAL_CONTEXT.md §9
- Verification requirements from CANONICAL_CONTEXT.md §10
- Browser verification needs

### RESPONSIBILITY
- Run build and type checks
- Run lint checks
- Run existing tests
- Verify responsive behavior (desktop + mobile)
- Verify dark/light mode
- Check for console errors
- Verify navigation and interactions
- Test loading, empty, error, success states
- Document discovered issues

### OUTPUT
- **Pass/fail results:** Build status, test results, lint status
- **Discovered issues:** Bugs, regressions, visual problems
- **Evidence:** Screenshots, error logs, test output
- **Final status:** PASS (all checks pass) or FAIL (issues found, needs fixes)

### MUST NOT DO
- Modify source code (report issues, don't fix)
- Skip verification steps
- Claim success without running verification
- Ignore failed checks
- Modify CANONICAL_CONTEXT.md or AGENTS.md

---

## 7. OUTPUT

### Status
**TOOL:** Gamma (EXTERNAL — no integration established)

### INPUT
- `.ai/CANONICAL_CONTEXT.md` (project context)
- Relevant workflow results (research, design, implementation)
- Presentation instructions from user
- Visual assets if applicable

### RESPONSIBILITY
- Generate presentation, document, or visual explanation
- Organize information in clear, structured format
- Use project context accurately
- Follow user-specified format and style

### OUTPUT
- **Presentation/document:** Structured visual or written output
- **Visual explanation:** Diagrams, flowcharts, architecture visuals
- **Summary:** Key points organized for audience

### MUST NOT DO
- Serve as source of truth (CANONICAL_CONTEXT.md is)
- Change confirmed project requirements
- Override architecture decisions
- Modify application code
- Invent project facts not in CANONICAL_CONTEXT.md
- Replace user judgment on project direction

---

## Integration Status Summary

| Stage | Tool | Status | Notes |
|-------|------|--------|-------|
| RESEARCH | GitNexus | **CURRENT** | MCP server, codebase knowledge |
| RESEARCH | Context7 | **CURRENT** | MCP server, library documentation |
| RESEARCH | Web Search | **CURRENT** | Built-in web search capability |
| RESEARCH | NotebookLM | **EXTERNAL** | Manual export/import, no API integration |
| CANONICAL CONTEXT | `.ai/CANONICAL_CONTEXT.md` | **CURRENT** | Actively maintained, source of truth |
| DESIGN | Stitch | **EXTERNAL** | API exists but no automated integration |
| PLAN | OpenCode | **CURRENT** | Native planning capability |
| BUILD | OpenCode | **CURRENT** | Native implementation capability |
| VERIFY | Build tools | **CURRENT** | `npm run build`, `npx tsc --noEmit` |
| VERIFY | Playwright | **CURRENT** | MCP server, browser verification |
| VERIFY | Manual testing | **CURRENT** | User-driven verification |
| OUTPUT | Gamma | **EXTERNAL** | No integration established |
