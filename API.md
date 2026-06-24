# Resender API

A minimal CSV proxy. You give it a URL, it fetches that URL and returns the response body as CSV. Built to front the Finviz Elite export API, but works with any `http`/`https` URL.

**Base URL:** `https://resender-2jaf.onrender.com`

> ⚠️ Hosted on Render's free plan: after ~15 minutes idle the service sleeps, so the first request after idle may take **30–60s** to cold-start. Subsequent requests are fast.

---

## `GET /health`

Liveness check.

**Request**

```bash
curl https://resender-2jaf.onrender.com/health
```

**Response** — `200 OK`

```json
{ "status": "ok", "uptime": 58.91 }
```

| Field    | Type   | Description                          |
|----------|--------|--------------------------------------|
| `status` | string | Always `"ok"` when the service is up |
| `uptime` | number | Process uptime in seconds            |

---

## `POST /resend`

Fetches the given `url` and returns its body as `text/csv`.

### Parameters

| Name  | Required | Where                                      | Description                          |
|-------|----------|--------------------------------------------|--------------------------------------|
| `url` | yes      | JSON body, form body, **or** query string  | The `http`/`https` URL to fetch      |

The `url` can be supplied three ways. **Passing it in the JSON body is recommended** — see the caveat below.

### Response

- **Success:** `200 OK`, `Content-Type: text/csv; charset=utf-8`, body is the raw CSV from the upstream URL.
- **Headers:** also sets `Content-Disposition: attachment; filename="export.csv"`.

### Errors

| Status | Body                                          | Cause                                              |
|--------|-----------------------------------------------|----------------------------------------------------|
| `400`  | `{"error":"Missing 'url' param"}`             | No `url` supplied                                  |
| `400`  | `{"error":"Invalid 'url' param"}`             | `url` is not a parseable URL                       |
| `400`  | `{"error":"Only http/https URLs are allowed"}`| `url` uses a non-http(s) protocol                  |
| `<upstream>` | `{"error":"Upstream responded with <code>"}` | The target URL returned a non-2xx status (forwarded verbatim) |
| `502`  | `{"error":"Failed to fetch upstream","detail":"..."}` | Network error reaching the target URL      |

> **No throttling.** The proxy is a pure pass-through — it does not rate-limit. The Finviz Elite export API allows ~1 request/second per token and also penalizes bursts; rapid successive calls will be answered with a forwarded `429`. **Space your requests at least 2 seconds apart.**

---

## Examples

### Recommended: `url` in the JSON body

```bash
curl -X POST https://resender-2jaf.onrender.com/resend \
  -H "Content-Type: application/json" \
  -d '{"url":"https://elite.finviz.com/export?f=ind_stocksonly,cap_midover,sh_price_1to,sh_curvol_o100,sh_relvol_o1,ta_change_u2,ta_highlow20d_nh,tad_0_vwap::vwap:i1&o=-change&ft=4&p=i1&v=152&c=1,24,25,42,43,49,60,63,67,65,66,87,88,90,91,92,93,94,134,137,150&auth=YOUR_TOKEN"}'
```

### Form body

```bash
curl -X POST https://resender-2jaf.onrender.com/resend \
  --data-urlencode "url=https://elite.finviz.com/export?...&auth=YOUR_TOKEN"
```

### Query string (mind the caveat)

```bash
curl -X POST "https://resender-2jaf.onrender.com/resend?url=https%3A%2F%2Felite.finviz.com%2Fexport%3F...%26auth%3DYOUR_TOKEN"
```

### Sample response

```csv
"Ticker","Shares Outstanding","Shares Float","Performance (Week)","Performance (Month)","Average True Range","Change from Open","Average Volume","Volume","Price","Change","High","Low","Performance (1 Minute)","Performance (2 Minutes)","Performance (3 Minutes)","Performance (5 Minutes)","Performance (10 Minutes)","52-Week Range","News Title","Daily Digest"
"AAPL",15334000000,15300000000,1.20%,3.45%,2.31,0.85%,55000000,12000000,201.50,1.10%,202.00,199.80,0.05%,0.10%,0.12%,0.20%,0.35%,"164.08 - 237.49","...","..."
```

If the screen matches no rows, you'll still get the header line and a `200` — that's expected, not an error.

---

## Caveat: passing `url` in the query string

When `url` is sent as a `?url=` query parameter, the upstream URL's own `&` separators collide with the proxy's query parsing — everything after the first `&` gets parsed as separate params of `/resend` and is dropped. To use the query string you must **URL-encode** the entire `url` value (encode `&` as `%26`, `?` as `%3F`, etc.).

Passing `url` in the JSON body avoids this entirely and is the recommended approach.
