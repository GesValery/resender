# resender

A dead-simple CSV proxy. It fetches a URL you give it and pipes the response straight back as CSV. Built to front the Finviz Elite export API, but works with any http/https URL.

## Endpoints

### `GET /health`
Returns `{ "status": "ok", "uptime": <seconds> }`.

### `POST /resend`
Fetches the given `url` and returns its body as `text/csv`.

`url` can be passed as a query param, a JSON body field, or a form field.

```bash
# query param
curl -X POST "http://localhost:3000/resend?url=https://elite.finviz.com/export?...&auth=YOUR_TOKEN"

# JSON body
curl -X POST http://localhost:3000/resend \
  -H "Content-Type: application/json" \
  -d '{"url":"https://elite.finviz.com/export?...&auth=YOUR_TOKEN"}'
```

> Note: when passing the URL as a query param, the upstream URL's own `&` separators
> need to be URL-encoded, otherwise they get parsed as params of `/resend`.
> Passing it in the JSON body avoids that entirely.

## Run locally

```bash
npm install
npm start
```

Listens on `PORT` (default `3000`).

## Deploy on Render

The repo includes `render.yaml`. Either:

- **Blueprint**: in Render, New → Blueprint, point it at this repo. It picks up `render.yaml` automatically.
- **Manual**: New → Web Service, Build Command `npm install`, Start Command `npm start`, Health Check Path `/health`.
