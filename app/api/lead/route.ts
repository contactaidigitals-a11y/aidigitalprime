import { siteConfig } from "../../config";

const requiredFields = ["name", "email", "businessName", "businessType", "challenge", "requestType"] as const;
const leadAttempts = new Map<string, { count: number; resetAt: number }>();
const rateWindowMs = 10 * 60 * 1000;
const rateLimit = 4;

function clean(value: unknown, maxLength = 3000) {
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
  if (attempt && attempt.resetAt > now && attempt.count >= rateLimit) return Response.json({ message: "Too many requests. Please wait a few minutes or email us directly." }, { status: 429 });
  leadAttempts.set(client, attempt && attempt.resetAt > now ? { count: attempt.count + 1, resetAt: attempt.resetAt } : { count: 1, resetAt: now + rateWindowMs });
  if (leadAttempts.size > 1000) for (const [key, value] of leadAttempts) if (value.resetAt <= now) leadAttempts.delete(key);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ message: "Invalid form submission." }, { status: 400 }); }

  if (clean(body.companyFax)) return Response.json({ ok: true });
  const data = Object.fromEntries(Object.entries(body).map(([key, value]) => [key, clean(value)]));
  if (requiredFields.some((field) => !data[field]) || data.consent !== "yes") return Response.json({ message: "Please complete the required fields." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(data.email)) return Response.json({ message: "Please enter a valid email address." }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL || `${siteConfig.brandName} <onboarding@resend.dev>`;
  if (!apiKey || !to) return Response.json({ message: `Email delivery is not connected yet. Please email ${siteConfig.contactEmail}.` }, { status: 503 });

  const rows = [
    ["Request", data.requestType], ["Service context", data.serviceContext || "—"], ["Sector context", data.sectorContext || "—"], ["Name", data.name], ["Email", data.email], ["Phone", data.phone || "—"], ["Business", data.businessName], ["Website", data.websiteUrl || "—"], ["Business type", data.businessType], ["Priority", data.challenge], ["Details", data.details || "—"],
  ];
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;color:#10120f"><h1 style="font-size:28px">New ${escapeHtml(data.requestType)} request</h1>${rows.map(([label, value]) => `<p style="border-bottom:1px solid #ddd;padding:10px 0"><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value)}</p>`).join("")}</div>`;
  const result = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], reply_to: data.email, subject: `${siteConfig.brandName}: ${data.requestType} request from ${data.name}`, html }) });
  if (!result.ok) return Response.json({ message: "We couldn’t send your request. Please email us directly." }, { status: 502 });
  return Response.json({ ok: true });
}
