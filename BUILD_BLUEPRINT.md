# Build Blueprint

> Living doc — update every session. Part of [[PRODUCT]] | Judge lens: [[JUDGES_MINDSET]] | MVP scope: [[MVP]]

---

## Critical Constraints (read first)

- **Build window: 5–6 hours actual coding time** — not 16. Scope accordingly.
- **Format: B — standalone web app with sidebar UI layout.** Looks and feels like a browser extension sidebar sitting alongside a presentation tool. NOT a real Chrome extension, NOT a platform add-on. During pitch: "designed for extension integration — here's the experience."
- **UI layout:** Mock Google Slides canvas on left (static/fake) · PixelMuse Present sidebar panel on right (fully functional). Judge sees it and immediately understands the use case.

---

## The Product (locked)

**PixelMuse Present** — turns PixelMuse's AI image generator into a presentation visual tool for middle/early high school students. Project-based workspaces pull them back for every new deck. A unified prompt quality score — spanning both Professional and Personal mode — builds AI literacy that compounds from first discovery through professional life, like Typing Club did for typing.

**One-sentence pitch:** Whether a student is making a meme on Tuesday or a bio presentation on Friday, every prompt builds the same AI literacy skill — and the score proves it.

**Copyright framing (never say "copyright-safe"):** "Students currently pull random copyrighted images for school presentations. We replace that with original generations — meaningfully safer for school submissions, not a legal guarantee."

**Day 7 answer:** Student opens PixelMuse Present on a random Tuesday in Personal mode to make something fun, prompt score goes up, that skill carries into their next class deck Friday.

---

## Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Target user | Middle/early high school students discovering ethical AI use via teacher recommendation | Typing Club analogy — early adoption → lifelong skill |
| Go-to-market | B2C, teacher-recommended not mandated | Teachers already recommend ethical AI — same pattern |
| Mode structure | Professional + Personal, **unified prompt score across both** | One skill loop, not two products. Casual use Tuesday → better deck Friday |
| Core retention mechanic 1 | Project-based workspaces with persistent saved assets | Active projects = reason to return when next deck starts |
| Core retention mechanic 2 | **Prompt quality score** (0–100, tracked over sessions) | Visible skill progression = Duolingo pull loop |
| Scorer implementation | Claude API → structured JSON output | Accurate, fast, impressive, buildable in 2hrs |
| Image generation | Puter.js (browser-side, no backend API key needed) | Recommended in hackathon prompt, zero infra |
| Frontend stack | Next.js + React + Tailwind CSS | Claude scaffolds this fast, strong component model |
| Persistence | localStorage first → Supabase if time allows | localStorage = no backend setup time burned |
| Success metric | Sessions/user: 1.8 → 5 within 14 days | Directly maps to brief's retention ask |
| Modes | Professional + Casual | Broadens use — school decks AND friend group slides |

---

## Prompt Quality Scorer (key differentiator)

**How it works:**
1. User types prompt in Generate tab
2. On generate click → simultaneously call Claude API with scorer system prompt
3. Claude returns JSON:

```json
{
  "specificity": 72,
  "style": 45,
  "context": 80,
  "overall": 66,
  "tip": "Add a color palette and visual style — e.g. 'minimalist blue' — to push your score to 80+"
}
```

4. Show score breakdown + coaching tip alongside generated image
5. Store score in localStorage per session
6. Dashboard shows score trajectory: "Session 1 avg: 42 → Session 4 avg: 71"

**Scorer system prompt (use this exactly):**
```
You score AI image prompts for a student presentation tool.
Score 0-100 on three axes:
- Specificity: how precise and detailed is the prompt
- Style direction: does it include visual style, color, or tone
- Context clarity: is it tied to a clear presentation purpose

Return valid JSON only, no extra text:
{
  "specificity": <number>,
  "style": <number>,
  "context": <number>,
  "overall": <number>,
  "tip": "<one sentence coaching tip>"
}
```

**Why judges love this:** "We use Claude to build AI literacy in real-time" — differentiating, defensible, and directly addresses skill-building retention loop.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js + React + Tailwind | Claude scaffolds fast |
| Image generation | Puter.js via CDN script | `<script src="https://js.puter.com/v2/">` |
| Prompt scoring | Anthropic Claude API | Need API key from console.anthropic.com |
| Persistence | localStorage (MVP) → Supabase (if time) | Avoid backend setup time sink |
| Auth | Fake sign-in or none | Hackathon — skip real auth |

**API key setup:** console.anthropic.com → Billing → API Keys → Create Key

---

## Screens to Build (priority order)

### 1. Dashboard (home, proves continuity)
- Active projects list with cards: title, mode, last edited, asset count, next suggested action
- Score trajectory widget: "Your avg prompt score: 42 → 71"
- "New Project" button
- "Recommended next steps" panel

### 2. New Project Modal
- Fields: title, category (School/Club/Internship/Casual), platform (Slides/PowerPoint), mode (Professional/Casual), style (Minimal/Corporate/Academic/Fun/Meme)
- On submit → create project → land in Project Workspace

### 3. Project Workspace (most important screen)
- Header: title, category, mode, platform, last updated
- Tabs: Generate | Saved Assets | Project Brief | Export
- **Generate tab:**
  - Mode toggle (Professional / Casual)
  - Prompt textarea + suggestion chips
  - "Generate with PixelMuse" button
  - Calls Puter.js txt2img + Claude scorer simultaneously
  - Shows: generated image + score breakdown (specificity/style/context) + tip
  - "Save to Project" button
- **Saved Assets tab:** grid of saved images, reuse style button
- Progress tracker: Cover ✓ | Diagram ⬜ | Section Divider ⬜ | Extras ⬜

### 4. Public Project Page (shareable link)
- Read-only, no auth required to view
- URL: `/project/[id]` — publicly accessible
- Shows: project name, image grid, prompt score badge ("AI Literacy: 74/100"), mode tag
- CTA at bottom: "Start your own project →"
- This is what gets shared — not a PNG, not a watermarked image, the whole project

### 5. Export (simulation only)
- Download PNG assets
- "Send to Google Slides" → fake success toast
- "Export to PowerPoint" → fake success toast
- "Share Project Link" → copies `/project/[id]` URL to clipboard

---

## Retention Mechanics (must be visible in demo)

| Mechanic | Where it shows | Why it pulls |
|----------|---------------|-------------|
| Active project continuity | Dashboard | Unfinished project = reason to return |
| Prompt quality score (unified) | Generate tab + Dashboard | Score goes up across both modes = Duolingo pull |
| Score trajectory | Dashboard widget | Visible skill progression over sessions |
| Coaching tip | After each generation | Personalized, actionable, not canned |
| "Next step" suggestions | Dashboard + Workspace | Clear action removes friction |
| Saved assets / style reuse | Saved Assets tab | Work compounds across sessions |
| **Public project share link** | Export tab + project page | Sharer returns to complete project before sharing. Recipient converts via CTA. Fixes broken 34% share loop. |

---

## Data Model (localStorage shape)

```js
// projects[]
{
  id, title, category, platform, mode, style,
  createdAt, updatedAt, progressStatus
}

// assets[]  
{
  id, projectId, url, prompt, mode, createdAt,
  promptScore: { specificity, style, context, overall, tip }
}

// sessions[]
{
  id, date, avgPromptScore, assetsGenerated
}
```

---

## Build Order

| Phase | What to build |
|-------|--------------|
| 1 | Next.js + Tailwind setup. Sidebar layout shell: fake slides canvas left, PixelMuse Present panel right. Pre-seed localStorage demo data. |
| 2 | Dashboard: project cards, score trajectory widget, next-step suggestions panel, "New Project" button. |
| 3 | New Project modal: title, category, platform, mode, style. Creates project → lands in workspace. |
| 4 | Project Workspace: prompt input, suggestion chips, mode toggle, Puter.js generation, image display. |
| 5 | Claude API scorer: fires on generate, JSON parsed, score breakdown + tip shown below image. |
| 6 | Save to project + Saved Assets tab + progress tracker + style reuse button. |
| 7 | Public project page `/project/[id]`: read-only, image grid, AI Literacy score badge, "Start your own" CTA. |
| 8 | Export tab: Download PNG, fake Slides/PowerPoint toasts, "Share Project Link" copies URL. |
| 9 | Polish, seed demo data, test full loop end to end. |

---

## Demo Data (must be pre-seeded before presentation)

> This is a build task. Hardcode a fake returning-user state so judges land in the middle of a session, not at sign-up.

**Seed this data in localStorage or mock JSON before demo:**

```js
// Pre-seeded project
{
  id: "demo-1",
  title: "Biology Final Presentation",
  category: "School",
  platform: "Google Slides",
  mode: "Professional",
  style: "Academic",
  createdAt: "2026-04-14",
  updatedAt: "2026-04-17",
  progressStatus: { cover: true, diagram: false, divider: false, extras: false }
}

// Pre-seeded assets (use placeholder images)
[
  { id: "a1", projectId: "demo-1", prompt: "Clean minimalist cell division diagram, blue and white, academic style", mode: "Professional", promptScore: { specificity: 78, style: 71, context: 85, overall: 78, tip: "Try adding a color temperature directive to push above 85." }, createdAt: "2026-04-14" },
  { id: "a2", projectId: "demo-1", prompt: "Title slide background, biology theme, minimal", mode: "Professional", promptScore: { specificity: 55, style: 40, context: 72, overall: 56, tip: "Add a visual style and palette — e.g. 'muted teal, flat design' — to improve specificity." }, createdAt: "2026-04-14" }
]

// Pre-seeded score trajectory
[
  { session: 1, date: "2026-04-14", avgScore: 42 },
  { session: 2, date: "2026-04-15", avgScore: 58 },
  { session: 3, date: "2026-04-17", avgScore: 67 }
]

// Second project (shows multi-project use)
{
  id: "demo-2",
  title: "Group Chat Birthday Meme Pack",
  category: "Casual",
  platform: null,
  mode: "Personal",
  style: "Fun",
  createdAt: "2026-04-16",
  updatedAt: "2026-04-16"
}
```

**What judge sees on load:**
- Dashboard with 2 active projects, score trajectory widget showing 42 → 67
- "Biology Final" card: "Next: create a diagram — 1/4 visuals done"
- "Birthday Meme Pack" card: casual mode, 3 assets saved

**This is built in Phase 5 (hour 8–10). Do not skip.**

---

## Demo Script (second-visit scenario — build to this)

1. Open dashboard → show active project "Biology Final" with score trajectory widget
2. Click into project → show previously saved assets + progress tracker
3. Write a new prompt → generate → show score breakdown + Claude tip
4. Save to project → asset added to library
5. Toggle to Casual mode → show different suggestion chips + tone
6. Hit Export → fake Google Slides success
7. Return to dashboard → show updated score, project progress, "next step" card

**One sentence answer to "why Tuesday?":** "A student opens PixelMuse Present on Tuesday because their prompt score is at 68 and they want to hit 80 before their next deck."

---

## What's Still TBD (open judge challenges)

- [x] ~~What specific student sub-segment?~~ → Middle/early high school, teacher-recommended
- [x] ~~Unified vs split prompt score?~~ → Unified across Professional + Personal mode
- [x] ~~Day 7 pull mechanic?~~ → Personal mode casual use builds same score, no deck needed
- [x] ~~Framing fix~~ → **Locked.** Pitch leads with "AI literacy trainer, image generation is the vehicle." Typing Club is the FIRST analogy, not slide 4. Never describe as "image generator with a score bar."
- [x] ~~Viral share loop~~ → **Public project link sharing (locked)**. No watermark. Student shares a public read-only project page (Behance meets GitHub repo) showing image grid + prompt score badge + "Start your own" CTA. Sharer returns to fill out project before sharing (vanity pull). Recipient has one clear action. Judge answer: "We redesigned what gets shared so that sharing itself drives return behavior."
- [ ] **What's Next slide (locked):** Teacher dashboard (AI literacy metric for classrooms) + native extension integration in Google Slides, PowerPoint, and Canva — so PixelMuse Present lives inside the tools students already use, zero context switching.
- [ ] Supabase setup (post-idea-lock)
- [ ] Exact Puter.js API return shape (HTMLImageElement.src vs blob)
- [ ] Score trajectory chart library (recharts? simple CSS bars?)
- [ ] Professional vs Personal visible UI difference (color palette, chip sets, suggestion chips)

---

> Update this file each session. Lock decisions, don't re-litigate them.
