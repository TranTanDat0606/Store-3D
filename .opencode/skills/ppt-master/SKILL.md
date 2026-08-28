---
name: ppt-master
description: Use when generating presentations, slide decks, or visual explanations from project context — produces structured notes for Gamma, enforces slide contract, prevents hallucination
---

# PPT Master Workflow

## Overview

A workflow for generating presentation content from project context. Produces structured slide notes that the user pastes into Gamma for visual rendering. The AI never interfaces with Gamma directly — it produces the content specification.

This skill reads from `.ai/CANONICAL_CONTEXT.md` (source of truth) and follows `docs/ppt/PPT_MASTER.md` (presentation specification).

## When to Use

Use this skill when the request involves:

- Creating a presentation or slide deck
- Generating slide notes from project context
- Preparing content for Gamma
- Creating visual explanations of architecture or features
- Coursework presentations, project showcases, technical deep-dives, progress updates

Do NOT use for:

- Website UI changes (use design-first-development)
- Code implementation (use normal workflow)
- Research only (use research tools directly)

## CONTEXT FIRST — Mandatory Pre-Workflow

Before starting ANY presentation task, the agent MUST:

### Step 1: Read Source of Truth
1. Read `.ai/CANONICAL_CONTEXT.md`
2. Read `.ai/CURRENT_STATE.md`
3. Read `docs/ppt/PPT_MASTER.md`

### Step 2: Identify Relevant Context
From CANONICAL_CONTEXT.md, extract:
- **Requirements** (§3) — what the project does
- **Design Direction** (§6) — visual tokens for slides
- **Architecture** (§7) — system structure for diagrams
- **Technical Context** (§8) — tech stack for code slides
- **Decisions** (§12) — confirmed choices for rationale slides

### Step 3: Determine Deck Type
Ask the user which deck type (or determine from context):
- Coursework (12-16 slides)
- Showcase (14-20 slides)
- Technical (12-18 slides)
- Progress (8-12 slides)

## Workflow

### Phase 1 — Understand

Clarify the presentation goal:
- What is the single key message?
- Who is the audience?
- What deck type?
- How many slides?
- Any specific sections to emphasize?

### Phase 2 — Outline

Create slide-by-slide outline:
1. Select deck type from PPT_MASTER.md §1
2. List all slides with titles
3. Identify which slides need diagrams, code, screenshots
4. Present outline for user approval

### Phase 3 — Write Slides

For each slide, follow the slide contract (PPT_MASTER.md §2):

```markdown
## Slide N: [Title]
- **Purpose:** [Why this slide exists]
- **Key message:** [One sentence]
- **Visual type:** [Content | Diagram | Code | Screenshot | Chart]
- **Content density:** [Low | Medium | High]

### Content
- [Bullet point 1 — backed by evidence]
- [Bullet point 2 — backed by evidence]

### Evidence
- [Source: file path, documentation, or research finding]

### Speaker notes (optional)
- [What to say while showing this slide]
```

**Slide writing rules:**
- Max 5 bullet points per slide
- Max 20 words per bullet
- One key message per slide
- visuals > text when possible
- Use diagrams for architecture/flow
- Use tables for comparisons
- Use code blocks for technical content
- All text in Vietnamese
- Technical terms preserved in English where natural

### Phase 4 — Review

Present complete slide deck to user for review:
1. Check each slide against contract
2. Verify no invented facts
3. Verify Vietnamese text
4. Verify evidence sourcing
5. Present for user approval

### Phase 5 — Gamma Instructions

After user approves, provide:

1. **Complete notes** — all slides in the format from Phase 3
2. **Gamma instructions** — how to paste into Gamma:
   - Open gamma.app
   - Create new presentation
   - Choose "Generate from notes" or paste notes
   - Select appropriate template/theme
   - Review rendered slides
   - Export as PPTX

3. **Visual QA checklist** — from PPT_MASTER.md §6

## Gamma Safety Rules

The agent MUST enforce these rules:

### MUST NOT
- Invent product facts, metrics, or user numbers
- Change important numbers (prices, stock, ratings)
- Add unsupported claims or case studies
- Replace technical terminology incorrectly
- Change project scope or requirements
- Create fake testimonials
- Replace Vietnamese text with English

### MUST
- Mark unavailable information as `TBD / CẦN DỮ LIỆU`
- Source every claim from CANONICAL_CONTEXT.md or research
- Preserve technical terminology exactly
- Maintain Vietnamese language throughout
- Keep slide count within deck type range

### Source of Truth Hierarchy
```text
CANONICAL_CONTEXT.md    ← highest authority
PPT MASTER notes        ← presentation interpretation
Gamma output            ← visual rendering (lowest authority)
```

If Gamma output contradicts CANONICAL_CONTEXT.md → report to user, CANONICAL_CONTEXT.md wins.

## Quality Checklist

Before delivering notes, verify:

### Content
- [ ] Every slide has Purpose, Key message, Visual type
- [ ] No unsupported claims or invented metrics
- [ ] All TBD items identified
- [ ] Vietnamese text preserved
- [ ] Technical terminology accurate
- [ ] Evidence/sources cited

### Structure
- [ ] Slide count matches deck type range
- [ ] Correct sections for deck type
- [ ] Logical flow between slides
- [ ] One key message per slide
- [ ] Content density within limits

### Visual
- [ ] Diagrams described clearly enough for Gamma
- [ ] Code blocks properly formatted
- [ ] Screenshots described with specific UI elements
- [ ] Charts described with data points

## Example: Coursework Deck

```markdown
## Slide 1: Cover
- **Purpose:** Introduce the project
- **Key message:** Store3D is a 3D-printed model e-commerce platform
- **Visual type:** Title
- **Content density:** Low

### Content
- Store3D — Nền tảng thương mại điện tử mô hình in 3D
- FPT Polytechnic — Đồ án tốt nghiệp
- [Tên sinh viên] — [Mã số]
- Giảng viên: [Tên giảng viên]

## Slide 2: Problem Context
- **Purpose:** Explain why this project exists
- **Key message:** Thị trường mô hình in 3D Việt Nam thiếu nền tảng chuyên biệt
- **Visual type:** Content
- **Content density:** Medium

### Content
- Thị trường mô hình in 3D đang phát triển mạnh tại Việt Nam
- Khách hàng cần trải nghiệm "digital showroom" cao cấp
- Hiện tại không có nền tảng专注 cho mô hình in 3D
- Store3D giải quyết: duyệt, đặt hàng, thanh toán QR, đánh giá

### Evidence
- CANONICAL_CONTEXT.md §2 OBJECTIVE
- CANONICAL_CONTEXT.md §3 REQUIREMENTS
```

## Safety

This skill must never:
- Modify source code
- Modify CANONICAL_CONTEXT.md
- Invent project facts
- Replace user judgment on project direction
- Skip user approval for substantial presentations
- Claim Gamma output is correct without Visual QA
