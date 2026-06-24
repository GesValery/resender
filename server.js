import express from "express";

const app = express();

// Accept JSON and form bodies so `url` can be passed in the body too.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Resend: POST with a `url` param (query, JSON body, or form body).
// Fetches that URL and pipes the response back as CSV.
app.post("/resend", async (req, res) => {
  const url = req.query.url || req.body?.url;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' param" });
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid 'url' param" });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return res.status(400).json({ error: "Only http/https URLs are allowed" });
  }

  try {
    const upstream = await fetch(target, { redirect: "follow" });

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `Upstream responded with ${upstream.status}` });
    }

    const body = await upstream.text();

    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", 'attachment; filename="export.csv"');
    res.send(body);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch upstream", detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`resender listening on port ${PORT}`);
});
