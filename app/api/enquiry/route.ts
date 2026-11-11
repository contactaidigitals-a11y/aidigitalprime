const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;

function clean(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const url = new URL(origin);
      if (url.host !== host || url.protocol !== "https:") {
        return Response.json({ error: "Request not allowed." }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Request not allowed." }, { status: 403 });
    }
  }

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const previous = attempts.get(ip);
  if (previous && previous.resetAt > now && previous.count >= 4) {
    return Response.json({ error: "Too many enquiries. Please try again in a few minutes." }, { status: 429 });
  }
  attempts.set(ip, previous && previous.resetAt > now
    ? { count: previous.count + 1, resetAt: previous.resetAt }
    : { count: 1, resetAt: now + WINDOW_MS });
  if (attempts.size > 1000) {
    for (const [key, attempt] of attempts) if (attempt.resetAt < now) attempts.delete(key);
  }

  let data: Record<string, unknown>;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid input");
    data = body as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid enquiry." }, { status: 400 });
  }
  // Silent success for automated submissions trapped by the hidden field.
  if (clean(data.website)) return Response.json({ ok: true });

  const name = clean(data.name, 120);
  const email = clean(data.email, 160);
  const business = clean(data.business, 120);
  const phone = clean(data.phone, 35);
  const followup = clean(data.followup, 20);
  const service = clean(data.service, 80);
  const message = clean(data.message, 2000);
  if (!name || !email || data.consent !== true) {
    return Response.json({ error: "Please complete the required fields and consent checkbox." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!["Callback", "Email"].includes(followup) || (followup === "Callback" && phone.replace(/\D/g, "").length < 7)) {
    return Response.json({ error: "Please provide a valid callback phone number or choose email." }, { status: 400 });
  }
  if (phone && !/^[+()\d\s.\-]{7,35}$/.test(phone)) {
    return Response.json({ error: "Please check the phone number." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  const to = process.env.LEAD_TO_EMAIL;
  if (!apiKey || !from || !to) {
    return Response.json({ error: "Contact delivery is unavailable right now. Please email us directly." }, { status: 503 });
  }

  const text = [
    "New AI Digital Prime website enquiry",
    "",
    "Name: " + name,
    "Email: " + email,
    "Business: " + (business || "Not provided"),
    "Telephone: " + (phone || "Not provided"),
    "Preferred contact: " + followup,
    "Service: " + (service || "Not specified"),
    "",
    "Message:",
    message || "No additional message",
    "",
    "Submitted: " + new Date().toISOString()
  ].join("\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [to], reply_to: email,
        subject: "AI Digital Prime enquiry — " + (service || "New lead"),
        text
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return Response.json({ ok: true });
    console.error("Resend enquiry delivery failed", res.status);
    return Response.json({ error: "Could not send your enquiry right now. Please try again." }, { status: 502 });
  } catch {
    return Response.json({ error: "Unable to send your enquiry. Please try again." }, { status: 502 });
  }
}
