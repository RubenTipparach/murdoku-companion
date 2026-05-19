# Murdoku, Themed-Pack Scaffolding

A plan for the architecture that lets every level declare a theme
(Manor, Voyage, Train, Plane, Starship, Castle, Hollow), filters the
furniture roller to theme-appropriate sprites, and lays the
foundation for shipping themed sample packs without breaking the
current visual style.

Status: planning only. No code yet.

---

## 1. Goals

- A single `theme` field on each level drives furniture roll
  filtering, tile-pattern filtering, and the room-tint palette
  suggested in the editor.
- Existing 18 furniture sprites stay where they are. They gain a
  `themes: string[]` tag in the manifest.
- Sprite reuse across themes is free: a `chair` is `themes: ['*']`
  and shows up in every pack's furniture roller. A `cryopod` is
  `themes: ['starship']` and never shows up in a Manor level.
- Authors can hand-place any sprite regardless of theme. Theme only
  filters what the *roller* picks; the editor's full sprite picker
  stays unfiltered, so cross-theme remixes ("Haunted Starship",
  "The Sunken *Mariner*") are one click away.
- No build step added. Manifests stay JSON. CSS stays vanilla.

## 2. Non-goals (v1)

- No theme-specific portrait variants. The 20 base portraits stay
  universal across themes. Costume cues come from clue text and
  surrounding furniture, not portrait art. (Theme-tagged portrait
  generation is a stretch goal, parked for a later phase.)
- No theme-specific clue-language voice. Authors hand-write clues
  per level; we don't auto-flavor them.
- No theme inheritance / cascading (no "this level is mostly Manor
  but borrows Voyage furniture"). The theme is a single string.
  Borrowing happens at the per-sprite hand-placement level.
- No theme-specific game mechanics beyond what's already planned
  in CLAUDE.md and `multiplayer.md`. The special-character cards
  (Phantom, Bound Pair, etc.) work in any theme.
- No portrait-feature theme bias in v1 (the `--theme` flag on
  `generate-portraits.js`). Parked for the polish phase.

## 3. The themes

Seven launch themes, three of them ready to author into (Manor is
already shipping). The rest gain author-ready sprite sets in the
phases below.

| Key | Name | Vibe | Status |
|-|-|-|-|
| `manor` | Gaslight Manor | Victorian / Edwardian houses, the current default | Shipping |
| `voyage` | The Voyage | Cruise-liner deck plans, nautical sleuthing | Phase B |
| `train` | The 4:15 | Closed-room mysteries on the night express | Phase C |
| `plane` | Cabin Pressure | Narrow-body airliner, mile-high mysteries | Phase C (with Train) |
| `starship` | Starship Detective | Deep-space sci-fi crime | Phase D |
| `castle` | Castle and Catacombs | Medieval + fantasy stone halls | Phase E |
| `hollow` | The Hollow | Whimsical small-creature cosy mysteries | Phase F |

Theme registry sketch:

```js
// js/themes.js
export const THEMES = {
  manor: {
    name: 'Gaslight Manor',
    description: 'Victorian houses, cosy mysteries.',
    roomPaletteHints: ['#7bc48f', '#c4937b', '#a87bc4', '#c47b7b', '#7b9ed1', '#c4a87b'],
  },
  voyage: {
    name: 'The Voyage',
    description: 'Cruise ship mysteries on the high seas.',
    roomPaletteHints: ['#5e8db8', '#a8c4d8', '#c4b08e', '#3a6080', '#f0e8d8', '#8a4a3a'],
  },
  train: {
    name: 'The 4:15',
    description: 'Closed-room mysteries aboard the night express.',
    roomPaletteHints: ['#8a5a3a', '#a87b5a', '#c4937b', '#5a3a2a', '#3a2a1a'],
  },
  plane: {
    name: 'Cabin Pressure',
    description: 'Mile-high mysteries on a narrow-body.',
    roomPaletteHints: ['#7a8a9a', '#5a6a7a', '#9aaabb', '#cad8e8'],
  },
  starship: {
    name: 'Starship Detective',
    description: 'Sci-fi crime aboard a deep-space vessel.',
    roomPaletteHints: ['#3a4a5a', '#5a7a8a', '#7a9aaa', '#2a3a4a', '#5a6a8a', '#3a5a6a'],
  },
  castle: {
    name: 'Castle and Catacombs',
    description: 'Medieval and fantasy mysteries in stone halls.',
    roomPaletteHints: ['#6a5a4a', '#8a7a5a', '#4a3a2a', '#3a3a4a', '#5a4a6a'],
  },
  hollow: {
    name: 'The Hollow',
    description: 'Whimsical small-creature mysteries.',
    roomPaletteHints: ['#f8c8a8', '#d8a8c8', '#a8d8c8', '#c8e8a8'],
  },
};
```

`roomPaletteHints` populates the editor's room-color picker with
theme-appropriate suggestions. Author can still pick any color via
the underlying input; hints are a default, not a constraint.

## 4. Asset tagging

### Furniture manifest

Each entry gains a `themes: string[]`. The sentinel `'*'` matches
all themes (no need to list every key). Missing = `'*'` for
backward compatibility with the current manifest.

```json
{
  "id": "chair",
  "src": "chair.png",
  "themes": ["*"]
}
```

```json
{
  "id": "cryopod",
  "src": "cryopod.png",
  "themes": ["starship"]
}
```

```json
{
  "id": "porthole",
  "src": "porthole.png",
  "themes": ["voyage", "train"]
}
```

### Tagging of the existing 18 sprites

| Sprite | Tags | Reasoning |
|-|-|-|
| chair | `['*']` | reads as a generic chair anywhere |
| armchair | `['*']` | same |
| sofa | `['*']` | same |
| bed | `['*']` | same (bunk in train/voyage, cryocot in starship) |
| table | `['*']` | same |
| dresser | `['*']` | same |
| rug | `['*']` | same |
| lamp | `['*']` | same |
| plant | `['manor', 'voyage', 'train', 'castle', 'hollow']` | feels off in plane / starship |
| bookshelf | `['manor', 'voyage', 'train', 'castle', 'hollow']` | bulky for plane, anachronistic for starship |
| painting | `['manor', 'voyage', 'train', 'castle', 'hollow']` | starship would render as 'viewscreen', a separate sprite |
| piano | `['manor', 'castle', 'hollow']` | grand piano reads strongly Victorian |
| mirror | `['manor', 'voyage', 'train', 'castle', 'hollow']` | not on a starship bridge |
| clock | `['manor', 'voyage', 'train', 'castle']` | standing clock is period-specific |
| fireplace | `['manor', 'castle']` | period / fantasy only |
| gramophone | `['manor']` | strongly Victorian |
| typewriter | `['manor']` | vintage office vibe |
| safe | `['manor', 'voyage', 'train', 'castle']` | period appropriate |

### Tile pattern tags

Tile patterns get the same treatment. Each pattern in
`js/decor.js` `TILE_PATTERNS` becomes an object with an `id` and a
`themes: string[]`.

| Pattern | Tags |
|-|-|
| solid | `['*']` |
| check | `['*']` |
| stripe-v | `['*']` |
| stripe-h | `['*']` |
| dots | `['*']` |
| diamond | `['*']` |
| square | `['*']` |
| wood | `['manor', 'voyage', 'train', 'castle', 'hollow']` |
| parquet | `['manor', 'voyage', 'hollow']` |
| herringbone | `['manor', 'voyage', 'train', 'castle', 'hollow']` |
| brick | `['manor', 'castle']` |
| marble | `['manor', 'voyage', 'castle']` |
| weave | `['manor', 'voyage', 'train', 'castle', 'hollow']` |
| hex | `['starship']` |

Schema change in `js/decor.js`:

```js
// Before
export const TILE_PATTERNS = ['solid', 'check', /* ... */];

// After
export const TILE_PATTERNS = [
  { id: 'solid',     themes: ['*'] },
  { id: 'check',     themes: ['*'] },
  // ...
  { id: 'hex',       themes: ['starship'] },
];

export function tilePatternsForTheme(theme) {
  return TILE_PATTERNS
    .filter(p => p.themes.includes('*') || p.themes.includes(theme))
    .map(p => p.id);
}
```

The pattern-roll picker uses `tilePatternsForTheme(lvl.theme)`. The
full list is still available to the editor as `TILE_PATTERNS.map(p
=> p.id)` for hand-overrides.

### Portrait manifest

In v1, portraits stay theme-agnostic. The manifest does NOT gain a
`themes` field. All 20 portraits are available to all themes.

This is a deliberate scope cut. If we later want themed casts (a
spacesuit-helmet variant of `char-04`, a sailor-cap variant), we
add the field and the `--theme` flag on `generate-portraits.js`.
That work lives in the polish phase, not in scaffolding.

## 5. Level model field

```json
{
  "id": "lvl_xxx",
  "name": "The Crimson Conservatory",
  "theme": "manor",
  ...
}
```

`normalizeLevel` in `js/decor.js` defaults `theme` to `'manor'` when
missing, which keeps every existing level (and every saved
localStorage payload) rendering identically.

The level export JSON gains the field, so a shared level carries
its theme to the recipient. The recipient's frontend already has
all themes' assets loaded; theme just affects rendering.

## 6. New asset list per pack

Concrete sprite work per phase. Existing sprite IDs in parens for
reference; only new sprite IDs are listed.

### Phase B, The Voyage (cruise liner)

New sprites: `porthole`, `deck-chair`, `life-ring`, `wheel`,
`anchor`, `lifeboat`.

New tile patterns: `deck-stripe` (alternating plank colors).

Reuses from core: chair, table, bed, dresser, rug, lamp, sofa,
mirror, clock, bookshelf, painting, safe.

### Phase C, Transport pack (train + plane shipped together)

New sprites:
- shared: `overhead-bin`, `beverage-cart`, `lavatory-door`
- train-specific: `berth`, `compartment-bench`, `coal-stove`,
  `lantern`, `telegraph`
- plane-specific: `airline-seat`, `cockpit-console`, `oxygen-mask`,
  `cloud-window` (a porthole variant; can technically reuse
  `porthole` with a different tile-pattern context, but a dedicated
  sprite reads cleaner)

New tile patterns: `carriage-stripe` (train carpet),
`cabin-carpet` (plane geometric).

### Phase D, Starship Detective

New sprites: `console`, `viewscreen`, `airlock`, `cryopod`,
`ladder`, `plasma-plant`, `service-drone`.

New tile patterns: `grate`, `deckplate`.

Reuses from core: bed, dresser, rug, lamp, sofa, chair, table.

### Phase E, Castle and Catacombs

New sprites: `torch`, `throne`, `banner`, `tapestry`,
`suit-of-armour`, `treasure-chest`.

New tile patterns: `stone`, `mossy-stone`.

Reuses from core: chair, table, bed, rug, lamp, mirror, fireplace
(re-tinted), piano.

### Phase F, The Hollow

New sprites: `mushroom-table`, `flower-vase`, `treehouse-ladder`,
`bunny-statue`, `candy-bowl`.

New tile patterns: `petal`, `leaf`.

Reuses from core: chair, table, bed, rug, lamp, sofa, painting,
piano.

## 7. Roller filtering rules

The pseudo-code for `rollRoom(roomId)` in `js/decor.js` changes
from:

```js
const f = furniture[Math.floor(Math.random() * furniture.length)];
```

to:

```js
const eligible = furniture.filter((f) =>
  !f.themes ||                       // legacy = all themes
  f.themes.includes('*') ||
  f.themes.includes(lvl.theme || 'manor')
);
if (eligible.length === 0) return;   // pathological case
const f = eligible[Math.floor(Math.random() * eligible.length)];
```

And similarly for `rollRoom`'s tile-pattern picker.

The `Roll all` button on the topbar uses the same path.

The author's full sprite picker (when in the Solution / Furniture
tool sub-mode, if we ship one) does NOT filter. Author can drop a
`cryopod` into a Manor level for a cross-theme remix. The theme is
guidance, not a hard rule.

## 8. Editor surface

A new dropdown in the level-metadata panel (next to the level
name) lets the author pick a theme:

```
[Theme: Gaslight Manor ▾]
```

Picking a new theme:
1. Updates `lvl.theme`.
2. Does NOT auto-rebuild the rooms' tile patterns or decorations.
   Switching themes is a *suggestion* for new rolls; existing
   placements stay where the author put them.
3. Optionally surfaces a one-click `🎲 Reroll for new theme`
   confirm that runs `rollAllRooms()` filtered to the new theme.

In Play mode the theme is read-only and just informs the rendering
(palette hints, etc.).

## 9. CSS palette per theme

CSS variables keyed by theme, applied to the grid root when the
active level has that theme:

```css
.grid[data-theme="manor"]    { --theme-tint: #8a7bc4; }
.grid[data-theme="voyage"]   { --theme-tint: #5e8db8; }
.grid[data-theme="starship"] { --theme-tint: #5a7a8a; }
.grid[data-theme="train"]    { --theme-tint: #8a5a3a; }
.grid[data-theme="plane"]    { --theme-tint: #7a8a9a; }
.grid[data-theme="castle"]   { --theme-tint: #6a5a4a; }
.grid[data-theme="hollow"]   { --theme-tint: #f8c8a8; }
```

`--theme-tint` is used for accent borders, the active-cell glow,
and any "this theme" affordance. Room colors stay per-room (the
existing `room.color` field). Tile patterns stay per-room. So the
theme tints the *frame* of the experience, not the *contents* of
each room.

## 10. Backward compatibility

- Every existing level gets `theme: 'manor'` via `normalizeLevel`
  on load. No saved-data migration script needed; the field
  appears the next time the level is touched.
- Every furniture sprite without `themes` is treated as
  `themes: ['*']` (universal). The existing flat manifest works
  without edits, the tagging gets added in Phase A.
- Every tile pattern without `themes` is treated the same way.
- `level.tilePattern` references are unchanged. Pattern IDs stay
  the same.

Old levels render byte-identically after the change.

## 11. Phasing

### Phase A, Scaffolding only (no new assets)

- Add `js/themes.js` with the theme registry above.
- `normalizeLevel` defaults `theme: 'manor'`.
- Furniture manifest gains `themes` tags on all 18 existing sprites
  (mostly `'*'`, the period-specific ones get manor-leaning lists).
- `TILE_PATTERNS` becomes an array of objects with `themes`.
- `rollRoom` filters by `lvl.theme`.
- Editor metadata panel gains a theme dropdown.
- Visual effect on the running game: zero. Every existing level
  stays on `manor` and still rolls every sprite it could before.
  This is the safe, demoable foothold for everything that follows.

### Phase B, Voyage pack

- 6 new voyage sprites + 1 tile pattern.
- 1 sample level (e.g. *Last Crossing of the Mariner*, the expert
  one sketched in earlier chats).
- Lands the first non-Manor pack end-to-end.

### Phase C, Transport pack (train + plane)

- 12 new sprites covering both, 2 new tile patterns.
- 2 sample levels: one train, one plane.
- This phase depends on the **rectangular-grid engine change**
  (separate planning thread). Train + plane both want long-thin
  grids. Phase C is gated on that landing first.

### Phase D, Starship Detective

- 7 new sprites, 2 new tile patterns.
- 1 sample level (the *Argo* cryopod case sketched earlier).

### Phase E, Castle and Catacombs

- 6 new sprites, 2 new tile patterns.
- 1 sample level.

### Phase F, The Hollow

- 5 new sprites, 2 new tile patterns.
- 1 sample level.

### Phase G (polish, optional)

- `--theme` flag on `scripts/generate-portraits.js` produces
  themed portrait variants.
- Theme picker on the start menu groups shipped samples by theme,
  with a Manor / Voyage / Starship / etc. tab strip (composes with
  the difficulty grouping from `multiplayer.md` section 9).

## 12. Interaction with other plans

- **Difficulty tiers** (PR #7, already merged-pending). Theme is
  orthogonal to difficulty. A level has both. The level picker
  groups by either or both depending on the active tab.
- **Multiplayer** (`multiplayer.md`). Shared levels carry their
  `theme` in the JSON; the recipient's frontend renders them with
  the right palette. No server-side schema change needed beyond
  what's already planned.
- **Special-character cards** (TBD, separate plan). Cards are
  theme-agnostic by design. Phantom, Bound Pair, Liar all work
  the same way in any pack. Card chip rendering may pick the
  theme tint for visual cohesion.
- **Rectangular grids** (TBD, separate plan). Required before
  Phase C (Transport pack). Manor and Voyage work fine on the
  current square grid; Train and Plane do not.
- **Multi-floor** (TBD, separate plan). Required to fully express
  Voyage (deck above + below) and Starship (engineering + bridge).
  Voyage in Phase B works on a single-floor approximation; full
  multi-deck cases come after Multi-floor lands.

## 13. Risks

- **Sprite drift across themes.** A "table" sprite that reads
  perfectly in a manor may read awkwardly in a starship galley.
  We accept this in v1 by tagging conservatively: when in doubt,
  drop the universal tag and add the sprite to specific themes
  only. We can always loosen later; tightening later breaks
  existing themed rolls.
- **Palette clashes.** Each room has its own color independent of
  the theme. A magenta room in a starship level will read off.
  Mitigation: the editor surfaces theme-appropriate palette
  hints, but doesn't constrain. A future enhancement is a
  "Reset palette" button that snaps the whole house to the
  theme's recommended palette.
- **Manifest editing fatigue.** Each new sprite needs a manifest
  edit and a theme assignment. Mitigation: the generator script
  (`scripts/generate-furniture.js`) writes the manifest, so the
  `themes` field is added per sprite as the script emits it. No
  hand-editing JSON.
- **Cross-theme sprite reuse.** A `bookshelf` we tag for both
  manor and castle might look great in manor and weird in
  castle. The tag is the author's promise that the sprite works
  in that theme. If a single sprite stops working for a theme
  later, we can re-tag without re-rendering the sprite.

## 14. Things to NOT change

- **No build step.** Manifests stay JSON; modules stay vanilla
  ESM; no bundler. The theme registry is a plain JS module.
- **No frontend framework.** Theme dropdowns and palette hints
  use the same DOM patterns the rest of the editor uses.
- **No per-theme code paths.** Theme is data, not code. Every
  feature (roller, editor, picker) reads `lvl.theme` and filters
  manifests by it. There is no `if (theme === 'starship')`
  anywhere in the rendering pipeline; instead the pattern is
  `if (allowedInTheme(sprite, theme))`.
- **No mandatory theme.** Backward compatibility requires that
  every existing level renders identically. The default is
  `manor` and the default sprite tag is `'*'`, so existing levels
  see no change.

## 15. Open questions

These don't block Phase A. Surface and resolve when their phase
starts.

1. **Theme picker placement** in the editor: next to the level
   name (cramped on mobile), or as a dedicated row in the metadata
   panel (cleaner but more chrome)? Default: dedicated row.
2. **Mixed-theme levels in the sample library.** If we ship a
   "Haunted Starship" sample, what theme does it carry, `starship`
   or `manor` or a future `haunted-starship`? Recommendation:
   pick the primary, hand-place the foreign sprites. No new theme.
3. **Custom themes from players?** If a player can declare their
   own theme on a shared level, we'd need to either reject
   unknown themes (fall back to `manor`) or accept and render
   with default palette. Phase B+ concern, not now.

---

End of plan. Phase A is the safe scaffolding foothold; it lands
without any visual change to the running game. The first themed
pack (Voyage) is the vertical-slice test that the system actually
works end-to-end.
