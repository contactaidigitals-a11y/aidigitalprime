/** Basic in-process demo quota and request validation.
 * Limits apply per Railway instance and reset on redeploy; the ElevenLabs
 * demo agent also has its own account-side daily and concurrency caps.
 * Move to Redis for multi-replica/production-grade global quotas.
 */
type Reservation = { ok: true; undo: () => void } | { ok: false };
const counts = new Map<string, { day: string; count: number }>();

export function apiJson(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function validateDemoRequest(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
    try {
      const url = new URL(origin);
      if (url.protocol !== "https:" || url.host !== host) return apiJson(403, { error: "Request not allowed." });
    } catch {
      return apiJson(403, { error: "Request not allowed." });
    }
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return apiJson(415, { error: "JSON body required." });
  const size = Number(request.headers.get("content-length"));
  if (size > 16000) return apiJson(413, { error: "Request is too large." });
  return null;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length > 16000) return null;
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}

export function reserveQuota(request: Request, kind: "chat" | "voice", perVisitor: number, allVisitors: number): Reservation {
  const day = new Date().toISOString().slice(0, 10);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("cf-connecting-ip")?.trim() || "unknown";
  const userKey = kind + ":" + ip;
  const globalKey = kind + ":all";
  if (counts.size > 2000) {
    for (const [k, v] of counts) if (v.day !== day) counts.delete(k);
  }
  const used = (key: string) => {
    const entry = counts.get(key);
    return entry?.day === day ? entry.count : 0;
  };
  if (used(userKey) >= perVisitor || used(globalKey) >= allVisitors) return { ok: false };
  counts.set(userKey, { day, count: used(userKey) + 1 });
  counts.set(globalKey, { day, count: used(globalKey) + 1 });
  return {
    ok: true,
    undo() {
      for (const key of [userKey, globalKey]) {
        const entry = counts.get(key);
        if (entry?.day === day && entry.count > 0) {
          counts.set(key, { day, count: entry.count - 1 });
        }
      }
    }
  };
}
