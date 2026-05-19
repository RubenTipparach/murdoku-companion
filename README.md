# Murdoku

A browser game that mashes Sudoku with a murder mystery. The board is a 9×9
house; the player drops suspect tiles into rooms and tries to reconstruct the
solution the level designer set.

See [`DESIGN.md`](./DESIGN.md) for the full spec, data model, and phased
build plan.

---

## Run locally

The whole game is static HTML + ES modules — no build step.

```bash
# Generate portrait PNGs (one-off; they're committed too)
node scripts/generate-portraits.js

# Serve the project root over HTTP
python3 -m http.server 8000
# → open http://127.0.0.1:8000/
```

You need a real HTTP server (not `file://`) so the ES module imports and the
`fetch('./assets/portraits/manifest.json')` call work.

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

All data lives in `localStorage` under `murdoku.levels` and
`murdoku.activeId`.

## Portrait generator

`scripts/generate-portraits.js` writes 20 deterministic 32×32 pixel-art
portraits to `assets/portraits/` along with a `manifest.json` roster. It uses
only Node built-ins (`zlib`, `fs`) — no npm install required.

Rerun any time you tweak the generator:

```bash
node scripts/generate-portraits.js
```

## Deployment

GitHub Actions builds and deploys to GitHub Pages on **every push to every
branch** (see `.github/workflows/deploy.yml`). Each run overwrites the live
site, so whichever branch was pushed most recently wins.

To turn this on once per repo:

1. In repo **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push any commit; the workflow runs and the URL is reported in the run's
   `deploy` job summary (also as the `github-pages` environment URL).

Manual deploys are available via the workflow's `workflow_dispatch` button.
