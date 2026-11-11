import { apiJson, readJson, reserveQuota, validateDemoRequest } from "../_demo-utils";

const FIELD_LENGTHS: Record<string, number> = {
  business_name: 90,
  business_type: 90,
  business_address: 180,
  opening_hours: 450,
  services_prices: 800,
  business_faq: 350
};

export async function POST(request: Request) {
  const reject = validateDemoRequest(request);
  if (reject) return reject;
  const body = await readJson(request);
  if (!body) return apiJson(400, { error: "Invalid business information." });
  for (const [field, maxLength] of Object.entries(FIELD_LENGTHS)) {
    const value = body[field];
    const required = field !== "business_faq";
    if (typeof value !== "string" || value.length > maxLength || (required && !value.trim())) {
      return apiJson(400, { error: "Please check " + field.replaceAll("_", " ") + "." });
    }
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_DEMO_AGENT_ID;
  if (!apiKey || !agentId || !/^agent_[a-z0-9]+$/i.test(agentId)) {
    return apiJson(503, { error: "The voice demonstration is not configured yet." });
  }
  const reservation = reserveQuota(request, "voice", 1, 20);
  if (!reservation.ok) return apiJson(429, { error: "Today's voice demonstrations have been used. Please try again tomorrow or send an enquiry." });
  try {
    const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
    url.searchParams.set("agent_id", agentId);
    const response = await fetch(url, {
      headers: { "xi-api-key": apiKey },
      signal: AbortSignal.timeout(11000)
    });
    if (!response.ok) {
      reservation.undo();
      console.error("Prime voice ElevenLabs error status:", response.status);
      return apiJson(503, { error: "The AI receptionist is temporarily unavailable." });
    }
    const data: unknown = await response.json();
    const signedUrl = data && typeof data === "object"
      ? (data as Record<string, unknown>).signed_url : null;
    if (typeof signedUrl !== "string" || !signedUrl.startsWith("wss://")) {
      reservation.undo();
      return apiJson(503, { error: "Unable to prepare a voice session." });
    }
    return apiJson(200, { signedUrl, seconds: 120 });
  } catch {
    reservation.undo();
    return apiJson(503, { error: "The AI receptionist is temporarily unavailable." });
  }
}
