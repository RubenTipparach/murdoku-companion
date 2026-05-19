# Murdoku, Multiplayer & Server Integration

A plan for adding profiles, level sharing, leaderboards, playtime
tracking, and an admin dashboard, while preserving the current "pure
static site, no build step" property of the existing app.

Status: planning only. No code yet.

---

## 1. Goals

- **Mandatory profiles.** Every player picks a unique name before
  they can play anything, sample or shared.
- **Share custom levels** via a short URL containing a 6-character
  code. Visiting the URL adds the level to the visitor's library
  under "User games".
- **Leaderboards per level.** See who has completed each level, when,
  and (optionally) how fast.
- **Social discovery in-game.** On a level card, see which other
  players have completed it.
- **Server dashboard for the operator.** Logins, playtime per level
  and overall, completions per player, recent shares.
- **Reorganised start menu.** Profile selector pinned at the top.
  Levels grouped by difficulty. Filterable by "New" vs "Finished".

## 2. Non-goals (v1)

- No realtime / co-op play. No WebSocket presence. REST + polling only.
- No accounts in the email/password sense, no recovery flow beyond a
  device-token recovery code.
- No comments, ratings, friends list, or chat.
- No moderation tools beyond admin delete + ban.
- No analytics SDK, no third-party telemetry. The dashboard reads
  only what the API itself records.

## 3. Hosting architecture

**Recommendation: Fly.io for the API, GH Pages keeps the frontend.**

Reasoning:
- The frontend is already a pure static site (ES modules, no build
  step). Keeping it on GH Pages preserves the "no framework, no
  bundler" rule in CLAUDE.md and the existing zero-touch deploy.
- Fly.io gives us a single long-running Node process, a persistent
  volume for sqlite, free-tier covers a hobby app, and the option to
  add WebSockets later without rearchitecting.
- Vercel was considered. It's cheaper to start (free tier is roomy)
  but serverless functions and cold starts complicate the simple
  REST + sqlite design. The "always-on small Node + sqlite" pattern
  is a better fit for the volume we expect.

Topology:

```
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ GH Pages                     │         │ Fly.io app: murdoku-api     │
│ static/ESM frontend          │  HTTPS  │   Node + Express             │
│ index.html, js/*, css/*      │ <-----> │   better-sqlite3             │
│ playable offline             │  CORS   │   volume: /data/murdoku.db   │
│                              │         │   admin.html (server-rendered)│
└──────────────────────────────┘         └──────────────────────────────┘
```

CORS: API allows the GH Pages origin and `http://localhost:*` for dev.

Frontend fail-soft: if `API_BASE_URL` is unset or the API is
unreachable, the app falls back to local-only mode and disables the
profile-gated features (sharing, leaderboards, dashboard sync). Solo
local play continues to work as it does today. The profile-mandatory
rule applies only when API access is available, otherwise the user
sees a "server unreachable" banner with a Retry button.

## 4. Profile system

### Identity model

A profile is `{ name, token }`.

- `name`: 3-20 chars, `[a-zA-Z0-9_-]`. Case-insensitive uniqueness on
  the server. Displayed with the case the user typed.
- `token`: 32 random bytes, base64url-encoded, generated client-side
  on profile creation. Stored in `localStorage` under
  `murdoku.profile`.
- The server stores `sha256(token + server_salt)` per profile and
  uses it to authenticate subsequent requests via an
  `Authorization: Bearer <token>` header.

First-come-first-served. Names cannot be renamed (so leaderboards
can't be scrubbed by a username swap). Reserved names: `admin`,
`system`, `anonymous`, `guest`, `murdoku`.

### Cross-device

A profile is bound to a device by its token. To use the same profile
on another device, the player views their "Recovery code" on the
profile page (which is the token, displayed as a short word-pair
phrase like `viper-orchid-83`) and types it on the new device. The
new device fetches the profile by name, verifies the token, and
stores both locally.

If the player loses the token and the device, the profile is
unrecoverable. We display a one-time-only "save your recovery code"
prompt on creation.

### Mandatory pickup

Before any level loads, the start menu's first row is the profile
selector. Three states:

- **No profile on this device.** "Create a profile" form: name input,
  Submit. On success the recovery code is shown once.
- **Profile present, server reachable.** Shows the active name with
  a "Switch profile" dropdown (lets the user sign out, create
  another, or restore from a recovery code).
- **Profile present, server unreachable.** Shows the name dimmed
  with a "Server unreachable" tag and a Retry button. The user can
  still play local samples; sharing and leaderboards are disabled.

This is the only gate in the menu. Once a profile is active the
existing menu cards (samples, continue, edit-mode entry) appear
below it.

## 5. Level sharing

### Share code

When a player clicks **Share** on a non-sample level they authored:

1. Frontend `POST /levels { name, difficulty, level_json }` with the
   profile's bearer token.
2. Server validates (size limit 32 KB after gzip; structure check;
   author throttle, 1 share per minute), assigns a 6-char base64url
   code (alphabet `A-Za-z0-9_-`, 64^6 ~= 68 billion combinations,
   collision-resolved by retry on insert), inserts a row, returns
   `{ code, url }`.
3. Frontend shows a copyable share URL: `https://<host>/?play=<code>`.

### Visit flow

When a URL with `?play=<code>` is opened:

1. Frontend extracts the code, requires a profile (sends user
   through profile-create if they don't have one yet).
2. `GET /levels/<code>` returns `{ name, difficulty, level_json,
   author_name, plays, completions }`.
3. Frontend marks the level `isShared: true, shareCode: code,
   authorName: ...`, adds it to the local library under "User
   games", and switches to play mode on the new level.
4. Frontend pings `POST /levels/<code>/plays` (idempotent per
   profile, the server only counts the first play per
   profile-level pair).

### Library buckets

The local library now has three buckets in the menu:

- **Samples** (shipped), read-only, cloneable.
- **Your levels** (`isSample: false, isShared: false`), authored
  locally. Each has a Share button.
- **User games** (`isShared: true`), fetched via share code. Read-
  only, cloneable.

## 6. Completions and leaderboards

### Completion event

On Check-solution success the frontend POSTs:

```
POST /completions
{
  levelKey: "sample:lvl_sample_conservatory"   // shipped sample
        |   "shared:a3F9_b"                    // shared level
        |   "local:lvl_xxxx",                   // self-authored, not posted
  durationMs: 184320
}
```

Server upsert keyed by `(profile_id, level_key)`. Only the first
completion counts; the row stores `completed_at` and the best
`duration_ms` (allows future leaderboards by speed).

Self-authored unshared levels never post; the leaderboard is for
shared content only.

### Leaderboard view

`GET /levels/:code/leaderboard` returns the recent N completions
sorted by completed_at desc, plus totals. Frontend renders a small
panel on the level card with the first few names and a "Show all" CTA.

For shipped samples, leaderboard is per-sample-key, fetched on
demand when the player opens that sample's case file:
`GET /samples/:key/leaderboard`.

### Social marks on level cards

Each level card in the menu carries badges:

- ✅ "Completed by you on YYYY-MM-DD"
- 👥 "23 others have solved this" (cached count, refreshed on menu open)

Optionally we can show a short avatar strip of 3-5 most recent
solvers. Avatar = procgen portrait keyed by the profile name's
hash. Stretch goal, not v1.

## 7. Session tracking and playtime

We want playtime per profile, per level, and overall. Granular
enough to surface in the dashboard, lightweight enough that we don't
ship a tracking library.

### Mechanism

Frontend uses the Page Visibility API to start, heartbeat, and end
sessions:

- On entering a level (sample, shared, or local), `POST /sessions/start
  { levelKey }` returns `{ sessionId }`.
- While the tab is visible, `POST /sessions/heartbeat { sessionId }`
  every 30 seconds.
- On `visibilitychange` to hidden, on level switch, or on `unload`,
  `POST /sessions/end { sessionId }` (with `navigator.sendBeacon`).

Server-side, a session is `{ id, profile_id, level_key, started_at,
last_heartbeat_at, ended_at }`. Playtime per session = `(ended_at OR
last_heartbeat_at) - started_at`. Sessions older than 24h with no
end event get force-closed at the heartbeat time by a daily cron.

Aggregate views:

- **Per profile**: SUM(duration) GROUP BY profile_id
- **Per level**: SUM(duration) GROUP BY level_key
- **Per profile per level**: SUM(duration) GROUP BY profile_id, level_key
- **Daily activity** for graphing: SUM(duration) GROUP BY date(started_at)

### Privacy

We do NOT store IPs in the sessions table. Rate limiting uses an
in-memory IP bucket on the API process; nothing persisted.

## 8. Admin dashboard

A small server-rendered page at `/admin` on the Fly.io app.
Auth: basic-auth via `ADMIN_USER` and `ADMIN_PASSWORD` env vars,
TLS-only.

Views:

- **Overview**, total profiles, total levels shared, total
  completions, daily playtime sparkline (last 30 days).
- **Profiles**, paginated table: name, created, last seen, levels
  authored, levels completed, total playtime. Click into a profile
  for per-level breakdown.
- **Levels**, paginated table: code, name, author, difficulty,
  plays, completions, average solve time. Click in for the per-
  profile completion list and the level JSON.
- **Activity**, recent events stream: profile creations, shares,
  completions. Useful for spotting abuse.
- **Actions**, delete a shared level (404s any future visits to
  its code), ban a profile (soft-deletes, blanks the name on
  leaderboards).

Stack: same Express server, server-rendered HTML via tagged template
literals (no template engine dependency). Charts via inline SVG, no
chart library.

## 9. Start menu reorganisation

Mockup of the new start menu in priority order, top to bottom:

```
┌──────────────────────────────────────────────────────────┐
│  PROFILE                                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Signed in as @reuben    [switch] [recovery code]   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  CONTINUE                                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ↻  The Atelier                            [TRICKY] │  │
│  │    Last edited 2 hours ago                         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  LEVELS                                                  │
│  [All] [New] [Finished] [User games]      sort: difficulty │
│                                                          │
│  TUTORIAL                                                │
│   🔍 The Crimson Conservatory                  [TUTORIAL]│
│      Lady Wraithmoor is dead among her orchids…         │
│      👥 142 solvers                                      │
│                                                          │
│  GENTLE                                                  │
│   🔍 Tea and Treachery                          [GENTLE] │
│   ✅ Midnight at the Lighthouse                 [GENTLE] │
│   ✅ Ferns and Felonies                         [GENTLE] │
│                                                          │
│  STANDARD                                                │
│   ...                                                    │
│                                                          │
│  TRICKY                                                  │
│   ...                                                    │
│                                                          │
│  YOUR LEVELS                                             │
│   + New level                                            │
│   ✏ Untitled (draft)                            [share]  │
│   ✏ The Locked Conservatory                     [share]  │
│                                                          │
│  USER GAMES (from share codes)                           │
│   🔗 Crime at the Cliffside        by @alex      [GENTLE]│
│                                                          │
│  [❓ How to play]                        [⚠ Reset data] │
└──────────────────────────────────────────────────────────┘
```

### Grouping rules

- **Profile** is always row 1, full-width, sticky to the top of the
  scroll area.
- **Continue** appears only if there's an active level to resume.
- **Levels** section is the shipped sample library. Filter tabs:
  - `All`, every shipped sample
  - `New`, completed_by_me == false
  - `Finished`, completed_by_me == true
  - `User games`, switches the section to the shared library view
- Always grouped by difficulty headers in this order:
  `tutorial -> gentle -> standard -> tricky -> expert -> fiendish`.
  Empty groups are hidden.
- Sort within a difficulty: tutorial-tier first, then by name
  alphabetical. Difficulty sort is the default and only sort for v1.
- **Your levels** is the local-authored bucket. Has a "+ New level"
  card at top, and per-level Share button.
- **User games** is the third library (shared-with-me).

### Card content

Every level card shows:

- Status icon (🔍 unplayed, ↻ in progress, ✅ completed, ✏ authored,
  🔗 shared-with-me).
- Name + difficulty chip (existing affordance, expanded coverage).
- One-line description.
- Social row: "👥 N solvers" for any level that's seen at least one
  completion. "Completed by you Mar 12" if applicable.

## 10. Data model

sqlite, single file at `/data/murdoku.db` on the Fly volume.

```sql
CREATE TABLE profiles (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,            -- display case as typed
  name_lower   TEXT UNIQUE NOT NULL,     -- lower-case key
  token_hash   TEXT NOT NULL,            -- sha256(token + salt)
  created_at   INTEGER NOT NULL,         -- unix ms
  last_seen_at INTEGER NOT NULL,
  banned_at    INTEGER
);
CREATE INDEX idx_profiles_last_seen ON profiles(last_seen_at);

CREATE TABLE shared_levels (
  code         TEXT PRIMARY KEY,         -- 6-char base64url
  author_id    INTEGER NOT NULL REFERENCES profiles(id),
  name         TEXT NOT NULL,
  difficulty   TEXT,
  level_json   TEXT NOT NULL,            -- the full level
  created_at   INTEGER NOT NULL,
  deleted_at   INTEGER
);
CREATE INDEX idx_shared_levels_author ON shared_levels(author_id);

CREATE TABLE completions (
  profile_id   INTEGER NOT NULL REFERENCES profiles(id),
  level_key    TEXT NOT NULL,            -- "sample:<key>" or "shared:<code>"
  completed_at INTEGER NOT NULL,
  duration_ms  INTEGER,
  PRIMARY KEY (profile_id, level_key)
);
CREATE INDEX idx_completions_level ON completions(level_key);

CREATE TABLE plays (
  profile_id   INTEGER NOT NULL REFERENCES profiles(id),
  level_key    TEXT NOT NULL,
  first_at     INTEGER NOT NULL,
  PRIMARY KEY (profile_id, level_key)
);

CREATE TABLE sessions (
  id                INTEGER PRIMARY KEY,
  profile_id        INTEGER NOT NULL REFERENCES profiles(id),
  level_key         TEXT NOT NULL,
  started_at        INTEGER NOT NULL,
  last_heartbeat_at INTEGER NOT NULL,
  ended_at          INTEGER
);
CREATE INDEX idx_sessions_profile ON sessions(profile_id, started_at);
CREATE INDEX idx_sessions_level   ON sessions(level_key,  started_at);
```

`level_key` shape is the unified identifier across all leaderboard
endpoints. `sample:<sampleKey>` for shipped samples, `shared:<code>`
for user-shared levels. Local-only levels do not appear.

## 11. API surface

All routes return JSON. Bearer auth required unless marked public.

| Method | Path | Auth | Body / Query | Returns |
|-|-|-|-|-|
| POST | `/profiles` | none | `{name}` | `{id, name, token, recoveryCode}` |
| POST | `/profiles/login` | none | `{name, token}` | `{id, name}` |
| GET  | `/profiles/me` | bearer | | `{id, name, completions, levelsAuthored, totals}` |
| GET  | `/profiles/:name` | bearer | | `{name, completions[], levelsAuthored[]}` (public-ish) |
| POST | `/levels` | bearer | `{name, difficulty, level_json}` | `{code}` |
| GET  | `/levels/:code` | bearer | | `{code, name, difficulty, level_json, author, plays, completions}` |
| POST | `/levels/:code/plays` | bearer | | `{played: true}` (idempotent per profile) |
| GET  | `/levels/:code/leaderboard` | bearer | `?limit=20` | `[{name, completed_at, duration_ms}]` |
| GET  | `/samples/:key/leaderboard` | bearer | `?limit=20` | `[{name, completed_at, duration_ms}]` |
| POST | `/completions` | bearer | `{levelKey, durationMs}` | `{rank, total}` |
| POST | `/sessions/start` | bearer | `{levelKey}` | `{sessionId}` |
| POST | `/sessions/heartbeat` | bearer | `{sessionId}` | `{ok: true}` |
| POST | `/sessions/end` | bearer | `{sessionId}` | `{ok: true, durationMs}` |
| GET  | `/admin/...` | basic-auth | | various |

## 12. Frontend changes

Net-new modules:

- **`js/api.js`**, fetch wrapper around the API. Exposes
  `apiAvailable()`, `createProfile(name)`, `loginProfile(name,
  token)`, `shareLevel(level)`, `fetchSharedLevel(code)`,
  `postCompletion(levelKey, durationMs)`, `sessionStart/Heartbeat/End`,
  `getLeaderboard(levelKey)`, `getMyProfile()`.

- **`js/profile.js`**, profile state. `getActiveProfile()`,
  `signOut()`, `restoreFromRecoveryCode(name, code)`. Persists to
  `localStorage` under `murdoku.profile`.

- **`js/share.js`**, share-link parser. On boot, if
  `location.search` contains `?play=<code>`, fetch the level and add
  to library.

- **`js/sessions.js`**, heartbeat loop, page-visibility hooks.

Touched modules:

- **`js/state.js`**, gains `state.profile` and `state.libraryBuckets:
  { samples, authored, userGames }`.
- **`js/storage.js`**, new keys `murdoku.profile`,
  `murdoku.sharedLevels` (a code-keyed map of fetched shared levels).
- **`js/main.js`**, start menu overhaul, profile-gating, completion
  posting on win, share button on authored levels.
- **`js/decor.js` `normalizeLevel`**, accept `isShared`, `shareCode`,
  `authorName` fields.
- **`index.html` / `css/style.css`**, profile row, filter tabs,
  difficulty group headers, social row on level cards.

### `js/api.js` shape

```js
const API_BASE_URL = '<https url, configured per-deploy>';

let _token = null;

export function setToken(t) { _token = t; }

async function call(method, path, body) {
  const res = await fetch(API_BASE_URL + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(_token ? { authorization: 'Bearer ' + _token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new APIError(res.status, await res.text());
  return res.json();
}

export const createProfile     = (name)      => call('POST', '/profiles', { name });
export const loginProfile      = (name, tok) => call('POST', '/profiles/login', { name, token: tok });
// ... etc
```

Strictly no third-party dependencies in the frontend.

## 13. Privacy, rate limits, abuse

- **Public data**: profile names, completion records, shared levels.
- **Private data**: tokens (never sent to other clients), session
  timestamps (visible only to the profile owner via `/profiles/me`
  and to the admin).
- **No PII collected.** Make this explicit on the profile-creation
  modal: "Your name is public. Do not use your real name if you don't
  want it public."
- **Rate limits** (in-memory token buckets per IP):
  - Profile creation: 3 per IP per hour
  - Level share: 5 per profile per hour, 1 per minute
  - Completion post: 30 per profile per minute (catches replay spam)
  - Session start: 60 per profile per minute
- **Server-side validation**:
  - Level JSON must parse and pass `normalizeLevel`
  - Level JSON gzipped size <= 32 KB
  - Profile name regex `^[A-Za-z0-9_-]{3,20}$`, not in reserved list
- **Admin actions**: soft-delete (set `deleted_at`) so we can undo
  within 30 days, hard-delete via separate cron.

## 14. Build phases

Each phase is a runnable, demoable increment. None of them break
local-only play.

### Phase 11, Menu reorg + profile shell (frontend-only)

- Add the profile row to the start menu (local-only profile,
  `name` field). Mandatory before any "Play" action.
- Reorganise the menu per section 9: difficulty groups, filter tabs,
  Your levels and User games sections (User games is empty for now).
- No server. Sharing button disabled with a "Coming soon" tooltip.
- Tagging existing samples already done (PR #7).

### Phase 12, Server skeleton + profile sync

- Stand up the Fly.io app: Express, better-sqlite3, volume.
- Implement profiles endpoints + auth middleware.
- Frontend: upgrade the local profile row to talk to the API. Show
  "claim on server" if local profile exists but isn't synced.
- Add a `/admin` route with basic-auth and a placeholder Overview.

### Phase 13, Level sharing

- Implement `POST /levels`, `GET /levels/:code`,
  `POST /levels/:code/plays`.
- Frontend: Share button on authored levels, share modal with URL +
  copy button.
- `?play=<code>` URL handler that fetches and adds to library.
- "User games" section in the menu becomes live.

### Phase 14, Completions + leaderboards

- `POST /completions`, `GET /levels/:code/leaderboard`,
  `GET /samples/:key/leaderboard`.
- Frontend: post on Check-solution win. Render leaderboard preview
  on each level card. "Solver count" badge.

### Phase 15, Sessions + dashboard

- Sessions endpoints + heartbeat loop in the frontend.
- Admin dashboard fleshed out: Profiles, Levels, Activity, Actions.
- Daily cron to force-close stale sessions and prune deleted rows.

### Phase 16, Polish

- Procgen avatars keyed by name hash (reuses `generate-portraits.js`
  feature pool).
- Recovery-code restore on a new device.
- "Recent shares" feed on the start menu.
- (Stretch) Presence: see who else is online via a 60s heartbeat
  on `/profiles/me`.

## 15. Cost estimate

- **Fly.io**: 1 `shared-cpu-1x` machine in one region, 1 GB volume.
  Within the free allowance for hobby usage (~$0 in practice; ~$3-5
  per month if we leave the free tier).
- **DB**: sqlite on volume. 1 GB is more than enough for our
  expected scale.
- **Bandwidth**: minimal, no media.
- **Domain**: optional. The `murdoku.fly.dev` default works.

Total expected: **$0 to $5 per month** for the foreseeable future.

## 16. Open questions

These need a call before we start cutting code on Phase 11.

1. **Profile mandatory even for solo offline play?** The user
   directive says yes ("lets make profiles mandatory"). The plan
   above honours that but allows fail-soft when the server is
   unreachable. Confirm: if a player has no profile AND the server
   is unreachable, do we let them play samples anyway, or hard-gate
   them out?
2. **Recovery-code UX.** Show the raw token, or convert to a
   memorable word phrase (BIP39-style)? Word phrase is friendlier
   but adds a dependency-free wordlist file (~1 KB).
3. **Level name uniqueness on share?** I assumed no. Anyone can
   share a level called "The Crimson Conservatory". The share code
   disambiguates. Confirm.
4. **Per-device profile or per-account?** Above plan = per-account
   (the same profile usable on multiple devices via recovery code).
   Could alternatively bind one device per profile for stricter
   single-source-of-truth. Per-account is friendlier.
5. **Dashboard auth.** Basic-auth + ADMIN env vars is the minimum.
   If we want OAuth-via-GitHub for the admin route, add it in
   Phase 15.
6. **Avatars.** Procgen portraits keyed by name hash, or let the
   player pick from the 20 shipped portraits? Picking is friendlier;
   procgen is "infinite" but locks the player into a generated face
   they may not like.

## 17. Things to NOT change

The constraints below stay intact through every phase. If a feature
request would require breaking one, escalate.

- **Frontend is pure static, no build step, no framework.** ES
  modules and vanilla DOM only. `js/api.js` uses `fetch`, period.
- **Offline-first.** Local-only play must keep working when the API
  is down. Local levels never need a network round trip to be
  playable.
- **No third-party scripts on the frontend.** No analytics. No
  trackers. The dashboard's own server records everything we need.
- **No PII.** Names are public-facing. No email. No location. No
  device fingerprint.

---

End of plan. Implementation begins on Phase 11 once the open
questions in section 16 are resolved.
