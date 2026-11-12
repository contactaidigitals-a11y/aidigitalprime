import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
const ROOT = process.env.AIDP_USAGE_DATA_DIR || "/data/aidp-usage";
const FILE = path.join(ROOT, "clients.json");
export type ClientPlan = "Starter" | "Growth" | "Pro";
export type ClientEntry = {
  id: string; business: string; contactEmail: string; plan: ClientPlan;
  agentId: string; stripeCustomerId: string; stripeSubscriptionId: string;
  includedMinutes: number | null; status: "pending" | "active" | "paused" | "cancelled";
  updatedAt: string;
};
export async function readClients(): Promise<ClientEntry[]> {
  try {
    const data: unknown = JSON.parse(await readFile(FILE, "utf8"));
    return Array.isArray(data) ? data.filter(c => c && typeof c.id === "string").slice(0, 500) as ClientEntry[] : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}
async function saveClients(clients: ClientEntry[]) {
  await mkdir(ROOT, { recursive: true, mode: 0o700 });
  const temp = FILE + "." + randomBytes(8).toString("hex");
  await writeFile(temp, JSON.stringify(clients), { mode: 0o600 });
  await rename(temp, FILE);
}
const trim = (value: unknown, max = 150) => typeof value === "string" ? value.trim().slice(0, max) : "";
export async function changeClients(data: Record<string, unknown>): Promise<ClientEntry[]> {
  const entries = await readClients();
  if (data.action === "delete") {
    const id = trim(data.id);
    if (!entries.some(x => x.id === id)) throw new Error("Mapping not found.");
    const remaining = entries.filter(x => x.id !== id);
    await saveClients(remaining);
    return remaining;
  }
  if (data.action !== "save") throw new Error("Invalid action.");
  const business = trim(data.business, 120);
  const contactEmail = trim(data.contactEmail, 150);
  const plan = data.plan;
  const agentId = trim(data.agentId, 120);
  const stripeCustomerId = trim(data.stripeCustomerId, 120);
  const stripeSubscriptionId = trim(data.stripeSubscriptionId, 120);
  const status = data.status;
  const includedMinutes = data.includedMinutes === null || data.includedMinutes === "" || data.includedMinutes === undefined
    ? null : Number(data.includedMinutes);
  if (!business || !["Starter", "Growth", "Pro"].includes(String(plan)) ||
      !["pending", "active", "paused", "cancelled"].includes(String(status)) ||
      (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) ||
      (agentId && !/^agent_[a-zA-Z0-9]+$/.test(agentId)) ||
      (stripeCustomerId && !/^cus_[a-zA-Z0-9]+$/.test(stripeCustomerId)) ||
      (stripeSubscriptionId && !/^sub_[a-zA-Z0-9]+$/.test(stripeSubscriptionId)) ||
      (includedMinutes !== null && (!Number.isSafeInteger(includedMinutes) || includedMinutes < 0 || includedMinutes > 1_000_000))) {
    throw new Error("Check the client details and IDs.");
  }
  const excludedIds = [process.env.ELEVENLABS_DEMO_AGENT_ID || "", ...(process.env.AIDP_EXCLUDED_AGENT_IDS || "").split(",")].map(s => s.trim()).filter(Boolean);
  if (agentId && excludedIds.includes(agentId)) throw new Error("Demo or sales agents cannot be assigned to a paying client.");
  const id = trim(data.id) || randomUUID();
  const index = entries.findIndex(x => x.id === id);
  if (index < 0 && entries.length >= 500) throw new Error("Maximum clients reached.");
  if (index < 0 && data.id) throw new Error("Client mapping not found.");
  if (agentId && entries.some(x => x.agentId === agentId && x.id !== id)) throw new Error("Agent is already assigned to another client.");
  const entry: ClientEntry = {
    id, business, contactEmail, plan: plan as ClientPlan, agentId, stripeCustomerId,
    stripeSubscriptionId, includedMinutes,
    status: status as ClientEntry["status"], updatedAt: new Date().toISOString(),
  };
  if (index < 0) entries.push(entry);
  else entries[index] = entry;
  await saveClients(entries);
  return entries;
}
