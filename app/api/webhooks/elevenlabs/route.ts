import { createHmac, timingSafeEqual } from "node:crypto";
import { recordCall } from "../../usage/_store";

export const runtime = "nodejs";
const MAX_BODY = 1024 * 1024;
const json = (code: number, data: Record<string, unknown>) =>
  Response.json(data, { status: code, headers: { "Cache-Control": "no-store" } });

function authenticate(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const parts = new Map(signature.split(",").map(p => p.trim().split("=")).filter(p => p.length === 2));
  const stamp = parts.get("t");
  const signed = parts.get("v0");
  if (!stamp || !/^\d{10}$/.test(stamp) || !signed || !/^[a-f0-9]{64}$/i.test(signed)) return false;
  if (Math.abs(Date.now() / 1000 - Number(stamp)) > 30 * 60) return false;
  const calculated = createHmac("sha256", secret).update(stamp + "." + raw).digest("hex");
  const actual = Buffer.from(signed.toLowerCase(), "hex");
  const expected = Buffer.from(calculated, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  const secret = process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET;
  if (!secret) return json(503, { error: "Usage webhook is not configured." });
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY) return json(413, { error: "Payload too large." });
  let body = "";
  try {
    body = await request.text();
    if (body.length > MAX_BODY) return json(413, { error: "Payload too large." });
  } catch { return json(400, { error: "Invalid request body." }); }
  if (!authenticate(body, request.headers.get("elevenlabs-signature"), secret)) {
    return json(401, { error: "Invalid webhook signature." });
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw Error();
  } catch { return json(400, { error: "Invalid JSON." }); }

  // Audio callbacks and failed call initiations are never usage records.
  if (payload.type !== "post_call_transcription") return json(200, { accepted: false });
  const data = payload.data as Record<string, unknown> | undefined;
  const metadata = data?.metadata as Record<string, unknown> | undefined;
  if (!data || !metadata) return json(400, { error: "Incomplete post-call event." });
  const agent_id = data.agent_id;
  const conversation_id = data.conversation_id;
  const seconds = metadata.call_duration_secs;
  const started = metadata.start_time_unix_secs;
  if (typeof agent_id !== "string" || typeof conversation_id !== "string" ||
      typeof seconds !== "number" || !Number.isFinite(seconds) ||
      typeof started !== "number" || !Number.isFinite(started)) {
    return json(400, { error: "Invalid call timing." });
  }
  const record = {
    agent_id,
    conversation_id,
    duration_seconds: Math.ceil(seconds),
    billable_minutes: Math.ceil(seconds / 60),
    started_at: new Date(started * 1000).toISOString(),
  };
  try {
    const outcome = await recordCall(record);
    return json(200, { accepted: true, outcome });
  } catch (err) {
    console.error("Unable to persist ElevenLabs call usage", err instanceof Error ? err.message : "unknown");
    return json(503, { error: "Usage storage temporarily unavailable; retry webhook." });
  }
}
