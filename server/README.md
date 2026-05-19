# Murdoku companion API

Small Express + sqlite service that backs profile claiming, level
sharing, leaderboards, sessions, and the admin dashboard. Deployed on
Fly.io. Data lives on a persistent volume so the database survives
machine restarts.

## Phase 12 ships

- `POST /profiles { name, token }`, register or re-claim a profile
- `GET /profiles/me`, whoami (bearer-token auth)
- `GET /healthz`, liveness probe
- `GET /admin`, basic-auth gated minimal overview

Subsequent phases add level sharing (13), completions and leaderboards
(14), sessions (15), and the full admin views.

## Local development

```
cd server
npm install
SERVER_SALT="$(openssl rand -hex 32)" \
ADMIN_USER=admin ADMIN_PASSWORD=admin \
DATABASE_PATH=./murdoku.db \
PORT=8080 \
npm run dev
```

Then in another shell:

```
curl http://localhost:8080/healthz
```

The frontend defaults to `https://murdoku-companion-api.fly.dev` via
the `<meta name="murdoku-api-base">` tag in `index.html`. To point at
a local API during development, change that meta value.

## One-time Fly bootstrap

`fly.toml` covers app config but the app, volume, and secrets need to
exist before the first deploy. Run these once locally with the
`flyctl` CLI:

```
fly apps create murdoku-companion-api
fly volumes create murdoku_data --size 1 --region iad
fly secrets set SERVER_SALT="$(openssl rand -hex 32)"
fly secrets set ADMIN_USER=admin ADMIN_PASSWORD="$(openssl rand -hex 16)"
```

The `SERVER_SALT` value must never change once set; rotating it
invalidates every existing client token.

## Continuous deploy

`.github/workflows/deploy.yml` runs `flyctl deploy` on every push,
using the `FLY_API_TOKEN` repo secret. The job uses the same trigger
as the GitHub Pages frontend deploy and runs in parallel.

## Schema notes

The `profiles` table stores `sha256(token + SERVER_SALT)`, never the
raw token. Tokens are 32 random bytes generated client-side and
persisted in the player's `localStorage` so they can sign back in to
their profile after signing out. Rotating `SERVER_SALT` orphans every
client; do not change it unless you intend to wipe the database.
