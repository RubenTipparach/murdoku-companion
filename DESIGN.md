# Murdoku, Design Document

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
  contiguous (it's a creative tool, useful for L-shaped halls, courtyards,
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
  gameplay, it's purely a visual hint that two rooms connect.
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
      "tilePattern": "diamond",
      "cells": [[3,3],[4,3],[3,4],[4,4]]
    }
  ],
  "doorways": ["h:3,4"],
  "solution": {
    "3,3": "char-02",
    "4,4": "char-07"
  },
  "playerPlacement": {},
  "decorations": {
    "4,3": "plant",
    "3,4": "armchair"
  },
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
│   (cells, walls,  │   Mode-specific:                        │
│    doorways,      │   Edit:                                 │
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

- Vanilla HTML/CSS/JS (ES modules). No framework, keeps the static deploy
  trivial and the bundle tiny.
- One Node script (`scripts/generate-portraits.js`) for procedural portrait
  generation. Pure Node, no dependencies, uses built-in `zlib` plus a
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

### Phase 1, Foundations *(this commit)*
- Repository scaffolding (`index.html`, `css/`, `js/`, `assets/`, `scripts/`).
- Design doc (this file) committed.
- Empty grid renders at 9x9.
- `localStorage` round-trip stub for levels.

### Phase 2, Portrait Generator
- `scripts/generate-portraits.js` produces 20 PNGs and a manifest.
- Manifest loaded at runtime; characters listed in the sidebar.

### Phase 3, Room Editor
- Paint a room onto cells with a chosen colour.
- Add / rename / delete rooms.
- Auto-derived walls render correctly on every redraw.
- Doorway tool toggles an edge between wall / doorway.

### Phase 4, Solution Editor & Play Mode
- Editor can drop characters into cells (saves to `solution`).
- Toggle Edit ↔ Play. Play mode lets the user fill `playerPlacement`.
- `Check` button verifies win condition and highlights mismatches.

### Phase 5, Level Metadata & Library
- Level name, description, rooms list panel with inline editors.
- Save / load multiple levels in `localStorage`.
- Export / import individual levels as JSON.

### Phase 6, Deployment
- GitHub Actions workflow that builds and deploys to GitHub Pages on
  **every push to every branch** (and on `workflow_dispatch`).
- README updated with deploy + local dev instructions.

### Phase 7, Procgen decoration *(this branch)*
- **Floor tile patterns.** Eight tile patterns implemented as pure CSS
  (`solid`, `check`, `stripe-v`, `stripe-h`, `wood`, `dots`, `diamond`,
  `square`). Each layers a translucent dark pattern over the room's base
  colour so any tile reads sensibly on any room. The pattern lives on the
  room model as `tilePattern: string`.
- **Furniture sprites.** Twelve hand-drawn 32×32 furniture sprites
  (`chair`, `armchair`, `sofa`, `bed`, `table`, `dresser`, `bookshelf`,
  `piano`, `lamp`, `plant`, `painting`, `rug`) generated by
  `scripts/generate-furniture.js` and shipped at `assets/furniture/*.png`
  with a sibling `manifest.json`. Furniture is decorative only, it renders
  behind the character portrait layer and is `pointer-events: none`.
- **Decorations map.** Each level gains `decorations: { "x,y": furnitureId }`.
  Entries are cleaned up automatically when a cell leaves its room.
- **Roll tools.** Each room in the edit panel gets a 🎲 button that picks a
  new tile pattern and a fresh furniture layout (~30% of the room's
  non-solution cells, capped at six). A "🎲 Roll all" button reshuffles the
  whole house at once.
- **Shared lib.** PNG encoding, CRC32, the pixel canvas, and the seeded
  RNG live in `scripts/lib/pixel.js`. Both art generators import from it.

### Phase 8, Starter level + drag-and-drop
- Hand-crafted starter level **"The Crimson Conservatory"** in `js/sample.js`.
- **Drag-and-drop suspect placement**. Roster tiles are HTML5 draggables;
  dropping onto an in-room cell calls `placeCharacterAt`. Click-to-select-
  then-click remains as a fallback.
- Sample is exposed via the Levels modal (**Load sample**), always imports
  a fresh copy with a new id.

### Phase 10, Sample library, lock, clone, mobile nav *(this branch)*
- **Four shipped sample mysteries** in `js/sample.js`:
  *The Crimson Conservatory* (6 suspects), *Midnight at the Lighthouse* (4),
  *Tea and Treachery* (3), *The Bookseller's Loft* (5). Each is read-only
  (`isSample: true`) until cloned.
- **Sample lock.** When a sample is the active level, the edit sidebar's
  interactions are disabled, the level metadata fields go read-only, and a
  banner above the grid prompts the player to clone first.
- **Clone button** in the topbar (and on the banner) deep-clones the active
  level, strips `isSample`, switches to the clone in edit mode.
- **Topbar level select** lists every saved level (samples prefixed with 🔒).
- **Persistent mode toggle.** The Edit/Play pill is now its own row in the
  topbar and stays visible at every viewport.
- **Mobile-friendly topbar.** Flexbox with `flex-wrap`; a `@media
  (max-width: 560px)` breakpoint scales cells and tightens the action
  buttons. Topbar is `position: sticky`.
- **Play-mode metadata view.** The level description textarea is hidden in
  play mode and replaced with a read-only paragraph. The meta-heading
  changes from "Level description" to "Case file".
- **Character descriptions in clues.** Both the edit-mode clue editor and
  the play-mode clue bubble now show the character's manifest description
  alongside the level-specific clue.
- **Suspect-clue merge in play mode.** The standalone clues list is gone.
  Tapping a suspect tile now pops a clue bubble below the roster *and*
  highlights that suspect's currently-placed cell on the grid with a
  pulsing accent ring, so the player can see at a glance where they've
  already put the person they're reading a clue about.

### Phase 9, Clues, start menu, one-cell rule
- **Start menu** modal on first visit (no closable X) asks **Play the
  sample mystery** vs **Create your own house**, so players are never
  spoiled by landing in edit mode on a level with a visible solution. A
  topbar **Menu** button re-opens the same modal anytime.
- **Per-character clues**. Level model gains `clues: { [charId]: string }`.
  In Edit mode a clue editor lists every suspect currently placed in the
  solution and offers a textarea for each. In Play mode a clues panel
  renders portrait + name + clue text for each suspect.
- **Relational clue language.** The sample's clues reference furniture
  ("at the orchid table", "at the keys of a piano") and other suspects
  ("across the room from Dr. Quint") but never name a room directly. Each
  clue uniquely identifies a single cell when combined with the others.
- **Filtered Play roster.** Play mode only shows characters who actually
  appear in this case (`new Set(values(solution))`), not all 20 portraits.
- **One suspect, one cell.** `placeCharacterAt` now removes the character
  from any previous cell before writing the new one. Click-handlers in
  edit and play both route through it. A re-placement therefore *moves*
  rather than duplicates.
- **FLIP move animation.** `rerender()` snapshots portrait positions
  before the DOM is rebuilt, then translates each portrait back to its
  prior position with `transition: none`, forces a reflow, and lets the
  CSS `transform` transition slide it home. So a suspect literally walks
  from their old cell to the new one when you re-place them.
- **Locked metadata in Play mode.** The level name and description are
  read-only in Play mode so a player can't accidentally rewrite the case.
- **Wrap room labels.** Long room names ("Dining Room") now wrap on
  multiple lines instead of truncating with an ellipsis.

### Future / out of scope for v1
- Clue system (text clues + logical deduction validator).
- Uniqueness constraints à la Sudoku (each character once per row/column).
- Multi-floor houses.
- Sharing levels via URL hash.
- Undo / redo stack.
- Hand-placed furniture (drag a specific furniture tile into a cell instead
  of only rolling whole rooms).
- A richer furniture-rolling weighting that picks "bed" only for bedroom,
  "piano" only for music rooms, etc., requires room type tags.
- Touch / mobile drag-and-drop (current HTML5 DnD works only on pointer
  devices; tap-to-select still works on touch).

---

## 8. Non-goals (v1)

- No accounts, no networking, no analytics.
- No mobile-first layout, desktop browser is the primary target, though
  the layout should not actively break on tablet widths.
- No animation beyond simple CSS transitions.
- No build step, bundler, or framework dependency.
