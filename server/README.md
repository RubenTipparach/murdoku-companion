# Murdoku companion API

Small Express + sqlite service that backs profile claiming, level
sharing, leaderboards, and sessions. Deployed on Fly.io. Data lives on
a persistent volume so the database survives machine restarts.

## Phase 12 ships

- `POST /profiles { name, token }`, register or re-claim a profile
- `GET /profiles/me`, whoami (bearer-token auth)
- `GET /healthz`, liveness probe

Subsequent phases add level sharing (13), completions and leaderboards
(14), and sessions (15). An admin surface lands behind OAuth (no
password storage) when there's something worth showing.

## Local development

```
cd server
npm install
DATABASE_PATH=./murdoku.db PORT=8080 npm run dev
```

Then in another shell:

```
curl http://localhost:8080/healthz
```

The frontend defaults to `https://murdoku-companion.fly.dev` via
the `<meta name="murdoku-api-base">` tag in `index.html`. To point at
a local API during development, change that meta value.

## One-time Fly bootstrap

`fly.toml` covers app config. The app and its volume need to exist
before the first deploy; no secrets to configure.

```
fly apps create murdoku-companion
fly volumes create murdoku_data --size 1 --region ams
```

## Continuous deploy

`.github/workflows/deploy.yml` runs `flyctl deploy` on every push,
using the `FLY_API_TOKEN` repo secret. The job uses the same trigger
as the GitHub Pages frontend deploy and runs in parallel.

## Schema notes

The `profiles` table stores `sha256(token)`, never the raw token.
Tokens are 32 random bytes generated client-side and persisted in
the player's `localStorage` so they can sign back in to their profile
after signing out. With a 2^256 token space, an unsalted hash is
already infeasible to attack; if the sqlite file leaks the hashes are
not directly replayable as bearer credentials.
