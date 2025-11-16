import express from "express";
import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";

const PORT   = process.env.PORT || 8000;
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const MAX_BYTES = 5 * 1024 * 1024; // ~5MB

const SUPA_URL    = process.env.EXPO_PUBLIC_SUPABASE_URL    || process.env.SUPABASE_URL    || "";
const SUPA_ANON   = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const SUPA_ROLE   = process.env.SUPABASE_SERVICE_ROLE || ""; // <-- service role if available

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/ready", (_req, res) => res.json({ ok: true, region: REGION }));

function isSupabase(url) {
  try { return new URL(url).hostname.endsWith(".supabase.co"); }
  catch { return false; }
}

function ensureDownloadParam(u) {
  try {
    const parsed = new URL(u);
    if (parsed.hostname.endsWith(".supabase.co") &&
        parsed.pathname.includes("/storage/v1/object/public/")) {
      if (!parsed.searchParams.has("download")) parsed.searchParams.set("download", "1");
    }
    return parsed.toString();
  } catch { return u; }
}

function buildFetchHeaders(url) {
  const h = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "image/*",
    "Cache-Control": "no-cache",
    "Range": "bytes=0-",
  };
  // For direct public fetches, anon headers sometimes help; signed URLs won't need them.
  if (isSupabase(url) && SUPA_ANON && !url.includes("/object/sign/")) {
    h["apikey"] = SUPA_ANON;
    h["Authorization"] = `Bearer ${SUPA_ANON}`;
  }
  return h;
}

function parsePublicStoragePath(u) {
  try {
    const url = new URL(u);
    const ix = url.pathname.indexOf("/storage/v1/object/public/");
    if (ix < 0) return null;
    const rest = url.pathname.slice(ix + "/storage/v1/object/public/".length);
    const [bucket, ...parts] = rest.split("/");
    const objectPath = parts.join("/");
    if (!bucket || !objectPath) return null;
    return { bucket, objectPath };
  } catch { return null; }
}

async function signSupabaseUrl(origUrl) {
  if (!SUPA_URL) return null;
  const parsed = parsePublicStoragePath(origUrl);
  if (!parsed) return null;

  const signEndpoint = `${SUPA_URL}/storage/v1/object/sign/${encodeURIComponent(parsed.bucket)}/${encodeURIComponent(parsed.objectPath)}`;
  const body = JSON.stringify({ expiresIn: 60, download: true });

  // Prefer service role; fallback to anon (often blocked)
  const key = SUPA_ROLE || SUPA_ANON;
  if (!key) return null;

  const r = await fetch(signEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
    body
  });
  if (!r.ok) return null;

  const j = await r.json().catch(() => null);
  const signedURL = j?.signedURL;
  if (!signedURL) return null;
  return signedURL.startsWith("http") ? signedURL : `${SUPA_URL}${signedURL}`;
}

async function fetchImageBuffer(url) {
  // Attempt 1: direct fetch (with download=1) using anon headers
  let u = ensureDownloadParam(url);
  let r = await fetch(u, { method: "GET", redirect: "follow", headers: buildFetchHeaders(u) });

  // If blocked and this is a Supabase URL, try a short-lived signed URL (requires service role)
  if (!r.ok && (r.status === 400 || r.status === 403) && isSupabase(u)) {
    const signed = await signSupabaseUrl(u);
    if (signed) {
      u = signed;
      r = await fetch(u, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*", "Cache-Control": "no-cache", "Range": "bytes=0-" }
      });
    }
  }
  if (!r.ok) return { ok: false, status: r.status, buf: null };

  let received = 0;
  const chunks = [];
  if (r.body?.getReader) {
    const reader = r.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > MAX_BYTES) return { ok: false, status: 413, buf: null };
      chunks.push(value);
    }
  }
  const buf = chunks.length ? Buffer.concat(chunks) : Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_BYTES) return { ok: false, status: 413, buf: null };
  return { ok: true, status: 200, buf };
}

app.get("/moderate", async (req, res) => {
  const started = Date.now();
  const min = Number(req.query.min || 80);
  const url = String(req.query.url || "");
  try {
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Provide ?url=http(s)://...&min=60" });
    }

    const result = await fetchImageBuffer(url);
    if (!result.ok) {
      const ms = Date.now() - started;
      console.log(`[moderate] ${result.status} fetch url=${url} ms=${ms}`);
      const code = result.status === 413 ? 413 : 400;
      return res.status(code).json({ error: `Fetch failed: ${result.status}` });
    }

    const client = new RekognitionClient({ region: REGION });
    const out = await client.send(new DetectModerationLabelsCommand({
      Image: { Bytes: result.buf },
      MinConfidence: min
    }));

    const labels = out.ModerationLabels || [];

    const forbiddenParents = new Set([
      "explicit nudity",
      "sexual activity",
      "sexual content",
      "graphic violence or physical injury"
    ]);

    const forbiddenNames = new Set([
      "explicit nudity",
      "sexual activity",
      "sexual content",
      "graphic violence",
      "graphic violence or physical injury",
      "self harm"
    ]);

    const blocked = labels.filter((l) => {
      const parent = (l.ParentName || "").toLowerCase();
      const name = (l.Name || "").toLowerCase();
      const conf = (l.Confidence || 0);

      // Ignore low/moderate confidence labels
      if (conf < 95) return false;

      if (forbiddenParents.has(parent)) return true;
      if (forbiddenNames.has(name)) return true;
      return false;
    });

    const pass = blocked.length === 0;
    const ms = Date.now() - started;
    console.log(`[moderate] ${pass ? "PASS" : "FAIL"} bytes=${result.buf.length} min=${min} labels=${labels.length} blocked=${blocked.length} ms=${ms}`);
    return res.json({ pass, min, labels, blocked, model: out.ModerationModelVersion, bytes: result.buf.length });
  } catch (err) {
    const ms = Date.now() - started;
    console.log(`[moderate] 500 err="${String(err && err.message || err)}" ms=${ms} url=${url}`);
    return res.status(500).json({ error: String(err && err.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`[moderation] listening on :${PORT} (region=${REGION})`);
});
