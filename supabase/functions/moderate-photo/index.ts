/**
 * Supabase Edge Function: moderate-photo
 * - Pops one item from moderation_queue
 * - Creates a signed URL for post-photos/<storage_path>
 * - Calls AWS Rekognition DetectModerationLabels
 * - Approves or rejects; on approve inserts a NEW row into posts (no upsert)
 * - Writes an audit row
 *
 * Env required (set as Supabase function secrets):
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - REKOG_AWS_REGION
 *  - REKOG_AWS_ACCESS_KEY_ID
 *  - REKOG_AWS_SECRET_ACCESS_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
  type ModerationLabel
} from "npm:@aws-sdk/client-rekognition@3.637.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const rekog = new RekognitionClient({
  region: Deno.env.get("REKOG_AWS_REGION") || "us-east-1",
  credentials: {
    accessKeyId: Deno.env.get("REKOG_AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: Deno.env.get("REKOG_AWS_SECRET_ACCESS_KEY") || "",
  },
});

const BUCKET = "post-photos";
const EXPIRES = 120; // seconds

type QueueRow = {
  id: string;
  photo_id: string;
  storage_path: string;
};

async function nextQueueItem(): Promise<QueueRow | null> {
  const { data, error } = await supabase
    .from("moderation_queue")
    .select("id, photo_id, storage_path")
    .is("picked_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  await supabase
    .from("moderation_queue")
    .update({ picked_at: new Date().toISOString() })
    .eq("id", data.id);

  return data as QueueRow;
}

async function signedUrl(storage_path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storage_path, EXPIRES);
  if (error) return null;
  return data?.signedUrl ?? null;
}

function decide(labels: ModerationLabel[] = []) {
  const blockList = new Set([
    "Explicit Nudity",
    "Sexual Activity",
    "Sexual Situations",
    "Violence",
    "Hate Symbols",
  ]);
  let topHit: string | null = null;
  for (const l of labels) {
    const name = l.Name ?? "";
    const conf = l.Confidence ?? 0;
    if (blockList.has(name) && conf >= 85) {
      topHit = `${name} (${conf.toFixed(1)}%)`;
      break;
    }
  }
  return { approve: !topHit, reason: topHit ? `blocked: ${topHit}` : "clean" };
}

Deno.serve(async () => {
  const item = await nextQueueItem();
  if (!item) {
    return new Response(
      JSON.stringify({ ok: true, status: "empty" }),
      { headers: { "content-type": "application/json" } },
    );
  }

  const { photo_id, storage_path } = item;

  try {
    const url = await signedUrl(storage_path);
    if (!url) throw new Error("no-signed-url");

    const imgResp = await fetch(url);
    if (!imgResp.ok) throw new Error(`fetch-image-failed: ${imgResp.status}`);
    const bytes = new Uint8Array(await imgResp.arrayBuffer());

    const cmd = new DetectModerationLabelsCommand({
      Image: { Bytes: bytes },
      MinConfidence: 70,
    });
    const res = await rekog.send(cmd);

    const { approve, reason } = decide(res.ModerationLabels ?? []);

    await supabase.from("photo_moderation_audit").insert({
      photo_id,
      decision: approve ? "approved" : "rejected",
      reason,
      vendor: "rekognition",
    });

    if (approve) {
      // mark approved
      await supabase.from("photos").update({ status: "approved" }).eq("id", photo_id);

      // read photo row for user_id + fields
      const { data: ph, error: phErr } = await supabase
        .from("photos")
        .select("user_id, url, storage_path, created_at")
        .eq("id", photo_id)
        .maybeSingle();
      if (phErr) throw phErr;

      if (ph?.user_id) {
        // INSERT (no upsert) to preserve feed history
        await supabase.from("posts").insert({
          user_id: ph.user_id,
          photo_url: ph.url ?? null,
          storage_path: ph.storage_path ?? null,
          created_at: ph.created_at ?? new Date().toISOString(),
          caption: null,
        });
      }
    } else {
      await supabase.from("photos").update({ status: "rejected" }).eq("id", photo_id);
    }

    return new Response(
      JSON.stringify({ ok: true, decision: approve ? "approved" : "rejected" }),
      { headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    await supabase.from("photo_moderation_audit").insert({
      photo_id,
      decision: "error",
      reason: String(e),
      vendor: "rekognition",
    });
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
});
