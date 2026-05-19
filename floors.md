# Murdoku, Multi-Floor Architecture

A plan for adding multiple floors to a level: a Voyage cruise ship
with a Promenade deck above and Cabins below, a Starship with
Engineering and the Bridge, a Castle with the Great Hall, the Tower,
and the Dungeon. The biggest single content unlock the engine
hasn't yet shipped.

Status: planning only. No code yet.

---

## 1. Goals

- A level can have **one to four floors**, each with its own grid,
  rooms, decorations, doorways, and tile patterns.
- Floors are connected by **stairwells**: cell-to-cell links from
  one floor to another, rendered visually so the player can trace
  the path of the night.
- The **unique row / unique column** rule applies across the entire
  building, not per-floor. A suspect on floor 1 in column 4 forbids
  any suspect on any floor from also being in column 4. This keeps
  the deduction tight at higher floor counts.
- The **killer-alone-with-victim** rule applies per-floor: the
  killer was in the same room AND on the same floor as the victim.
  (Stairwells are not "the same room" for this purpose, even if
  they connect floors.)
- A single-floor level still uses the existing single-grid UI with
  no extra chrome. Multi-floor chrome (tabs, vertical slices)
  appears only when a level actually has more than one floor.
- Backward-compatible: every existing level loads as a one-floor
  level with no JSON migration tooling required.

## 2. Non-goals (v1)

- No physics or animations for stairwell traversal (no "walks up
  the stairs" animation).
- No realtime "see other suspects on the floor below through a
  glass ceiling" gimmick. Each floor renders independently.
- No height-aware special-character cards in v1. The 🦇 Phantom
  card stays per-floor (the killer is in the adjacent *room* on
  the same floor, not the room directly below). Cross-floor
  Phantom is a polish-phase extension.
- No more than 4 floors. The screen real estate and the deduction
  load both fall off a cliff above that.
- No partial-floor overlap (no "floor 2 is only the western half
  of floor 1"). Every floor has its own independent grid.

## 3. Data model

### Current shape

```json
{
  "id": "lvl_xxx",
  "name": "The Coastal Hotel",
  "size": 12,
  "rooms": [...],
  "decorations": { "5,3": "table", ... },
  "doorways": ["h:3,4", ...],
  "solution": { "5,3": "char-04", ... }
}
```

### New shape

```json
{
  "id": "lvl_xxx",
  "name": "Last Crossing of the Mariner",
  "theme": "voyage",
  "difficulty": "expert",
  "floors": [
    {
      "id": "f-upper",
      "name": "Promenade Deck",
      "order": 0,
      "size": { "w": 12, "h": 6 },
      "rooms": [...],
      "decorations": { "5,3": "deck-chair", ... },
      "doorways": ["h:3,4", ...],
      "tilePatternDefault": "deck-stripe"
    },
    {
      "id": "f-lower",
      "name": "Cabins",
      "order": 1,
      "size": { "w": 12, "h": 8 },
      "rooms": [...],
      "decorations": {...},
      "doorways": [...],
      "tilePatternDefault": "wood"
    }
  ],
  "stairwells": [
    { "from": { "floor": "f-upper", "x": 5, "y": 5 },
      "to":   { "floor": "f-lower", "x": 5, "y": 0 },
      "label": "Main staircase" }
  ],
  "victim": "char-08",
  "killerSolution": "char-18",
  "solution": {
    "f-upper:5,2": "char-08",
    "f-upper:6,3": "char-18",
    "f-lower:1,4": "char-13",
    ...
  },
  "clues": {...},
  "playerPlacement": {},
  "playerKiller": null
}
```

### Key shape changes

- `floors: Floor[]` replaces top-level `rooms`, `decorations`,
  `doorways`, `size`. Each entry is an independent grid.
- `stairwells: Stairwell[]` is a new top-level array. Each entry
  links a cell on one floor to a cell on another.
- Cell keys in `solution`, `playerPlacement`, and `decorations`
  on a floor change from `"x,y"` to `"x,y"` *within the floor*
  (still 2D-keyed); cross-floor lookups use `"floorId:x,y"`. The
  cross-floor form is the canonical form in the level's `solution`
  and `playerPlacement` so a single dictionary covers the whole
  building.

The cell-key change is the only invasive change. Everything else
nests cleanly.

### Backward compatibility

`normalizeLevel` in `js/decor.js` detects the old shape and wraps
it in a single-floor `floors: [{ id: 'f-main', name: '', order: 0,
size: { w: lvl.size, h: lvl.size }, rooms: lvl.rooms,
decorations: lvl.decorations, doorways: lvl.doorways }]`. Solution
keys get the `"f-main:"` prefix added.

Saved levels in `localStorage` are migrated on next load.

Old levels render byte-identically: a single-floor level skips the
floor-tab chrome entirely.

### `Floor` and `Stairwell` types

```ts
type Floor = {
  id: string;             // unique within the level
  name: string;           // 'Promenade Deck', 'Engineering', etc.
  order: number;          // 0 is the top floor, 1 below it, etc.
  size: { w: number, h: number };
  rooms: Room[];
  decorations: Record<string, string>;  // 'x,y' -> furnitureId
  doorways: string[];     // existing format
  tilePatternDefault?: string;
};

type Stairwell = {
  from: { floor: string, x: number, y: number };
  to:   { floor: string, x: number, y: number };
  label?: string;
};
```

`order` controls vertical stacking in the UI. Smallest number is
the visually top floor. Stairwells should respect order (an "up"
stairwell goes from higher `order` to lower `order`).

## 4. Game-rule interactions

### Unique row / column

Applies **across the entire building**. Two suspects on different
floors but in the same row OR column violate the rule.

Why: it preserves the heart of the puzzle. If row/column were
per-floor, a 3-floor level could comfortably hold 27 suspects with
trivial deduction; the multi-floor flag would actively make the
puzzle easier instead of harder.

Edge case: floors with different widths/heights. A `12x6` upper
deck and a `12x8` lower deck share columns 0-11 (collision
possible on any of them) and the rows on the upper deck (0-5)
also exist on the lower deck (0-5), but lower-deck rows 6-7 are
upper-deck-free. Row uniqueness is checked per row index that
both floors share; rows that exist only on one floor are
unconstrained by the other.

Practical rule of thumb for authors: build multi-floor levels
with the same `w` across floors, varying only `h`. The deduction
stays intuitive.

### Killer alone with victim

The killer was in the **same room AND on the same floor** as the
victim. Stairwells are NOT a room for this purpose.

Why per-floor? It's the strongest argument-from-physical-reality
the puzzle leans on. The killer had to be there. A stairwell
spanning floors implies the killer was either on the victim's
floor or the next one; if we allow "same room" to span the
stairwell, the deduction collapses. Cleaner to keep the rule
floor-bound and add a separate Phantom-like card for cross-floor
murders.

### Clue language for cross-floor relations

New phrases the author can use; all parsed by the player by
applying the rules, not by engine logic:

- "directly above X" / "directly below X", same `(x, y)`, one
  floor up / down.
- "on the floor above the X" / "on the floor below" (room-level,
  not cell-level).
- "in the same column as X" (column constraint already exists;
  same-column language now spans floors).
- "in the same row as X" (same, where the row exists on both
  floors).
- "at the foot of the stairs" / "at the head of the stairs",
  references a specific stairwell endpoint.

Existing clue rules still apply (no naming rooms, never reveal
the killer-same-room-as-victim, etc.).

## 5. UI

### Floor selector

The grid wrapper gains a tab strip above the board:

```
┌────────────────────────────────────────────────────────────┐
│ [ ▲ Promenade Deck ] [ ▼ Cabins ]                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  (active floor's grid renders here)                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

One tab per floor, in `order`-ascending sequence (top floor at the
left). Active tab is the one currently rendered. Tab title shows
the floor name; small ▲/▼ icons hint at direction. Keyboard:
`PageUp` / `PageDown` switches floors.

Single-floor levels: tab strip is hidden. No chrome.

### Stairwell visual

A stairwell cell renders a stairs icon (procgen, like furniture).
On click in play mode, switching focus to the stairwell's cell
also lights up the linked cell on the *other* floor when you
switch tabs, so the player can trace the connection visually.

In edit mode the Stairwell tool (new editor tool) lets the author
click two cells on two floors to link them. A delete affordance
removes the link.

### Multi-floor view (optional, stretch)

A "Show all floors" toggle stacks floors vertically with thin
gutters between them:

```
┌─────────────────┐
│  Promenade Deck │   (smaller scale)
└────┬────────────┘
     │ stairwell
┌────┴────────────┐
│      Cabins     │   (smaller scale)
└─────────────────┘
```

Suspects can be dragged across floors when this view is active.
This is a stretch goal; v1 ships with tabs only.

### Row/column X-ray across floors

The existing "Rows + cols" toggle gets a multi-floor mode:

- On the active floor: the X-rays render as today (row and column
  highlights for every placed suspect).
- For suspects on *other* floors: their row/column cast onto the
  active floor in a dimmer color. A column-3 collision between a
  floor-1 suspect and a floor-2 suspect lights both red on
  whichever floor is currently viewed.

The dimmer color is a `--xray-foreign` CSS variable.

## 6. Stairwells

### Spatial model

A stairwell is a directional link between two cells on two
different floors. The cell may be inside a room or in the outside
area. If inside a room, the stairwell is decorative on top of the
room's tile (the stairwell sprite replaces / sits over the
furniture layer).

Multiple stairwells can land on the same floor (a tower with
spiral stairs at the south end AND a service stair at the north).

Constraints, enforced by the editor:
- A cell can have at most one stairwell endpoint.
- A stairwell's two endpoints must be on different floors.
- The two endpoints' `(x, y)` do not have to match; a stairwell
  CAN go from `(3, 5)` upstairs to `(7, 0)` downstairs (a
  switchback). But the default placement nudges to "directly
  below" when possible, since that's the most common architecture
  in real houses.

### Stairwell as a special doorway

Stairwells are *not* the same as doorways. Doorways are between
two cells on the same floor. Stairwells are between two cells on
different floors. They render differently and have separate edit
tools. Both are decorative (don't affect placement legality);
both serve as in-fiction navigation cues.

### Visual

A new sprite, `stairs`, renders on a stairwell cell. Direction
arrows on the sprite hint at up vs down. The sprite ships as
`assets/furniture/stairs.png` with `themes: ['*']`, since stairs
are universal (galley ladder for ship, ramp for starship, etc.,
all use the same icon for v1; theme-specific stair sprites can
land in their respective packs).

## 7. Solution and clue model

### Cross-floor solution keys

```js
solution = {
  'f-upper:5,2': 'char-08',
  'f-upper:6,3': 'char-18',
  'f-lower:1,4': 'char-13',
  ...
}
```

The leading `"floorId:"` is the canonical form. When the engine
needs to look up "what's on cell (x, y) of the active floor", it
constructs the key as `${floor.id}:${x},${y}`.

### Backward compat for clues

Cell-keyed structures elsewhere (decorations, doorways) stay
floor-scoped (inside each floor object, keys are `"x,y"`). Only
the solution and playerPlacement use the cross-floor `"floorId:"`
prefix. This keeps each Floor object self-contained for editing,
while keeping the level-wide views (the solution, the
playerPlacement, the win check) trivial to iterate.

### Check Solution highlighting across floors

`checkSolution()` already returns `{ correct, wrong }` cell sets.
With multi-floor, each entry is now `{ floorId, x, y }` instead of
`{ x, y }`. The highlight function `highlightCells({correct,
wrong})` renders the marks on whichever floor is currently
active. Switching floors mid-result-display preserves the marks
on both floors.

## 8. Win condition

Unchanged in spirit:

- Every cell in `solution` must have the matching character in
  `playerPlacement`.
- A killer must be marked, and they must equal `killerSolution`.

The cell-key prefix means the win check iterates the same
dictionary as before. No floor-aware logic in the check function.

## 9. Editor surface

### New affordances

- **Floor controls** in the metadata panel: a list of floors with
  rename, reorder (up/down arrows), and delete buttons. A "+ New
  floor" button.
- **Stairwell tool** in the tool palette: click two cells on two
  floors to link them. Clicking a cell that already has a stairwell
  endpoint shows a small "remove stairwell" affordance.
- **Floor-aware solution tool**: drops a suspect onto the active
  floor; the cell key includes the floor id automatically.
- **Floor-aware clue editor**: cues display per-suspect as today,
  regardless of which floor the suspect stands on.

### Cross-floor warnings

When the author has placed two suspects on the same column across
floors, the row/column X-ray shows the collision in red (the
existing rule visualization). A non-blocking inline warning in the
clue editor reads:

> "Heads up: Eveline and Glover share column 4. The unique-column
>  rule applies across all floors."

The editor doesn't refuse the placement (authors might need this
transiently while puzzling). The Check Solution path WILL fail if
a saved solution violates the rule, exposing it loudly.

## 10. Phasing

### Phase A, Model migration (no UI change)

- `Floor` and `Stairwell` types added to `js/state.js`.
- `normalizeLevel` migrates old single-grid levels to the new
  multi-floor shape, single floor with `id: 'f-main'`.
- All existing rendering code is updated to read from
  `lvl.floors[activeFloorIdx]` instead of `lvl.rooms` /
  `lvl.decorations` / `lvl.doorways` / `lvl.size`.
- `state.activeFloorId` added, defaults to the first floor.
- Solution keys gain the floor prefix on save, lose it on read
  for floors-aware lookups.
- Visual effect: zero. Every existing level renders as it did,
  with the floor strip hidden because there's only one floor.

### Phase B, Floor switcher + stairwell sprite

- Floor tab strip rendered above the grid when `floors.length >
  1`.
- `stairs` sprite added to the furniture manifest, theme `'*'`.
- Stairwell tool added to the editor; doesn't yet link cells,
  just places the sprite. This is a low-risk increment.

### Phase C, Stairwell linking + cross-floor highlight

- Stairwell tool gains the two-click linking flow.
- Switching floors via a stairwell click lights the linked cell
  on the destination floor.
- Row/column X-ray gets the cross-floor dim overlay.

### Phase D, First multi-floor sample

- Ship one sample level using two floors. Recommended: a Voyage
  pack level (*Last Crossing of the Mariner*) with Promenade
  Deck + Cabins.
- This phase depends on:
  - Theme scaffolding (Phase A in `themes.md`)
  - Voyage pack assets (Phase B in `themes.md`)
  - Multi-floor model + UI (Phases A-C here)

### Phase E, Multi-floor in expert / fiendish tier

- 3+ floor levels for the expert / fiendish difficulty tier.
- Castle and Catacombs example: Tower (1 floor), Great Hall (1
  floor), Dungeon (1 floor). 3-floor stacks.

## 11. UI mockup

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ Murdoku   [ Edit | Play ]                       [Menu] [Help] │
├──────────────────────────────────────────────────────────────────┤
│ Case file: Last Crossing of the Mariner       [VOYAGE] [EXPERT] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────┐  ┌────────────────────────┐ │
│ │ [▲ Promenade Deck] [▼ Cabins]   │  │ Suspects (8)           │ │
│ ├─────────────────────────────────┤  │  [portrait grid]       │ │
│ │                                 │  │                        │ │
│ │   (12x6 grid of the upper deck) │  │ Clue                   │ │
│ │   stairwell sprite at (5,5) ▼   │  │  "Eveline sat in the   │ │
│ │                                 │  │   only armchair. She   │ │
│ │                                 │  │   was on the deck      │ │
│ │                                 │  │   above the dining     │ │
│ └─────────────────────────────────┘  │   room."               │ │
│                                      │                        │ │
│                                      │  [Check solution]      │ │
│                                      └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## 12. Risks and mitigations

- **Deduction sprawl.** A 3-floor 12x6-each level has 36
  unique-column slots and 6 unique-row slots; the author has to
  fit ~8-12 suspects through that. Authoring will be hard.
  Mitigation: most multi-floor levels stay at 2 floors. 3+ floors
  is fiendish-tier only.
- **Player confusion.** Switching floors mid-deduction is
  cognitive overhead. Mitigation: the row/column X-ray with
  cross-floor dim overlay tells the player "this column is
  already claimed on the other deck" at a glance. The Help modal
  gains a "multi-floor levels" section.
- **JSON migration risk.** The cell-key prefix change is the only
  invasive bit. Mitigation: `normalizeLevel` migrates on load AND
  on every save, so localStorage entries get rewritten
  transparently. Export JSON for shared levels carries the new
  shape from the moment Phase A ships, so we don't need a
  versioned schema.
- **Clue ambiguity.** "directly above X" reads naturally on a
  multi-floor level but is meaningless on a single-floor level.
  Mitigation: author convention only. The Help modal calls out
  the difference.

## 13. Interaction with other plans

- **Themes** (`themes.md`). Multi-floor sells the Voyage and
  Starship packs. The asset tagging treats `stairs` as a
  universal sprite. Castle and Hollow benefit too (tower /
  treehouse).
- **Multiplayer** (`multiplayer.md`). Shared multi-floor levels
  pack into the same JSON blob, no schema change beyond what
  this doc already specifies. The 32 KB share-payload limit
  applies; a 3-floor level fits comfortably.
- **Rectangular grids**. Multi-floor naturally pairs with the
  rectangular-grid change: each floor's `size` is `{w, h}`. The
  two changes can land together in a single phase if they're
  scheduled near each other, since both touch `normalizeLevel`
  and `grid.js`.
- **Special-character cards** (TBD). Most cards are floor-
  agnostic. Two cards become more interesting with multi-floor:
  - 👁️ **Witness** can now describe a sound from the floor above
    or below.
  - 🦇 **Phantom** can optionally extend to "killer was on the
    adjacent floor" via a flag on the card. Stretch goal, not
    v1.

## 14. Open questions

Surface and resolve when the relevant phase starts. None block
Phase A.

1. **Stairwell click navigation.** Should clicking a stairwell
   sprite in play mode auto-switch floors, or just highlight?
   Auto-switch is friendlier; highlight is more deliberate.
   Default stance: highlight, then second click switches.
2. **Floor names mandatory or optional?** Mandatory keeps the UI
   readable ("Promenade Deck" reads better than "Floor 1").
   Optional reduces author friction. Default: optional with a
   sensible auto-name ("Floor 1", "Floor 2", ...).
3. **Per-floor difficulty hints?** A 2-floor level might be
   expert because the floors interact richly, even if each floor
   alone is gentle. The difficulty tier remains a single field
   on the level; per-floor tiering isn't worth the cost.
4. **Stairwell as a room?** Some architectures (a grand spiral
   staircase) feel like a room of their own. The current plan
   says a stairwell is a *cell with a special doorway*, not a
   room. If we wanted a "Stairwell" room across floors, that
   would need a separate room concept and complicate the killer-
   alone rule. Default: no, stairwells are cells. Authors who
   want a stairwell room can put a `stairs` cell inside an
   ordinary room named "Stairwell" on each floor.

## 15. Things to NOT change

- **The square-grid default.** Single-floor levels stay on the
  current rendering path with no extra chrome.
- **Vanilla DOM, no framework.** Floor tabs are plain `<button>`s
  in a `<nav>`. No router, no view library.
- **No build step.** Floor data lives in the same JSON blob.
- **Engine simplicity.** The win-check and the unique-row/column
  enforcement do not gain floor-aware special cases; they iterate
  the canonical floor-prefixed solution dictionary.

---

End of plan. Phase A is a safe, demoable model migration. Phase D
is the first level that authentically uses multi-floor to tell a
mystery the single-grid engine can't.
