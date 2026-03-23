# HTML5 Studio

A free, self-hosted animation studio for HTML5 display ads. Design keyframe animations in a timeline editor, manage every ad size as a scene in one project, then export production-ready ZIP packages for GDN, DV360, The Trade Desk, or any HTML5-compatible ad server.

Exports are self-contained: a single ZIP per size, zero runtime dependencies, with platform-specific click tags and ad spec validation baked in. It won't let you ship a 180KB creative to a network with a 150KB limit.

No accounts, no subscriptions, no cloud dependencies. Runs locally in Docker or as a dev server.

---

## Quick Start

### Docker (recommended)

```bash
docker compose up --build
```

Open [http://localhost:3001](http://localhost:3001). Projects are persisted in a Docker volume.

### Local Development

```bash
pnpm install
cd server && npm install && cd ..

# Terminal 1 — frontend
pnpm dev

# Terminal 2 — backend
pnpm dev:server
```

Open [http://localhost:5173](http://localhost:5173). See [SETUP.md](SETUP.md) for more detail.

---

## Features

- **Multi-scene timeline editor** — manage an entire ad set (e.g. 300x250, 728x90, 160x600) as separate scenes in a single project
- **Keyframe animation** — position, scale, rotate, fade, with full easing support (power, sine, expo, elastic, back, bounce)
- **Layer system** — color, gradient, text, image, and group layers with blend modes, opacity, locking, and visibility toggles
- **Per-layer loop windows** — sub-timeline loops (e.g. intro plays once, CTA pulses indefinitely)
- **SVG / AI import** — parse vector files into editable layers
- **HTML5 export** — generates a self-contained `index.html` + `script.js` + `styles.css` + bundled assets; zero runtime dependencies
- **Batch export** — export all scenes to individual ZIPs inside a single master archive
- **Platform targets** — GDN, DV360/Enabler, The Trade Desk, Generic
- **Ad spec validation** — pre-export checks for file size, file count, duration, and external requests against IAB/platform specs
- **Project persistence** — save/load projects to the local filesystem (no cloud required)
- **Undo / redo** — full history stack
- **16 built-in IAB templates** — all standard display, mobile, and interstitial sizes
- **Custom templates** — save any scene as a reusable template
- **Dark / light theme**
- **Keyboard shortcuts** — see [below](#keyboard-shortcuts)

---

## Export Targets

| Target | ID | Notes |
|---|---|---|
| Generic HTML5 | `generic` | No platform dependencies. IAB 150 KB limit. |
| Google Display Network | `gdn` | Self-contained (no external requests). 40-file max. 30s loop limit. 150 KB. |
| DV360 / Enabler | `dv360` | Includes `Enabler.js` script tag. `clickTag` via `Enabler.getUrl()`. 200 KB. |
| The Trade Desk | `ttd` | Uses `clickTAG` (capital TAG) variable convention. 150 KB. |

Every export runs pre-flight ad spec validation and surfaces warnings in the progress modal before the ZIP is saved.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Canvas rendering | Konva 9 + react-konva |
| Animation engine (preview) | GSAP 3 |
| Styling | Tailwind CSS 3 + shadcn/ui + Radix UI |
| Backend | Express.js (local filesystem storage) |
| SVG parsing | SVG.js 3 |
| ZIP generation | JSZip 3 |
| Build | Vite 6 + TypeScript 5 |

---

## Demo Project

The app opens with a pre-built **Meridian Bank** ad suite demonstrating all five common GDN sizes:

| Scene | Size | Description |
|---|---|---|
| 300x250 — Medium Rectangle | 300x250 | Full layout: logo, tagline, offer, CTA |
| 728x90 — Leaderboard | 728x90 | Horizontal split: logo / tagline / CTA |
| 160x600 — Wide Skyscraper | 160x600 | Vertical: logo, big offer number, CTA |
| 300x600 — Half Page | 300x600 | Three feature cards with staggered entrance |
| 320x50 — Mobile Banner | 320x50 | Compact: logo + CTA side by side |

To swap in your own demo project, edit `src/data/demoProject.ts`.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause |
| `Ctrl+Shift+Left` | Previous frame |
| `Ctrl+Shift+Right` | Next frame |
| `Ctrl+Alt+Left` | Go to start |
| `Ctrl+Alt+Right` | Go to end |
| `V` | Toggle layer visibility |
| `L` | Toggle layer loop |
| `A` | Add keyframe at current frame |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save project |
| `Ctrl+D` | Duplicate layer |
| `Ctrl+C` | Copy layer |
| `Ctrl+V` | Paste layer (current scene) |
| `Ctrl+Shift+V` | Paste layer to all scenes |

> macOS: substitute `Ctrl` with `Cmd`.

---

## Project Structure

```
src/
├── api/                  # Local API client
├── components/           # React UI components
├── data/
│   └── demoProject.ts    # Built-in Meridian Bank demo ad suite
├── hooks/                # Feature hooks (export, layers, scenes, timeline, etc.)
├── templates/            # 16 built-in IAB ad size JSON templates
├── types/                # Shared TypeScript types
└── utils/
    ├── animation.ts          # Keyframe interpolation engine (live preview)
    ├── exportHTML5.ts        # HTML5 package generator + ad spec validation
    ├── fileOperations.ts     # Template loading, SVG parsing
    └── layerManagement.ts    # Layer creation helpers
server/
├── index.js              # Express API + static file server
└── db.js                 # Filesystem-based project storage
```

---

## Data Storage

Projects are stored as directories on the local filesystem:

```
data/projects/{uuid}/
├── project.json          # Project metadata + animation data
└── assets/               # Uploaded image assets
```

To back up your projects, copy the `data/` directory. In Docker, this is persisted via a named volume.

---

## License

MIT
