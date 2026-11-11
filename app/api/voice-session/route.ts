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
  // Normalise accidental whitespace and wrapping quotes from environment-variable paste.
  // Never send, expose or log API key content.
  const apiKey = (process.env.ELEVENLABS_API_KEY || "").trim().replace(/^['"]|['"]$/g, "").trim();
  const agentId = (process.env.ELEVENLABS_DEMO_AGENT_ID || "").trim();
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
      // Only inspect the machine-readable error code, not the response message or credentials.
      let errorCode = "unknown";
      try {
        const raw: unknown = await response.json();
        if (raw && typeof raw === "object") {
          const detail = (raw as Record<string, unknown>).detail;
          const status = detail && typeof detail === "object"
            ? (detail as Record<string, unknown>).status
            : typeof detail === "string" ? detail : null;
          if (typeof status === "string" && /^[a-z0-9_-]{1,60}$/i.test(status)) {
            errorCode = status;
          }
        }
      } catch { /* Error bodies may not be JSON. */ }
      console.error("Prime voice ElevenLabs rejection", {
        httpStatus: response.status,
        errorCode,
        keyPresent: apiKey.length > 0,
        keyLengthPlausible: apiKey.length >= 20,
        hadWrappingWhitespace: (process.env.ELEVENLABS_API_KEY || "") !== (process.env.ELEVENLABS_API_KEY || "").trim()
      });
      return apiJson(503, {
        error: "ElevenLabs could not authorise the voice demo. Check the ElevenLabs API key linked to the demo agent.",
        code: response.status === 401 ? "ELEVENLABS_AUTH_401" : response.status === 403 ? "ELEVENLABS_ACCESS_403" : "ELEVENLABS_UPSTREAM"
      });
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
