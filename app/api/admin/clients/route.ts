import { isAdmin, noStore, safeOrigin } from "../_auth";
import { changeClients, readClients } from "./_store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await isAdmin(request)) return noStore({ error: "Not authorised." }, 401);
  try { return noStore({ clients: await readClients() }); }
  catch { return noStore({ error: "Unable to load client mappings." }, 503); }
}
export async function POST(request: Request) {
  if (!safeOrigin(request)) return noStore({ error: "Request not allowed." }, 403);
  if (!await isAdmin(request)) return noStore({ error: "Not authorised." }, 401);
  try {
    if (Number(request.headers.get("content-length") || 0) > 8192) return noStore({ error: "Too much data." }, 413);
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return noStore({ error: "Invalid data." }, 400);
    const clients = await changeClients(data as Record<string, unknown>);
    return noStore({ ok: true, clients });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to save.";
    const inputError = /Check|Invalid|Maximum|already|not found|cannot be/i.test(message);
    return noStore({ error: inputError ? message : "Unable to save client mapping." }, inputError ? 400 : 503);
  }
}
