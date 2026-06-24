# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A minimal CSV proxy ("resender"). A single Express server (`server.js`) that fetches a caller-supplied URL and pipes the response body straight back as `text/csv`. Built to front the Finviz Elite export API but works with any http/https URL. Deployed on Render via `render.yaml`.

## Commands

```bash
npm install      # install deps (express only)
npm start        # run the server (node server.js), listens on $PORT or 3000
```

There is no build step, linter, or test suite. To verify changes, run the server and curl the endpoints:

```bash
curl -s http://localhost:3000/health
curl -s -X POST http://localhost:3000/resend \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/data.csv"}'
```

## Architecture

The entire app is `server.js` (ES modules, `"type": "module"`). Two endpoints:

- `GET /health` — liveness check; also wired as Render's `healthCheckPath`.
- `POST /resend` — reads `url` from query string, JSON body, or form body; validates it's http/https; fetches via Node's built-in `fetch`; returns the body as `text/csv`. Upstream non-2xx responses (including Finviz `429`) are faithfully forwarded with their status code.

## Key design constraints

- **Pure pass-through, no throttling.** The proxy does not rate-limit. Callers are responsible for spacing requests. Finviz's export API limits to ~1 req/sec per token and also penalizes bursts — expect `429`s on rapid successive calls. This was a deliberate choice; do not add server-side throttling without confirming with the user.
- **No extra HTTP deps.** Uses the built-in `fetch` (requires Node ≥18, pinned to Node 20 on Render). Keep it dependency-light.
- **Query-param `url` caveat.** When the upstream URL is passed as a `?url=` query param, its own `&` separators collide with `/resend`'s param parsing. Prefer passing `url` in the JSON body; encode it if using the query string.

## Deploy

`render.yaml` is a Render Blueprint (free plan, Node 20, build `npm install`, start `npm start`, health check `/health`). Remote: `https://github.com/GesValery/resender`. Free plan sleeps after ~15 min idle (cold start ~30–60s).
