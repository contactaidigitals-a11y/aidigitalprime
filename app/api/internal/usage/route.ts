import { timingSafeEqual } from "node:crypto";
import { readUsage } from "../../usage/_store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const key = process.env.AIDP_USAGE_ADMIN_TOKEN;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!key || !provided ||
      Buffer.byteLength(key) !== Buffer.byteLength(provided) ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(key))) {
    return Response.json({ error: "Not authorised" }, { status: 401 });
  }
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  try {
    const result = await readUsage(month);
    // Reporting is by UTC calendar month; invoices must use the Stripe subscription
    // billing period and independently reconciled call records before charging.
    return Response.json({ ...result, status: "observational_only_not_billable" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Unable to read usage" }, { status: 400 });
  }
}
