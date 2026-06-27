# PathFinder Ghana — Frontend Design Plan

## Overview

Career guidance tool for Ghanaian students aged 13–22, their parents, and teachers. Serious enough to be trusted, warm enough not to be intimidating.

**Stack:** React (functional components + hooks), Vite, Tailwind CSS v4, axios, react-router-dom, react-markdown.

**Backend (later):** Node + Express + MongoDB + Flowise — not in scope for this phase.

---

## Design Tokens

All colours, spacing, typography, and radii live in `src/styles/tokens.css`. **No hardcoded hex values anywhere else.** Use `color-mix()` with token variables for opacity variants (e.g. hero subtext, stat pill borders).

---

## Typography

| Role | Font | Usage |
|------|------|-------|
| Display | Playfair Display | Hero headline, section titles |
| Body / UI | Inter | Chat, labels, body copy |
| Labels | Inter Medium (500) | Buttons, nav, badges |

---

## Motion Rules — Only 3 Animations

1. **Message slide-in** — new chat messages slide up 12px, opacity 0→1, 200ms
2. **Roadmap line draw** — vertical connector draws downward when a stage activates, 600ms
3. **Send button spinner** — CSS border spin while loading, 600ms linear infinite

**No other motion.** No page-load fade, no hover floats, no bouncing, no typing-dot pulse.

---

## Pages

### 1. Landing Page (`/`)

| Section | Background | Key elements |
|---------|------------|--------------|
| Navbar | `--navy`, 64px sticky | Logo, ghost links, gold outlined CTA |
| Hero | `--navy` + radial `--navy-mid` | Eyebrow, Playfair H1, subtext, gold CTA, stat pills |
| How It Works | `--off-white` | 3 white cards with numbered gold circles |
| Career Categories | `--white` | 2×2 grid of navy cards, gold top border |
| Footer | `--navy` | Brand line |

### 2. Chat Page (`/chat`)

Split layout: **55% chat** (white) | **45% roadmap** (`--navy`).

**Chat bubbles:**
- User: `--gold-faint` bg, `--gold` border, `--radius-lg` with bottom-right flat (`--radius-sm`), right-aligned, max 75%
- Agent: `--off-white` bg, `--border` border, bottom-left flat, left-aligned, max 80%, navy "P" avatar, react-markdown

**Roadmap:**
- 5 stages: JHS → BECE → SHS → WASSCE → University
- Locked = muted; active = `--gold-light` left border + summary text
- Animated line between stages on activation

### 3. Not Found (`*`)

Simple 404 with link back home.

---

## Folder Structure

```
src/
├── assets/logo.svg
├── components/
│   ├── layout/   Navbar, Footer
│   ├── chat/     ChatWindow, ChatBubble, ChatInput
│   ├── roadmap/  RoadmapPanel, RoadmapStage, RoadmapLine
│   └── ui/       Button, Badge, Spinner
├── pages/        LandingPage, ChatPage, NotFound
├── hooks/        useChat, useRoadmap
├── services/     api.js
└── styles/       tokens.css, global.css
```

---

## API Contract (frontend expects)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/session/create` | Returns `{ sessionId }` on ChatPage mount |
| POST | `/api/chat/message` | Body: `{ sessionId, message }` → `{ reply, roadmapUpdate }` |
| GET | `/api/session/:sessionId/history` | Returns message array on refresh |

`sessionId` persisted in `localStorage`.

---

## Implementation Order

1. ✅ Tokens + global styles + Tailwind setup
2. ✅ UI primitives (Button, Badge, Spinner)
3. ✅ Layout (Navbar, Footer)
4. ✅ Landing page sections
5. ✅ Chat + roadmap components
6. ✅ Hooks + axios service
7. ⏳ Backend (Express + MongoDB + Flowise) — next phase
