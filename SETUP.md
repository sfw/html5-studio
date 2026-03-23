# HTML5 Studio — Setup Guide

## Quick Start (Docker)

```bash
docker compose up --build
```

Open [http://localhost:3001](http://localhost:3001). Projects are persisted in a Docker volume.

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- pnpm (or npm)

### 1. Install dependencies

```bash
pnpm install
cd server && npm install && cd ..
```

### 2. Start both servers

```bash
# Terminal 1 — frontend (Vite dev server with HMR)
pnpm dev

# Terminal 2 — backend (Express API + file storage)
cd server && npm start
```

The Vite dev server proxies `/api` and `/assets` to the Express server on port 3001.

Open [http://localhost:5173](http://localhost:5173).

### 3. Production build

```bash
pnpm build                  # TypeScript check + Vite production build
cd server && npm start      # Serves both the built frontend and API on port 3001
```

Set `NODE_ENV=production` so the server serves the Vite build output.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DATA_DIR` | `./data` | Directory for project data and assets |

---

## Data Storage

Projects are stored as directories on disk:

```
data/
  projects/
    {uuid}/
      project.json    # Project metadata + animation data
      assets/         # Uploaded image assets
```

To back up your work, copy the `data/` directory.
