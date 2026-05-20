# Murdoku, agent notes

Persistent project rules for future sessions. If you're picking up this
codebase, read this first.

## Game rules (canonical)

The 9×9 grid is a house. Every level has a small cast of named suspects,
one of whom is the **victim** 🪦 and one of whom is the **killer** 🔪.

1. **Unique row + column.** Every suspect, including the victim, stands
   on a unique row AND a unique column. No two suspects share a row or
   column under any circumstance.
2. **Killer alone with victim.** The killer was in the same room as the
   victim, and nobody else was in that room. Every other suspect was in
   a different room from the victim.
3. **Suspects don't stand on solid furniture.** A suspect can occupy
   a cell that holds furniture they would *sit in, lie on, or soak in*
   (chair, armchair, sofa, bed, rug, and bathroom fixtures like tub,
   shower, toilet when those ship). They CANNOT occupy a cell that
   holds furniture they would have to stand on top of: table, dresser,
   bookshelf, safe, fireplace, stove, gramophone, typewriter, piano,
   plant, floor lamp, standing clock. The piano bench, the typewriter
   chair, the dressing-table stool are conceptually in the *adjacent*
   cell.
   - Wall-mounted decoration (painting, mirror, hanging clock) is
     non-blocking. The cell underneath stays free; a suspect standing
     there is standing *in front of* the painting, not on it.
   - This is both an authoring rule (don't place a suspect on a
     blocking-furniture cell in `solution`) and a player rule (the
     engine should refuse drops on blocking-furniture cells, follow-up
     work).
4. **Win condition.** The player wins when (a) every suspect is placed
   in their exact correct cell, AND (b) the player has marked the killer
   with 🔪.

## Clue authoring rules, DO NOT BREAK

These rules apply to **every level**, including all four shipped samples.
They are the hardest things to get right and the easiest to regress.

### NEVER name a room in a clue.

❌ "Crowe was at a chair in the library."
❌ "Felix was in the garden among plants."
❌ "Silas was at a table in the kitchenette."

✅ "Crowe was at a chair beside a wall of books."
✅ "Felix was outside, among potted plants."
✅ "Silas was at a small table, the only one in the building besides the wine table."

Why: the puzzle is "figure out which room each person is in from their
surroundings". Naming the room destroys the puzzle.

### NEVER let the killer's clue reveal that they shared a room with the
victim.

❌ "Crowe was at a chair in the same room as Lady Wraithmoor."

✅ "Crowe was at a chair beside a potted orchid."   (lets the player
deduce same-room via furniture proximity)

Why: every victim's clue already states "I was alone in the room with
the killer", the player solves the killer by working out where each
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
  same column as …", these are puzzle-rule references the player
  uses to deduce position.
- Other suspects' positions: "to the right of Dr. Quint", "in the same
  row as Crowe", "across from the reverend".

Disallowed:
- Room names (Library, Parlour, Kitchen, etc.)
- Direct statements like "in the room with the victim" in any non-victim
  clue.
- **Counting cells** ("two cells above", "three rows below", "four
  columns to the right"). Players shouldn't have to count squares , 
  use adjacency / diagonal / same-row / same-column instead.

### Mind the prepositions, "beside" never means "on top of".

Per canonical rule 3, a suspect's cell is either the same cell as
the furniture (only for sit/lie/soak furniture) or an *adjacent*
cell. Clue prepositions must reflect that. Get this wrong and the
clue contradicts the solution.

**Adjacency words**, these put the suspect in a cell next to the
anchor, never on the anchor's cell:

- "beside …", "next to …", "directly above/below/left/right of …",
  "diagonally adjacent to …", "between … and …", "flanked by …".

So "beside the dresser" means the suspect's cell is *adjacent to* the
dresser cell. Never write "beside the dresser" and then place the
suspect on the dresser cell, and never use "beside" as a softer way
to say "on".

**On-cell words**, these put the suspect on the same cell as the
furniture, and so are only valid for sit/lie/soak furniture:

- "on the sofa", "in the armchair", "in the only bed", "on a rug",
  "seated in a chair", "soaking in the tub".

**"At" is the tricky one.** "At" usually means the suspect is *in
front of, but not on*, the anchor, which makes it adjacency by
default. So "at a table", "at the keys of the piano", "at the
typewriter", "at the only safe", "at a bookshelf" all place the
suspect in an adjacent cell (sitting at the chair beside the table,
on the piano bench, in the chair at the desk, etc.). Never place a
suspect on a `table`/`piano`/`typewriter`/`safe`/`bookshelf` cell in
the solution and then say "at" in the clue, the cell IS the
furniture, the suspect needs to be next door.

❌ Solution puts char-01 on a `table` cell with clue "slumped at a
   table" (rule 3 violation, the table is the cell).
✅ Solution puts char-01 in a chair-cell beside a `table`-cell with
   clue "slumped at a table" (suspect occupies the chair, the table
   is the adjacent anchor).

### Embrace ambiguity. Do not over-specify duplicate furniture.

This is the heart of the puzzle. When the same furniture (chair, plant,
dresser, ...) appears multiple times, do NOT tell the player which one:

❌ "Hask was beside a dresser, the one surrounded by storage crates,
   not the one beside the bed."
❌ "Crowe was at the bookshelf furthest from the window."
❌ "Yew was at the plant nearest the door."

Leave the clue ambiguous on its own:

✅ "Hask was beside a dresser."
✅ "Crowe was at a bookshelf."
✅ "Yew was tending a potted plant."

The player resolves the ambiguity by applying the puzzle rules to the
OTHER suspects (every suspect on a unique row and column, killer alone
with victim). Ambiguity that the player has to LOGIC their way out of
is the whole point of the game. Spoiling it with "the one near X" makes
the puzzle trivial.

When to refer to a specific furniture instance:
- The piece is unique on the board ("the only piano").
- The disambiguator is another suspect ("the bookshelf behind Mortimer"),
  not a coordinate or another piece of furniture.

### Punctuation: NEVER use em-dashes (", "). Anywhere. Ever.

This is a hard rule. No em-dashes in:
- player-visible strings (level names, descriptions, clues, UI text)
- code comments
- doc files (CLAUDE.md, DESIGN.md, README.md, this file)
- commit messages
- PR titles or bodies

The em-dash character renders inconsistently across fonts and reads
oddly in short clues. Replace it with one of:
- a comma (most cases): "Crowe was at a bookshelf, the only one in the room."
- a period: "Crowe was at a bookshelf. The only one in the room."
- a colon (when introducing a list): "Three rules: ..."
- parentheses (parenthetical aside): "Crowe (the entomologist) was..."
- a space-hyphen-space " - " (in code comments where you want a visual break)

❌ "Crowe was at a bookshelf, the only one in the room."
✅ "Crowe was at a bookshelf, the only one in the room."

If you find an em-dash in this codebase, fix it on sight. There is a
sed one-liner under "Tech notes" that strips them all.

### Furniture for clue anchors must be unique or disambiguated.

If you write "at the piano", there must be exactly one piano on the
board. If two pianos exist, the clue must say which: "at the piano
furthest from the door", or use another anchor.

When a furniture type appears multiple times, the clue must disambiguate
via something else: "the bookshelf with a lamp beside it", "the dresser
in the storage area (not the one in the bedroom)".

### Case descriptions are pure flavour.

Never embed the puzzle rules in a level's `description`. The rules
live in the Help modal (the ❓ button on the start-menu footer and in
the topbar), which is reachable from every screen. A case description
should set the scene in one or two sentences and stop there. Tutorial
levels are no exception, a new player is one click away from the rules.

### Every shipped sample carries a `difficulty` tier.

Primary tiers in order: `'easy' | 'medium' | 'hard'`. Legacy values
`'tutorial' | 'gentle' | 'standard' | 'tricky' | 'expert' |
'fiendish'` are still recognised in the labels map for backward
compatibility with user-authored levels saved before the rename, but
new shipped samples use only the three primary tiers. The chip
renders on the start-menu sample card and in the case-file header.

Tiering rough rubric:
- **easy** (the m1-m9 samples): rectangular rooms, 3-5 suspects, most
  anchors are unique furniture, generous clues. The on-ramp set.
- **medium** (the m10-m12 samples): non-rectangular rooms (L, T, plus,
  S shapes), 6-7 suspects, duplicate furniture forcing row / column
  deduction, fantasy flavour. Clue chains may reference relative
  position between suspects.
- **hard** (planned, no shipped samples yet): introduces the special
  character cards and house modifiers. Full row / column saturation,
  multiple cards in play per puzzle.

### The house outline must NEVER be a plain rectangle.

When the union of all room cells forms a perfect rectangle the level
looks like a generic grid, not a house. Every shipped sample's
combined outline must be a non-rectangular shape: T, L, plus / cross,
U, irregular polyomino. The interior partition into rooms can use any
shape (rectangles, L-shapes, donuts, etc.), but the *outer perimeter*
of all-rooms-combined must have at least one notch.

### Use the house-first authoring method.

Author every new level in two steps:

1. **Define the house outline.** Pick the cells the building occupies
   on the grid. Make it a non-rectangular polyomino (T, L, plus,
   cross, irregular). All cells in this outline must be orthogonally
   connected; no floating islands.

2. **Partition the outline into rooms.** Carve the outline into
   N room polyominoes that tile the outline exactly: every cell of
   the outline belongs to exactly one room, every interior edge is
   the boundary of two rooms (no gap cells between rooms inside the
   house). Room shapes are free, mix solid rectangles with L's,
   donuts, T's; just keep them connected.

This guarantees the packing invariant (every room shares at least one
wall with another) and the non-rectangular outline together. The
`scripts/check-packed.mjs` validator enforces step 2; the
non-rectangular outline of step 1 is on the author.

### Check Solution highlighting, only highlight what the player placed.

When the player hits **Check solution** and is wrong, the grid must
only outline cells the player *actually placed a suspect on*:

- ✅ green outline on placed cells whose suspect is correct
- ❌ red outline on placed cells whose suspect is wrong
- **No outline** on cells the player left empty. We never highlight a
  cell where a suspect is "missing", that's not feedback the player
  needs and it lights up half the board on a partial answer.

`checkSolution()` returns both `correct` and `wrong` cell sets, they
must only contain cells present in `playerPlacement`.

## Tech notes

- Pure static site: vanilla ES modules, no build step. Served via GitHub
  Pages, deployed by `.github/workflows/deploy.yml` on every push to
  every branch.
- Pixel-art assets are generated by Node scripts in `scripts/`. They use
  `scripts/lib/pixel.js` (PNG encoder + Canvas + RNG). Outputs are
  committed *and* regenerated on every CI deploy.
- Don't add framework dependencies. Don't add a build step. Don't add an
  emoji or font dependency, ship inline SVG or generated PNGs for any
  icon that needs to render uniformly on every device.
- State lives in `localStorage`. Schema migrations belong in
  `normalizeLevel` in `js/decor.js`.
- Strip em-dashes anywhere they slip in:
  ```bash
  grep -rl ', ' --include='*.js' --include='*.md' --include='*.html' \
    --include='*.css' --include='*.yml' --include='*.json' . \
    | xargs sed -i 's/, /, /g'
  ```
  Then visually scan changed files for awkward grammar and tighten.

## Conventions

- Branch off `main`. Default branch is `main`. Don't open PRs unless the
  user explicitly asks.
- `?v=N` query strings on `style.css` and `main.js` in `index.html`
  bust the GH Pages CDN. Bump the number on any meaningful change so
  mobile browsers refetch.
- All UI state that should survive a render lives on `state` in
  `js/state.js`. View-only toggles can be transient (lost on reload) if
  there's no expectation of persistence.
