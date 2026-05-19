# Murdoku — Design Document

A murder-mystery puzzle game inspired by Sudoku. The board represents a house;
the player places character tiles into rooms until every room matches its
hidden solution.

This document is the source of truth for scope, mechanics, data model, and
build phases.

---

## 1. Vision

- Sudoku-flavoured deduction, but the puzzle is a *crime scene*.
- A **9x9 grid** represents the house. Tiles inside the grid can be assigned to
  rooms; tiles outside are simply unused (the house can be any shape inside
  the 9x9 bounding box).
- A creator (Edit Mode) carves out rooms, names them, and pins each suspect
  to the cell where they belong at the moment of the murder. That mapping is
  the **solution**.
- A player (Play Mode) drags suspects from a roster and tries to reconstruct
  the same arrangement. When every cell holds the correct character, they win.
- Everything is local: no server, no accounts. Levels are saved to
  `localStorage` and can be exported / imported as JSON.

---

## 2. Core Mechanics

### 2.1 The Grid
- Fixed 9x9 logical grid. Each cell has coordinates `(x, y)` with `x,y ∈ 0..8`.
- A cell is either **outside the house** (no room assigned, rendered as
  empty space) or **inside a room** (rendered with that room's tint).

### 2.2 Rooms
- A room is a labelled group of cells: `{ id, name, description, color, cells }`.
- Rooms do not have to be rectangular. Cells in a room do not have to be
  contiguous (it's a creative tool — useful for L-shaped halls, courtyards,
  split kitchens, etc.).
- Each room has a free-text **name** and **description** edited inline.

### 2.3 Walls (derived, not stored)
Walls are computed from the grid every render. The edge between two
adjacent cells `A` and `B` is a wall when:

| A           | B           | Wall? |
|-------------|-------------|-------|
| outside     | outside     | no    |
| outside     | in room X   | yes (exterior wall) |
| in room X   | in room X   | no    |
| in room X   | in room Y   | yes (interior wall) |

The same rule applies to the four edges that touch the grid border:
those become exterior walls whenever the adjacent cell is inside a room.

### 2.4 Doorways (decorative)
- A doorway is a wall segment marked as "open". It does **not** affect
  gameplay — it's purely a visual hint that two rooms connect.
- Stored as a set of edges: `{ x, y, side }` where side ∈ `top|right|bottom|left`.
- Drawing a doorway on an edge that is not currently a wall is a no-op.

### 2.5 Characters
- A character has: `id`, `name`, `description`, `portrait` (path to a static
  PNG in `assets/portraits/`).
- 20 characters ship with the game (procedurally generated pixel-art
  portraits). The editor can also rename / re-describe them per level so the
  same art can stand in for different suspects across stories.

### 2.6 Solution
- A map from cell coordinate → character id: `{ "3,5": "char-04", ... }`.
- A cell can only have a character placed on it if that cell belongs to a
  room.
- For now, every cell in the solution must match exactly; characters can
  appear in multiple cells if the author wants (no uniqueness enforced).
  This keeps the v1 puzzle authoring flexible.

### 2.7 Edit Mode vs Play Mode
- **Edit Mode** exposes every authoring tool: paint rooms, edit names,
  toggle doorways, place solution characters, edit level metadata.
- **Play Mode** hides the solution, hides room-painting tools, and lets the
  player drop characters onto cells. A *Check* button compares the player's
  placement against the saved solution and reports win/lose with a list of
  mismatched cells.

### 2.8 Win Condition
- Every cell that has a solution entry must have the matching character
  placed by the player.
- Cells without a solution entry must be left empty.
- Out-of-room cells are ignored.

---

## 3. Data Model

A single saved unit is a **Level**:

```json
{
  "id": "lvl_8f3a",
  "name": "The Crimson Conservatory",
  "description": "A reclusive botanist dies in her own greenhouse...",
  "rooms": [
    {
      "id": "room_1",
      "name": "Greenhouse",
      "description": "Glass walls, humid, smells of orchids.",
      "color": "#5fb27a",
      "cells": [[3,3],[4,3],[3,4],[4,4]]
    }
  ],
  "doorways": [
    { "x": 3, "y": 4, "side": "right" }
  ],
  "solution": {
    "3,3": "char-02",
    "4,4": "char-07"
  },
  "playerPlacement": {},
  "createdAt": 1715900000000,
  "updatedAt": 1715900000000
}
```

Storage shape in `localStorage`:

```
murdoku.levels      → JSON array of levels
murdoku.activeId    → id of the level currently being edited / played
murdoku.characters  → optional per-install override of character roster
```

The shipped character roster lives at `assets/portraits/manifest.json` and is
loaded as the default when no override exists.

---

## 4. UI / UX

```
┌──────────────────────────────────────────────────────────────┐
│ Murdoku   [Level name input] [Edit | Play]   [Save] [Export] │
├────────────────────┬─────────────────────────────────────────┤
│                    │                                         │
│   9x9 grid         │  Tools panel                            │
│   (cells, walls,   │   Mode-specific:                        │
│    doorways,       │   Edit:                                 │
│    portraits)      │     • Room palette / new room           │
│                    │     • Paint, erase, doorway tools       │
│                    │     • Solution tool (pick character)    │
│                    │   Play:                                 │
│                    │     • Character roster                  │
│                    │     • Check / Reset                     │
│                    │                                         │
├────────────────────┴─────────────────────────────────────────┤
│  Rooms list (inline name + description editors)              │
│  Level description textarea                                  │
└──────────────────────────────────────────────────────────────┘
```

- The grid is rendered with CSS grid; each cell is a `<div>` styled with the
  room's color and a portrait image when a character sits there.
- Walls are drawn as thick borders on the relevant cell sides; doorways
  override those borders with a different style (dashed / lighter).
- Drag-and-drop is the primary placement gesture; click-to-select-then-click
  is supported as a fallback.

---

## 5. Tech Stack

- Vanilla HTML/CSS/JS (ES modules). No framework — keeps the static deploy
  trivial and the bundle tiny.
- One Node script (`scripts/generate-portraits.js`) for procedural portrait
  generation. Pure Node, no dependencies — uses built-in `zlib` plus a
  hand-rolled PNG encoder.
- GitHub Actions for GitHub Pages deploy on every push to every branch.

---

## 6. Procedural Portrait Generation

20 deterministic, seeded pixel-art portraits at 32×32 source resolution
(rendered upscaled with `image-rendering: pixelated`).

Each portrait is built from layered features:

1. Background colour
2. Skin tone
3. Head/face shape
4. Hair style + hair colour
5. Eye colour
6. Mouth (neutral / smile / frown)
7. Optional accessories: glasses, hat, beard, mustache, earring
8. Shirt colour and collar style

Each character also gets a default `name` and `description` (a one-liner
about the suspect). The editor can override both per level.

Output: `assets/portraits/character-01.png` … `character-20.png` plus
`manifest.json` containing the roster.

---

## 7. Build Phases

Each phase ends in a runnable, demoable state.

### Phase 1 — Foundations *(this commit)*
- Repository scaffolding (`index.html`, `css/`, `js/`, `assets/`, `scripts/`).
- Design doc (this file) committed.
- Empty grid renders at 9x9.
- `localStorage` round-trip stub for levels.

### Phase 2 — Portrait Generator
- `scripts/generate-portraits.js` produces 20 PNGs and a manifest.
- Manifest loaded at runtime; characters listed in the sidebar.

### Phase 3 — Room Editor
- Paint a room onto cells with a chosen colour.
- Add / rename / delete rooms.
- Auto-derived walls render correctly on every redraw.
- Doorway tool toggles an edge between wall / doorway.

### Phase 4 — Solution Editor & Play Mode
- Editor can drop characters into cells (saves to `solution`).
- Toggle Edit ↔ Play. Play mode lets the user fill `playerPlacement`.
- `Check` button verifies win condition and highlights mismatches.

### Phase 5 — Level Metadata & Library
- Level name, description, rooms list panel with inline editors.
- Save / load multiple levels in `localStorage`.
- Export / import individual levels as JSON.

### Phase 6 — Deployment
- GitHub Actions workflow that builds and deploys to GitHub Pages on
  **every push to every branch** (and on `workflow_dispatch`).
- README updated with deploy + local dev instructions.

### Future / out of scope for v1
- **Procedural floor tiles per room.** The published Murdoku book gives each
  room a distinctive tile pattern (pink checker, green wallpaper, peach
  floorboards, etc.). A future phase should procedurally pick a tile pattern
  per room from a small library — tile patterns are pure CSS / SVG and
  rendered as the room's background.
- **Procedural furniture decorations.** Same reference uses scattered
  decorative props inside rooms (chairs, dressers, potted plants, music
  notes, etc.). These are pure flavour — they sit in empty cells, do not
  block character placement, and a generator picks 0–N per room based on
  size. Probably warrants its own `assets/furniture/` sprite set.
- Clue system (text clues + logical deduction validator).
- Uniqueness constraints à la Sudoku (each character once per row/column).
- Multi-floor houses.
- Sharing levels via URL hash.
- Undo / redo stack.

---

## 8. Non-goals (v1)

- No accounts, no networking, no analytics.
- No mobile-first layout — desktop browser is the primary target, though
  the layout should not actively break on tablet widths.
- No animation beyond simple CSS transitions.
- No build step, bundler, or framework dependency.
