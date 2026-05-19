# Murdoku — agent notes

Persistent project rules for future sessions. If you're picking up this
codebase, read this first.

## Game rules (canonical)

The 9×9 grid is a house. Every level has a small cast of named suspects,
one of whom is the **victim** 🪦 and one of whom is the **killer** 🔪.

1. **Unique row + column.** Every suspect, including the victim, stands
   on a unique row AND a unique column. No two suspects share a row or
   column under any circumstance.
2. **Killer alone with victim.** The killer was in the same room as the
   victim — and nobody else was in that room. Every other suspect was in
   a different room from the victim.
3. **Win condition.** The player wins when (a) every suspect is placed
   in their exact correct cell, AND (b) the player has marked the killer
   with 🔪.

## Clue authoring rules — DO NOT BREAK

These rules apply to **every level**, including all four shipped samples.
They are the hardest things to get right and the easiest to regress.

### NEVER name a room in a clue.

❌ "Crowe was at a chair in the library."
❌ "Felix was in the garden among plants."
❌ "Silas was at a table in the kitchenette."

✅ "Crowe was at a chair beside a wall of books."
✅ "Felix was outside, among potted plants."
✅ "Silas was at a small table — the only one in the building besides the wine table."

Why: the puzzle is "figure out which room each person is in from their
surroundings". Naming the room destroys the puzzle.

### NEVER let the killer's clue reveal that they shared a room with the
victim.

❌ "Crowe was at a chair in the same room as Lady Wraithmoor."

✅ "Crowe was at a chair beside a potted orchid."   (lets the player
deduce same-room via furniture proximity)

Why: every victim's clue already states "I was alone in the room with
the killer" — the player solves the killer by working out where each
suspect was and seeing who landed in the victim's room. If the killer's
own clue says "same room as victim" the deduction collapses.

### ALWAYS append the "alone with the killer" line to the victim's clue.

Every victim clue ends with (in some phrasing):

> ... She/He was alone in the room with the killer.

This is the only place the rule is restated in-clue. Without it, a new
player has no idea what to look for.

### Use only furniture, relative positions, and other suspects.

Allowed clue building blocks:
- Furniture references: "at the orchid table", "on the rug", "at the
  keys of a piano", "beside the bookshelves".
- Adjacency / diagonal language: "beside …", "next to …", "directly
  above …", "directly below …", "diagonally adjacent to …", "between …
  and …", "flanked by …".
- Same-row / same-column language: "in the same row as …", "in the
  same column as …" — these are puzzle-rule references the player
  uses to deduce position.
- Other suspects' positions: "to the right of Dr. Quint", "in the same
  row as Crowe", "across from the reverend".

Disallowed:
- Room names (Library, Parlour, Kitchen, etc.)
- Direct statements like "in the room with the victim" in any non-victim
  clue.
- **Counting cells** ("two cells above", "three rows below", "four
  columns to the right"). Players shouldn't have to count squares —
  use adjacency / diagonal / same-row / same-column instead.

### Disambiguating duplicate furniture.

When the same furniture (chair, plant, bookshelf, …) appears multiple
times, do NOT lean on cell-counting to identify the right one. Either:
- Refer to a unique neighbor: "the chair next to the piano".
- Refer to another suspect: "the bookshelf behind Mortimer".
- Or trust the row/column uniqueness rule — the player will eliminate
  candidates because every suspect occupies a different row and a
  different column.

### Furniture for clue anchors must be unique or disambiguated.

If you write "at the piano", there must be exactly one piano on the
board. If two pianos exist, the clue must say which: "at the piano
furthest from the door", or use another anchor.

When a furniture type appears multiple times, the clue must disambiguate
via something else: "the bookshelf with a lamp beside it", "the dresser
in the storage area (not the one in the bedroom)".

### Sample 1's description embeds the rules for new players.

The description of `lvl_sample_conservatory` walks the player through
the rules. Other sample descriptions are shorter and assume the rules
are known.

### Check Solution highlighting — only highlight what the player placed.

When the player hits **Check solution** and is wrong, the grid must
only outline cells the player *actually placed a suspect on*:

- ✅ green outline on placed cells whose suspect is correct
- ❌ red outline on placed cells whose suspect is wrong
- **No outline** on cells the player left empty. We never highlight a
  cell where a suspect is "missing" — that's not feedback the player
  needs and it lights up half the board on a partial answer.

`checkSolution()` returns both `correct` and `wrong` cell sets — they
must only contain cells present in `playerPlacement`.

## Tech notes

- Pure static site: vanilla ES modules, no build step. Served via GitHub
  Pages, deployed by `.github/workflows/deploy.yml` on every push to
  every branch.
- Pixel-art assets are generated by Node scripts in `scripts/`. They use
  `scripts/lib/pixel.js` (PNG encoder + Canvas + RNG). Outputs are
  committed *and* regenerated on every CI deploy.
- Don't add framework dependencies. Don't add a build step. Don't add an
  emoji or font dependency — ship inline SVG or generated PNGs for any
  icon that needs to render uniformly on every device.
- State lives in `localStorage`. Schema migrations belong in
  `normalizeLevel` in `js/decor.js`.

## Conventions

- Branch off `main`. Default branch is `main`. Don't open PRs unless the
  user explicitly asks.
- `?v=N` query strings on `style.css` and `main.js` in `index.html`
  bust the GH Pages CDN. Bump the number on any meaningful change so
  mobile browsers refetch.
- All UI state that should survive a render lives on `state` in
  `js/state.js`. View-only toggles can be transient (lost on reload) if
  there's no expectation of persistence.
