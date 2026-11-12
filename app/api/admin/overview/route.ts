import { isAdmin, noStore } from "../_auth";
import { readClients } from "../clients/_store";
import { readUsage } from "../../usage/_store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await isAdmin(request)) return noStore({ error: "Not authorised." }, 401);
  const month = new URL(request.url).searchParams.get("month") || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return noStore({ error: "Invalid month." }, 400);
  try {
    const [usage, clients] = await Promise.all([readUsage(month), readClients()]);
    const excluded = [process.env.ELEVENLABS_DEMO_AGENT_ID || "", ...(process.env.AIDP_EXCLUDED_AGENT_IDS || "").split(",")].map(v => v.trim()).filter(Boolean);
    const mapped = new Set(clients.map(c => c.agentId).filter(Boolean));
    const enriched = clients.map(client => {
      const current = usage.agents[client.agentId] || { calls: 0, duration_seconds: 0, billable_minutes: 0 };
      return {
        ...client, calls: current.calls, minutes: current.billable_minutes,
        isExcluded: Boolean(client.agentId && excluded.includes(client.agentId)),
        overagePreview: client.includedMinutes === null ? null : Math.max(0, current.billable_minutes - client.includedMinutes),
      };
    });
    const unassigned = Object.entries(usage.agents).filter(([agent]) => !mapped.has(agent))
      .map(([agentId, stats]) => ({
        agentId, calls: stats.calls, minutes: stats.billable_minutes,
        excluded: excluded.includes(agentId),
      }));
    const aggregates = Object.values(usage.agents);
    return noStore({
      month, totalCalls: usage.records, totalMinutes: aggregates.reduce((sum, x) => sum + x.billable_minutes, 0),
      clients: enriched, unassigned, billingEnabled: false, status: "observational_only_not_billable",
    });
  } catch {
    return noStore({ error: "Unable to read admin overview." }, 503);
  }
}
