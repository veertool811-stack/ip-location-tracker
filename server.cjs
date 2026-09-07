const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-this-key";

app.use(express.json());
app.use(express.static("public"));

const visits = [];

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  let ip = forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;
  if (ip === "::1") ip = "127.0.0.1";
  if (ip && ip.startsWith("::ffff:")) ip = ip.slice(7);
  return ip;
}

async function lookupIp(ip) {
  // Public IP geolocation service; this is approximate, not GPS.
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
    if (!r.ok) throw new Error("geo lookup failed");
    const d = await r.json();
    if (!d.success) throw new Error("geo lookup unsuccessful");
    return {
      city: d.city || "Unknown",
      region: d.region || "Unknown",
      country: d.country || "Unknown",
      country_code: d.country_code || "",
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      isp: d.connection?.isp || "Unknown"
    };
  } catch {
    return {
      city: "Unknown", region: "Unknown", country: "Unknown",
      country_code: "", latitude: null, longitude: null, isp: "Unknown"
    };
  }
}

app.get("/t/:id", async (req, res) => {
  const ip = clientIp(req);
  const geo = await lookupIp(ip);

  visits.unshift({
    id: crypto.randomUUID(),
    linkId: req.params.id,
    time: new Date().toISOString(),
    ip,
    ...geo,
    userAgent: req.get("user-agent") || ""
  });

  // Redirect to a neutral page after recording the visit.
  res.redirect("/visited.html");
});

app.post("/api/gps", (req, res) => {
  const { id, latitude, longitude, accuracy } = req.body || {};
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ error: "Invalid GPS data" });
  }
  visits.unshift({
    id: crypto.randomUUID(),
    linkId: id || "unknown",
    time: new Date().toISOString(),
    ip: clientIp(req),
    city: "GPS",
    region: "",
    country: "",
    country_code: "",
    latitude,
    longitude,
    accuracy: typeof accuracy === "number" ? accuracy : null,
    isp: "GPS location shared with permission",
    userAgent: req.get("user-agent") || ""
  });
  res.json({ ok: true });
});

app.get("/api/visits", (req, res) => {
  if (req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(visits.slice(0, 200));
});

app.delete("/api/visits", (req, res) => {
  if (req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  visits.length = 0;
  res.json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`IP location tracker running on http://localhost:${PORT}`);
});