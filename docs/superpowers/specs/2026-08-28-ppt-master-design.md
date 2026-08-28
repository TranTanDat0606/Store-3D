# PPT Master Design Spec

> Presentation/output layer for the Store3D AI development pipeline.
> Last updated: 2026-08-28

---

## 1. Purpose

PPT Master is the presentation/output layer that sits alongside the existing software development workflow. It does NOT replace the RESEARCH → CANONICAL_CONTEXT → DESIGN → PLAN → BUILD → VERIFY pipeline — it coexists as a parallel output path.

```text
EXISTING (software):
RESEARCH → CANONICAL_CONTEXT → DESIGN → PLAN → BUILD → VERIFY

NEW (presentations):
RESEARCH → CANONICAL_CONTEXT → PPT MASTER → Gamma → PPTX → Visual QA
```

The PPT Master reads from CANONICAL_CONTEXT.md (source of truth) and generates structured slide notes that the user pastes into Gamma. Gamma renders the visual presentation. The AI never touches Gamma directly — it produces the content specification.

---

## 2. Scope

### In Scope
- Slide structure definitions for 4 deck types
- Slide-level content contract (what each slide must contain)
- Visual design system (typography, colors, layout, density)
- Gamma integration workflow (manual paste, safety rules)
- Visual QA checklist
- NotebookLM integration (manual export)

### Out of Scope
- Automated Gamma API integration (Gamma is external, manual workflow)
- PPTX template creation (Gamma handles rendering)
- Animation/transition scripting (Gamma handles this)
- Font embedding (user ensures Be Vietnam Pro is installed)

---

## 3. Deck Types

### 3.1 Coursework Deck

**Purpose:** Course assignments, lab reports, project updates for FPT Polytechnic.
**Audience:** Instructors.
**Slide count:** 12-16 slides.

| # | Slide | Content |
|---|-------|---------|
| 1 | Cover | Title, author, course, date |
| 2 | Context / Problem | What problem does this solve? |
| 3 | Research Findings | Literature review, existing solutions |
| 4 | Proposed Solution | Architecture, approach |
| 5 | Implementation | Key code, design decisions |
| 6 | Demo / Screenshots | Visual walkthrough |
| 7 | Results | Verification, testing outcomes |
| 8 | Challenges / Lessons | What went wrong, what was learned |
| 9 | Conclusion | Summary, future work |
| 10 | References | Sources cited |

### 3.2 Project Showcase Deck

**Purpose:** Presenting Store3D to stakeholders, demo days, portfolio.
**Audience:** Instructors + Employers.
**Slide count:** 14-20 slides.

| # | Slide | Content |
|---|-------|---------|
| 1 | Cover | Product name, tagline, author |
| 2 | Table of Contents | Section overview |
| 3 | Problem Context | Market problem, opportunity |
| 4 | Target Users | Customer personas, admin needs |
| 5 | Research | Market analysis, competitor review |
| 6 | Solution Overview | Product vision, key features |
| 7 | Architecture | System design, tech stack |
| 8 | Design System | Visual identity, tokens |
| 9 | Key Feature 1 | Deep dive with demo |
| 10 | Key Feature 2 | Deep dive with demo |
| 11 | Key Feature 3 | Deep dive with demo |
| 12 | Implementation | Code highlights, decisions |
| 13 | Results | Metrics, verification, user feedback |
| 14 | Deployment | Vercel + Render, CI/CD |
| 15 | Conclusion | Summary, next steps |
| 16 | Q&A | Questions |

### 3.3 Technical Explanation Deck

**Purpose:** Deep-dive into architecture, system design, or a specific technical topic.
**Audience:** Instructors + Employers (technical).
**Slide count:** 12-18 slides.

| # | Slide | Content |
|---|-------|---------|
| 1 | Cover | Technical topic, author |
| 2 | Table of Contents | Section overview |
| 3 | Problem Statement | Technical challenge |
| 4 | Current State | What exists today |
| 5 | Research | Technical research, library evaluation |
| 6 | Architecture | System diagram, component relationships |
| 7 | Data Flow | How data moves through the system |
| 8 | Implementation Detail 1 | Code walkthrough |
| 9 | Implementation Detail 2 | Code walkthrough |
| 10 | Trade-offs | Why this approach vs alternatives |
| 11 | Results | Performance, verification |
| 12 | Conclusion | Summary, recommendations |
| 13 | Q&A | Questions |

### 3.4 Progress Update Deck

**Purpose:** Sprint review, progress report, milestone update.
**Audience:** Instructors (advisor meetings).
**Slide count:** 8-12 slides.

| # | Slide | Content |
|---|-------|---------|
| 1 | Cover | Project name, sprint/milestone, date |
| 2 | Summary | What was accomplished |
| 3 | Completed Work | Features finished, demos |
| 4 | In Progress | What's being worked on |
| 5 | Blockers | Issues, risks, dependencies |
| 6 | Timeline | Gantt or progress bar |
| 7 | Next Steps | Planned work for next period |
| 8 | Questions / Discussion | Open items |

---

## 4. Slide-Level Contract

Every slide must define:

```text
Purpose       — Why does this slide exist? What single point does it make?
Audience      — Who is this for? (instructor, employer, technical reviewer)
Key message   — One sentence: "After this slide, the audience will know _____"
Evidence      — Data, code, screenshots, diagrams that support the message
Visual type   — Title, content, comparison, diagram, code, screenshot, chart
Content density — Low (1-2 points), Medium (3-4 points), High (5+ points, use sparingly)
Speaker notes — Optional: what to say while showing this slide
```

### Content Density Rules

| Density | Bullets | Words/bullet | Use when |
|---------|---------|-------------|----------|
| Low | 1-2 | 10-15 | Key takeaway, quote, single metric |
| Medium | 3-4 | 12-18 | Standard explanation, feature list |
| High | 5+ | 15-20 | Detailed comparison, checklist (rare) |

### Visual Type Taxonomy

| Type | When to use | Example |
|------|-------------|---------|
| Title | Section divider | "Architecture" |
| Content | Standard bullet slide | Feature list |
| Comparison | Before/after, A vs B | Tech stack comparison |
| Diagram | System architecture, flow | Monorepo structure |
| Code | Show key implementation | usePurchasePanel hook |
| Screenshot | Visual walkthrough | Product detail page |
| Chart | Data visualization | Revenue by month |
| Quote | User feedback, principle | Design philosophy |
| Hybrid | 2 types combined | Diagram + bullets |

---

## 5. Visual Design System

### 5.1 Typography

Extends CANONICAL_CONTEXT.md §6 (Be Vietnam Pro).

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Slide title | 36-44pt | Bold | Ocean Blue (#3b6ee8) |
| Section title | 28-32pt | Semibold | Dark (#111827) |
| Subtitle | 24-28pt | Semibold | Dark (#111827) |
| Body text | 16-18pt | Regular | Dark (#111827) |
| Bullet text | 16-18pt | Regular | Dark (#111827) |
| Caption | 12-14pt | Regular | Muted (#666666) |
| Code | 14pt | Regular | Light on dark (#e0e0e0 on #1e1e1e) |
| Highlight | 16-18pt | Bold | Ocean Blue (#3b6ee8) |

### 5.2 Colors

From CANONICAL_CONTEXT.md §6:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| background | #ffffff | #222222 | Slide background |
| foreground | #111827 | #fafafa | Body text |
| primary | #3b6ee8 | oklch 0.75 0.14 245 | Titles, CTAs, highlights |
| accent | #06b6d4 | #22d3ee | Gradients, glow, links |
| muted | #f7f7f7 | #444444 | Section backgrounds |
| destructive | #e5484d | #ef4444 | Warnings, critical items |
| card | #ffffff | #343434 | Card backgrounds |
| border | #ebebeb | rgba(255,255,255,0.1) | Dividers, card borders |

### 5.3 Layout

- Aspect ratio: 16:9 (standard presentation)
- Content area: 80% width, centered with auto margins
- Margins: 48px all sides
- Section spacing: 32px between major sections
- Grid: 2-column (comparisons), 3-column (features), 4-column (metrics)

### 5.4 Components

**Cards:**
- Border radius: 10px
- Background: card token
- Shadow: 0 2px 8px rgba(0,0,0,0.08)
- Padding: 24px

**Code blocks:**
- Background: #1e1e1e
- Border radius: 8px
- Font: JetBrains Mono, 14pt
- Line numbers: optional, muted color
- Max height: 40% slide height

**Diagrams:**
- Node fill: primary (#3b6ee8)
- Node text: white
- Edge stroke: accent (#06b6d4)
- Edge width: 2px
- Labels: body text, 14pt

**Charts:**
- Use Ocean Blue for primary data
- Use accent (#06b6d4) for secondary data
- Grid lines: muted, 1px
- Axis labels: caption size, muted color

**Images:**
- Border radius: 10px
- Max width: 60% slide width
- Centered or aligned to grid
- Caption below if needed

### 5.5 Density Guidelines

| Slide type | Target density | Max bullets |
|------------|---------------|-------------|
| Cover | Low | 0 (title + subtitle only) |
| Content | Medium | 4-5 |
| Comparison | Medium | 3-4 per side |
| Diagram | Low | Labels only |
| Code | High | 1 code block |
| Screenshot | Low | 1 image + caption |
| Chart | Low | 1 chart + title |

---

## 6. NotebookLM Integration

### Conceptual Flow

```text
Sources (web pages, PDFs, docs)
    ↓
NotebookLM (manual: upload sources, generate notes)
    ↓
Export notes (manual: copy from NotebookLM)
    ↓
Paste into AI context or CANONICAL_CONTEXT.md
    ↓
PPT MASTER reads CANONICAL_CONTEXT.md
    ↓
Generates slide notes
    ↓
User pastes into Gamma
```

### What NotebookLM Provides
- Research synthesis from multiple sources
- Key point extraction
- Q&A about source material
- Note organization

### What PPT MASTER Provides
- Slide structure (which points go on which slide)
- Visual type selection (bullets vs diagram vs code vs screenshot)
- Content density control (preventing text-heavy slides)
- Evidence linking (each point backed by source)
- Vietnamese language consistency

### Boundary
- NotebookLM = research evidence
- CANONICAL_CONTEXT.md = canonical facts
- PPT MASTER = presentation interpretation + visual design
- Gamma = visual rendering

---

## 7. Gamma Integration

### Workflow

```text
1. AI generates PPT MASTER NOTES
   (structured outline with slide-by-slide content)
        ↓
2. User opens Gamma (gamma.app)
        ↓
3. User creates new presentation from notes
   (paste AI notes or use "Generate from notes")
        ↓
4. Gamma renders visual slides
        ↓
5. User reviews + adjusts in Gamma
        ↓
6. User exports PPTX from Gamma
        ↓
7. Visual QA (per §8 checklist)
```

### AI Output Format

Each slide is a structured note block:

```markdown
## Slide N: [Title]
- **Purpose:** [Why this slide exists]
- **Key message:** [One sentence]
- **Visual type:** [Content | Diagram | Code | Screenshot | Chart]
- **Content density:** [Low | Medium | High]

### Content
- [Bullet point 1 — backed by evidence]
- [Bullet point 2 — backed by evidence]
- [Bullet point 3 — backed by evidence]

### Evidence
- [Source: file path, documentation, or research finding]

### Speaker notes (optional)
- [What to say while showing this slide]
```

### Gamma Safety Rules

Gamma MUST NOT:
- Invent product facts, metrics, or user numbers
- Change important numbers (prices, stock, ratings)
- Add unsupported claims or case studies
- Replace technical terminology incorrectly
- Change project scope or requirements
- Create fake testimonials
- Replace Vietnamese text with English

If information is unavailable, mark as:

```
TBD / CẦN DỮ LIỆU
```

rather than letting Gamma hallucinate.

### Source of Truth Hierarchy

```text
CANONICAL_CONTEXT.md    ← highest authority
PPT MASTER notes        ← presentation interpretation
Gamma output            ← visual rendering (lowest authority)
```

If Gamma output contradicts CANONICAL_CONTEXT.md → the CANONICAL_CONTEXT.md version wins.

---

## 8. Visual QA Checklist

### Content QA
- [ ] No unsupported claims or invented metrics
- [ ] No missing critical sections (per deck type)
- [ ] No contradictory information
- [ ] All TBD items identified and marked
- [ ] Vietnamese text preserved correctly
- [ ] Technical terminology accurate
- [ ] Evidence/sources cited where claimed

### Visual QA
- [ ] No text overflow or clipped content
- [ ] No tiny unreadable text (< 12pt)
- [ ] Consistent typography (Be Vietnam Pro throughout)
- [ ] Consistent spacing (no cramped slides)
- [ ] Consistent colors (Ocean Blue primary, not Gamma's default)
- [ ] Consistent alignment (grid-based)
- [ ] Good image quality (no pixelation)
- [ ] Good contrast (text readable on background)
- [ ] Code blocks properly formatted and readable
- [ ] Diagrams legible at presentation size

### Technical QA
- [ ] PPTX opens correctly in PowerPoint/Google Slides
- [ ] Slide count matches expected range (12-20)
- [ ] Images render correctly
- [ ] Fonts render correctly (Be Vietnam Pro installed or embedded)
- [ ] Links work where applicable
- [ ] Animations/transitions reasonable (not distracting)
- [ ] File size reasonable (< 50MB)

---

## 9. Reproducibility

### Committed to Git
- `docs/ppt/PPT_MASTER.md` — the comprehensive spec
- `.opencode/skills/ppt-master/SKILL.md` — the workflow skill

### Local-Only (NOT committed)
- Gamma account credentials
- NotebookLM account credentials
- Exported PPTX files (can be regenerated)
- Temporary slide drafts

### Setup Requirements
- Gamma account (free tier sufficient)
- Be Vietnam Pro font installed on local machine
- NotebookLM account (optional, for research)

---

## 10. Conflict Handling

The PPT Master follows the same conflict hierarchy as the rest of the workflow:

| Source | Authority |
|--------|-----------|
| User request | Highest — user intent overrides |
| CANONICAL_CONTEXT.md | Confirmed project requirements/decisions |
| PPT_MASTER.md | Presentation structure and rules |
| Gamma output | Visual rendering only (lowest) |

### Conflict Resolution Rules

1. **Detect the conflict** — Do not silently choose one interpretation
2. **Identify authority** — The source with higher authority wins
3. **Report to user** — If conflict affects content, STOP and ask user to resolve
4. **CANONICAL_CONTEXT.md is authority** for project facts
5. **PPT_MASTER.md is authority** for slide structure and writing rules
6. **Gamma output is NEVER authority** — it is a renderer

---

## 11. Integration with Existing Workflow

### How PPT Master connects to existing stages

| Existing Stage | PPT Master Connection |
|----------------|----------------------|
| RESEARCH | PPT Master reads research findings for slide content |
| CANONICAL_CONTEXT | PPT Master reads project facts, never invents |
| DESIGN | PPT Master uses design tokens from §6 |
| PLAN | PPT Master is a parallel output path, not a replacement |
| BUILD | PPT Master does NOT modify source code |
| VERIFY | PPT Master has its own Visual QA (§8) |

### What PPT Master does NOT do
- Does NOT replace the software development workflow
- Does NOT modify CANONICAL_CONTEXT.md (reads only)
- Does NOT modify source code
- Does NOT interface with Gamma API (manual workflow)
- Does NOT create PPTX templates (Gamma handles rendering)
- Does NOT invent project facts

---

## 12. Files to Create

### `docs/ppt/PPT_MASTER.md`

Comprehensive spec combining:
- Slide structure (§3)
- Slide-level contract (§4)
- Visual design system (§5)
- NotebookLM integration (§6)
- Gamma workflow (§7)
- Visual QA checklist (§8)
- Reproducibility rules (§9)

### `.opencode/skills/ppt-master/SKILL.md`

Thin skill file that:
- Loads PPT_MASTER.md as context
- Walks through the workflow steps
- Enforces slide contract
- Prevents Gamma from inventing facts

---

## 13. Verification

After implementation, verify:
- PPT_MASTER.md exists and is comprehensive
- Skill file exists and references PPT_MASTER.md
- No duplication between PPT_MASTER.md and existing docs
- No secrets or machine-specific paths
- CANONICAL_CONTEXT.md not modified
- Source code not modified
- Existing workflow preserved
