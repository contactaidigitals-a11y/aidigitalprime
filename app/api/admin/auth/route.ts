import { adminEmail, clearSessionCookie, configured, isAdmin, logout, noStore, requestCode, safeOrigin, sessionCookie, verifyCode } from "../_auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ready = configured();
  const authenticated = ready && await isAdmin(request);
  return noStore({
    configured: ready,
    authenticated,
    emailHint: authenticated ? adminEmail() : "",
  });
}
export async function POST(request: Request) {
  if (!safeOrigin(request)) return noStore({ error: "Request not allowed." }, 403);
  if (!configured()) return noStore({ error: "Admin login is not configured." }, 503);
  let data: { action?: unknown; code?: unknown };
  try {
    if (Number(request.headers.get("content-length") || 0) > 2048) throw Error();
    data = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw Error();
  } catch { return noStore({ error: "Invalid request." }, 400); }
  if (data.action === "request") {
    try {
      const result = await requestCode();
      if (result === "limited") return noStore({ error: "Please wait before requesting another code." }, 429);
      if (result === "failed") return noStore({ error: "Could not send the email code." }, 502);
      return noStore({ ok: true, message: "The code was sent to the configured admin inbox." });
    } catch { return noStore({ error: "Could not send the email code." }, 502); }
  }
  if (data.action === "verify") {
    const code = typeof data.code === "string" ? data.code.trim() : "";
    try {
      const token = await verifyCode(code);
      if (!token) return noStore({ error: "Invalid or expired code." }, 401);
      return noStore({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
    } catch { return noStore({ error: "Could not verify the code." }, 503); }
  }
  if (data.action === "logout") {
    try { await logout(request); } catch { /* Clear browser cookie anyway */ }
    return noStore({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
  }
  return noStore({ error: "Unknown action." }, 400);
}
