/* Public website configuration. Never put API keys or secrets in this file. */
window.AI_DIGITAL_PRIME_CONFIG = {
  /* Add a VERIFIED, authorised contact address before launch. */
  contactEmail: 'contact.aidigitals@gmail.com',
  /* Optional: set an ElevenLabs PUBLIC DEMO agent ID after enabling its public widget.
     IMPORTANT: do NOT expose a private/outbound sales agent without reviewing
     its prompt, dynamic variables, security settings and permitted domains. */
  /* The website uses authenticated signed sessions; never expose a reusable public voice agent. */
  publicDemoAgentId: '',
  /* Same-origin Railway API: returns a short-lived signed ElevenLabs session URL. */
  voiceApiUrl: '/api/voice-session',
  /* Same-origin Railway API for enquiries delivered via Resend. */
  callbackApiUrl: '/api/enquiry',
  /* Optional AI backend endpoint (e.g. a deployed Cloudflare Worker URL).
     Keep empty for the honest, functional guided FAQ preview. Never use an API key here. */
  chatApiUrl: '/api/prime-chat',
};
