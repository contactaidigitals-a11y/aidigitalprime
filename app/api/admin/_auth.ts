import { createHmac, createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.env.AIDP_USAGE_DATA_DIR || "/data/aidp-usage";
const AUTH = path.join(ROOT, "admin-auth.json");
const KEYFILE = path.join(ROOT, "admin-hmac-secret");
const SESSIONS = path.join(ROOT, "sessions");
const COOKIE = "aidp_admin_session";
const TTL = 10 * 60 * 1000;
const SESSION_TTL = 8 * 60 * 60 * 1000;
type Challenge = { digest: string; nonce: string; expires: number; attempts: number; lastSent: number; windowStart: number; sentInWindow: number };
type Session = { expires: number };

export function configured() {
  return Boolean((process.env.AIDP_ADMIN_EMAIL || process.env.LEAD_TO_EMAIL) &&
    process.env.RESEND_API_KEY && process.env.LEAD_FROM_EMAIL);
}
export function adminEmail() {
  return process.env.AIDP_ADMIN_EMAIL || process.env.LEAD_TO_EMAIL || "";
}
async function secret() {
  const override = process.env.AIDP_ADMIN_SECRET;
  if (override && override.length >= 32) return override;
  await mkdir(ROOT, { recursive: true, mode: 0o700 });
  try {
    await writeFile(KEYFILE, randomBytes(48).toString("hex"), { flag: "wx", mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const value = (await readFile(KEYFILE, "utf8")).trim();
  if (value.length < 64) throw new Error("Invalid admin secret file");
  return value;
}
async function digest(nonce: string, code: string) {
  return createHmac("sha256", await secret()).update(nonce + ":" + code).digest("hex");
}
function sessionFile(token: string) {
  return path.join(SESSIONS, createHash("sha256").update(token).digest("hex") + ".json");
}
async function readChallenge(): Promise<Challenge | null> {
  try {
    const raw = JSON.parse(await readFile(AUTH, "utf8"));
    if (typeof raw.digest !== "string" || typeof raw.nonce !== "string") return null;
    return raw as Challenge;
  } catch { return null; }
}
async function saveChallenge(state: Challenge) {
  await mkdir(ROOT, { recursive: true, mode: 0o700 });
  const tmp = AUTH + "." + randomBytes(8).toString("hex");
  await writeFile(tmp, JSON.stringify(state), { mode: 0o600 });
  await rename(tmp, AUTH);
}
export async function requestCode(): Promise<"sent" | "limited" | "failed"> {
  if (!configured()) return "failed";
  const now = Date.now();
  const existing = await readChallenge();
  if (existing && now - existing.lastSent < 60_000) return "limited";
  const windowStart = existing && now - existing.windowStart < 60 * 60_000 ? existing.windowStart : now;
  const sentInWindow = windowStart === existing?.windowStart ? existing.sentInWindow : 0;
  if (sentInWindow >= 6) return "limited";
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const nonce = randomBytes(16).toString("hex");
  const state: Challenge = {
    digest: await digest(nonce, code), nonce, expires: now + TTL, attempts: 0,
    lastSent: now, windowStart, sentInWindow: sentInWindow + 1,
  };
  await saveChallenge(state);
  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL, to: [adminEmail()],
        subject: "AI Digital Prime – admin verification code",
        text: "Your AI Digital Prime admin code is " + code + ". It expires in 10 minutes. If you did not request it, ignore this email.",
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!result.ok) return "failed";
    return "sent";
  } catch { return "failed"; }
}
export async function verifyCode(code: string): Promise<string | null> {
  if (!configured() || !/^\d{6}$/.test(code)) return null;
  const state = await readChallenge();
  if (!state || state.expires <= Date.now() || state.attempts >= 5) return null;
  state.attempts += 1;
  await saveChallenge(state);
  const expected = Buffer.from(state.digest, "hex");
  const actual = Buffer.from(await digest(state.nonce, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  // Immediately invalidate the one-time code.
  await rm(AUTH, { force: true });
  const token = randomBytes(32).toString("hex");
  await mkdir(SESSIONS, { recursive: true, mode: 0o700 });
  await writeFile(sessionFile(token), JSON.stringify({ expires: Date.now() + SESSION_TTL }), { flag: "wx", mode: 0o600 });
  return token;
}
function getToken(request: Request): string {
  const cookies = request.headers.get("cookie") || "";
  const raw = cookies.split(";").map(p => p.trim()).find(p => p.startsWith(COOKIE + "="));
  const token = raw?.slice(COOKIE.length + 1) || "";
  return /^[a-f0-9]{64}$/.test(token) ? token : "";
}
export async function isAdmin(request: Request): Promise<boolean> {
  if (!configured()) return false;
  const token = getToken(request);
  if (!token) return false;
  try {
    const state = JSON.parse(await readFile(sessionFile(token), "utf8")) as Session;
    return typeof state.expires === "number" && state.expires > Date.now();
  } catch { return false; }
}
export async function logout(request: Request) {
  const token = getToken(request);
  if (token) await rm(sessionFile(token), { force: true });
}
export function sessionCookie(token: string) {
  return COOKIE + "=" + token + "; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=" + (SESSION_TTL / 1000);
}
export function clearSessionCookie() {
  return COOKIE + "=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}
export function safeOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { const url = new URL(origin); const host = request.headers.get("host") || new URL(request.url).host; return url.host === host && url.protocol === "https:"; }
  catch { return false; }
}
export function noStore(data: unknown, status = 200, headers: Record<string,string> = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store, private", ...headers } });
}
