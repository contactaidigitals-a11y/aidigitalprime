import { siteConfig } from "../../config";

const leadAttempts = new Map<string, { count: number; resetAt: number }>();
const rateWindowMs = 10 * 60 * 1000;
const rateLimit = 4;

function clean(value: unknown, maxLength = 300) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return Response.json({ message: "Request not allowed." }, { status: 403 });
    } catch {
      return Response.json({ message: "Request not allowed." }, { status: 403 });
    }
  }

  const now = Date.now();
  const client = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const attempt = leadAttempts.get(client);
  if (attempt && attempt.resetAt > now && attempt.count >= rateLimit) {
    return Response.json({ message: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
  }
  leadAttempts.set(client, attempt && attempt.resetAt > now ? { count: attempt.count + 1, resetAt: attempt.resetAt } : { count: 1, resetAt: now + rateWindowMs });
  if (leadAttempts.size > 1000) {
    for (const [key, value] of leadAttempts) if (value.resetAt <= now) leadAttempts.delete(key);
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return Response.json({ message: "Invalid form submission." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ message: "Invalid form submission." }, { status: 400 });
  }

  if (clean(body.companyFax)) return Response.json({ ok: true });

  const name = clean(body.name, 100);
  const businessName = clean(body.businessName, 140);
  const phone = clean(body.phone, 20);
  const sourcePage = clean(body.sourcePage, 80) || "Website";
  const phoneDigits = phone.replace(/\D/g, "");

  if (!name || !businessName || !phone) {
    return Response.json({ message: "Please complete your name, business name and phone number." }, { status: 400 });
  }
  if (!/^[0-9+()\s.-]{7,20}$/.test(phone) || phoneDigits.length < 7) {
    return Response.json({ message: "Please enter a valid phone number." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL || siteConfig.contactEmail;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!apiKey || !from) {
    return Response.json({ message: "The form is temporarily unavailable. Your request has not been sent. Please use WhatsApp or email below." }, { status: 503 });
  }

  const rows = [
    ["Request", "Free on-site business audit"],
    ["Business", businessName],
    ["Contact name", name],
    ["Phone", phone],
    ["Source", sourcePage],
    ["Submitted (UTC)", new Date().toISOString()],
  ];
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;color:#101828"><p style="color:#2353b5;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">AI Digital Prime website</p><h1 style="font-size:28px">New free on-site audit request</h1>${rows.map(([label, value]) => `<p style="border-bottom:1px solid #dbe2ec;padding:10px 0"><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value)}</p>`).join("")}</div>`;
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");

  try {
    const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: siteConfig.contactEmail,
      subject: `New free on-site audit request — ${businessName}`,
      html,
      text,
    }),
    });
    if (result.ok) return Response.json({ ok: true });
  } catch {
    return Response.json({ message: "We couldn’t send your request right now. Please try again shortly." }, { status: 502 });
  }
  return Response.json({ message: "We couldn’t send your request right now. Please try again shortly." }, { status: 502 });
}
