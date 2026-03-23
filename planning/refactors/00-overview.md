# SNSAnimate — Improvement Roadmap

The goal is a **lightweight, easy-to-use HTML5 display ad platform**. Every decision here is made through that lens: reduce friction for the ad-maker, ship clean IAB-compliant output.

---

## Priority Tiers

### Tier 1 — Critical (blockers for daily use)

| # | Plan | Why it's blocking |
|---|------|-------------------|
| 1 | [Undo / Redo](./01-undo-redo.md) | Any editor without undo loses user trust immediately. Currently there's no recovery from mistakes. |
| 2 | [Layer Copy / Paste / Duplicate](./02-copy-paste-layers.md) | Making multiple similar layers (e.g. same text style across scenes) requires manual recreation. |
| 3 | [Image Fit UI](./03-properties-polish.md) | The `fit` property exists in the type and is now exported, but there's no UI to set it. Image layers always render as `fill`. |
| 4 | [Canvas Zoom](./04-canvas-tools.md) | No way to zoom in to work on detail. Fixed scale makes small ad units (320×50) hard to edit. |
| 5 | [Keyboard Shortcut Help Overlay](./05-shortcuts-and-discovery.md) | Shortcuts are the power-user path, but they're invisible. One overlay fixes onboarding completely. |

### Tier 2 — High Impact UX

| # | Plan | Why it matters |
|---|------|----------------|
| 6 | [Snap, Guides & Alignment Tools](./04-canvas-tools.md) | Ad design requires precise positioning. Guessing pixel values is error-prone. |
| 7 | [Timeline Polish](./06-timeline-polish.md) | Keyframe copy/paste, multi-select, easing preview — the core of the animation workflow. |
| 8 | [Text Effects UI](./03-properties-polish.md) | Shadow and stroke are defined in types and exported, but the UI doesn't exist. |
| 9 | [Template System Overhaul](./07-template-system.md) | Preview images are broken, no custom dimensions, no blank-slate with size set correctly. |
| 10 | [Asset Library Panel](./08-asset-management.md) | Images are uploaded per-layer with no reuse. A project asset shelf fixes this. |

### Tier 3 — Architecture & Polish

| # | Plan | Why it matters |
|---|------|----------------|
| 11 | [App.tsx Decomposition](./09-app-architecture.md) | 81KB God component makes every feature harder to build. Split before adding more state. |
| 12 | [Export UX Improvements](./10-export-improvements.md) | Progress feedback, IAB validation UI, preview before download. |
| 13 | [Auto-save & Project Status](./05-shortcuts-and-discovery.md) | No indicator of saved/unsaved state. Users don't know if Supabase saved. |

---

## Quick Wins (< 1 day each, do these first)

These are small, isolated changes that each improve the tool noticeably:

1. **Image fit dropdown** — add a `<Select>` to `ImageLayerProperties.tsx`. The type, export logic, and canvas rendering already exist. UI is the only missing piece.
2. **Layer lock toggle** — add a lock icon to each layer row. When locked, skip pointer events on the Konva transformer. Prevents accidental moves.
3. **Duplicate layer button** — one button in PropertiesPanel, deep-clones the layer with a new UUID, appends to scene layers.
4. **Fix template preview images** — generate static 16 screenshots of the default templates at build time, or swap in a CSS-drawn aspect-ratio preview (no image needed).
5. **Shortcut help modal** — `?` key opens a simple table of all shortcuts. One component, no state changes.
6. **Auto-save indicator** — watch `hasUnsavedChanges` flag on active scene, show a dot in the SceneTabs tab. Already tracked in state, just needs UI.
7. **`Ctrl+Z / Ctrl+Y` wiring** — even before a full undo system, a shallow one-level undo for the most recent layer move is better than nothing.

---

## What We're Not Building (yet)

- **Collaboration / comments** — out of scope for v1
- **Video layer support** — adds significant complexity to export
- **Custom easing curve editor** — nice to have, do after multi-select keyframes
- **AI file (Adobe Illustrator) import** — complex; placeholder error is fine for now
- **Mask layer canvas rendering** — the type exists but it's deep feature work; defer
