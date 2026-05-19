# Murdoku

A browser game that mashes Sudoku with a murder mystery. The board is a 9×9
house; the player drops suspect tiles into rooms and tries to reconstruct the
solution the level designer set.

The project is two pieces:

- **Frontend** at the repo root, pure static ES modules served from GitHub
  Pages. No build step.
- **Companion API** under `server/`, an Express + sqlite service deployed on
  Fly.io. It backs profile claims, shared puzzles, completions, and
  leaderboards. Data lives on a persistent volume so the database survives
  machine restarts.

See [`DESIGN.md`](./DESIGN.md) for the full spec, data model, and phased
build plan. Authoring rules and project conventions live in
[`CLAUDE.md`](./CLAUDE.md).

---

## Run locally

### Frontend

```bash
# Generate portrait + furniture + icon PNGs (one-off; they're committed too)
node scripts/generate-portraits.js
node scripts/generate-furniture.js
node scripts/generate-icons.js

# Serve the project root over HTTP
python3 -m http.server 8000
# → open http://127.0.0.1:8000/
```

You need a real HTTP server (not `file://`) so the ES module imports and the
`fetch('./assets/portraits/manifest.json')` call work.

### Companion API

```bash
cd server
npm install
DATABASE_PATH=./murdoku.db PORT=8080 npm run dev

# Then in another shell:
curl http://localhost:8080/healthz
```

The frontend defaults to `https://murdoku-companion.fly.dev` via the
`<meta name="murdoku-api-base">` tag in `index.html`. To point at a local API
during development, change that meta value.

## How to play / edit

- **Edit mode** is the authoring surface.
  - Tools: **Paint** (assign cells to a room), **Erase** (remove cells from
    rooms), **Doorway** (toggle decorative openings on existing walls), and
    **Solution** (drop a suspect onto a cell to record the correct
    placement).
  - Click **+ New room** to start a new room with a fresh colour.
  - Each room has an inline name and description field; the room name floats
    over its anchor cell in the grid.
  - Walls are computed automatically wherever two adjacent cells belong to
    different rooms (or where a room cell touches the outside).
- **Play mode** hides the solution and gives the player the suspect roster.
  Click a suspect, then click a cell to place them. **Check solution**
  highlights mismatched cells; a clean run pops a victory toast.
- Use **Save** to force a write to `localStorage`, **Levels** to manage
  multiple cases, and **Export / Import** to share levels as `.murdoku.json`.
- Hit **Share** on an authored level to publish it. The server validates
  against the canonical rules, returns a short code, and the modal hands
  you a `?play=<code>` URL. Anyone who opens that URL gets the puzzle
  added to their library; only the owner can re-edit, others see a
  "Clone to edit" button.

All local data lives in `localStorage` under `murdoku.levels`,
`murdoku.activeId`, `murdoku.profiles`, and `murdoku.activeProfileName`.

## Companion API endpoints

Profiles and auth (Phase 12):

- `POST /profiles { name, token }`, register or re-claim a profile
- `GET /profiles/me`, whoami (bearer-token auth)

Shared puzzles (Phase 13):

- `POST /levels`, publish an authored level. Bearer auth, server-side
  validation against the canonical rules. Returns a short code.
- `GET /levels/:code`, public fetch of a shared puzzle
- `POST /levels/:code/plays`, public, bumps the plays counter
- `PUT /levels/:code`, owner-only edit / re-publish

Completions and leaderboards (Phase 14):

- `POST /completions { code, durationMs, mistakes }`, bearer auth
- `GET /levels/:code/leaderboard`, public, top 50 by best time

Operations:

- `GET /healthz`, liveness probe
- `GET /admin`, open dashboard (profiles, puzzles, completions,
  leaderboards). Will move behind OAuth when there's something worth
  protecting.

## Portrait generator

`scripts/generate-portraits.js` writes 20 deterministic 32×32 pixel-art
portraits to `assets/portraits/` along with a `manifest.json` roster. It uses
only Node built-ins (`zlib`, `fs`), no npm install required.

Rerun any time you tweak the generator:

```bash
node scripts/generate-portraits.js
```

## Deployment

`.github/workflows/deploy.yml` runs on **every push to every branch** and
fans out to two jobs:

- The Pages job regenerates the pixel-art PNGs, uploads the repo root as a
  Pages artifact, and deploys to GitHub Pages.
- The Fly job (`deploy-api`) runs `flyctl deploy` from `server/`, using the
  `FLY_API_TOKEN` repo secret. It also ensures the data volume + a single
  app machine exist (sqlite needs one writer).

To turn Pages on once per repo:

1. In repo **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push any commit; the workflow runs and the URL is reported in the run's
   `deploy` job summary (also as the `github-pages` environment URL).

Manual deploys are available via the workflow's `workflow_dispatch` button.

### One-time Fly bootstrap

`server/fly.toml` covers app config. The app and its volume need to exist
once before the first deploy; no secrets to configure.

```
fly apps create murdoku-companion
fly volumes create murdoku_data --size 1 --region ams
```

The deploy workflow's "Ensure volume + single machine" step is idempotent,
so a fresh push to any branch will create the volume if it's missing.

## Live URLs

- Frontend (GitHub Pages): https://rubentipparach.github.io/murdoku-companion/
- API base: https://murdoku-companion.fly.dev
- Health check: https://murdoku-companion.fly.dev/healthz
- Murdoku admin dashboard: https://murdoku-companion.fly.dev/admin
- Fly app dashboard (logs, metrics, machines, volumes, secrets):
  https://fly.io/apps/murdoku-companion

## Schema notes

The `profiles` table stores `sha256(token)`, never the raw token. Tokens are
32 random bytes generated client-side and persisted in the player's
`localStorage` so they can sign back in to their profile after signing out.
With a 2^256 token space, an unsalted hash is already infeasible to attack;
if the sqlite file leaks the hashes are not directly replayable as bearer
credentials.

Shared puzzles store the full level payload as JSON under a short `code`,
keyed to the author's profile id. Completions are one row per win, indexed
by `(level_code, duration_ms)` so leaderboard queries are cheap.
