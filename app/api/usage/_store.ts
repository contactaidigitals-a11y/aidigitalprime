import { createHash } from "node:crypto";
import { mkdir, open, readFile, readdir } from "node:fs/promises";
import path from "node:path";

export type CallRecord = {
  conversation_id: string;
  agent_id: string;
  duration_seconds: number;
  billable_minutes: number;
  started_at: string;
};

const ROOT = process.env.AIDP_USAGE_DATA_DIR || "/data/aidp-usage";
const CALLS = path.join(ROOT, "calls");
const idPattern = /^(?:conv_|conversation_)?[a-zA-Z0-9_-]{8,150}$/;
const agentPattern = /^agent_[a-zA-Z0-9]+$/;

export function validateRecord(record: CallRecord): boolean {
  return idPattern.test(record.conversation_id) &&
    agentPattern.test(record.agent_id) &&
    Number.isSafeInteger(record.duration_seconds) &&
    record.duration_seconds >= 0 &&
    record.duration_seconds <= 24 * 60 * 60 &&
    Number.isSafeInteger(record.billable_minutes) &&
    record.billable_minutes === Math.ceil(record.duration_seconds / 60) &&
    Number.isFinite(Date.parse(record.started_at));
}

/** Atomic one-file-per-conversation creation; duplicate webhooks never double-count. */
export async function recordCall(record: CallRecord): Promise<"created" | "duplicate"> {
  if (!validateRecord(record)) throw new Error("Invalid call usage");
  await mkdir(CALLS, { recursive: true, mode: 0o700 });
  const digest = createHash("sha256").update(record.agent_id + ":" + record.conversation_id).digest("hex");
  const filename = path.join(CALLS, digest + ".json");
  let file;
  try {
    file = await open(filename, "wx", 0o600);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") return "duplicate";
    throw err;
  }
  try {
    await file.writeFile(JSON.stringify(record));
    await file.sync();
  } finally {
    await file.close();
  }
  return "created";
}

export async function readUsage(month: string): Promise<{
  month: string;
  records: number;
  agents: Record<string, { calls: number; duration_seconds: number; billable_minutes: number }>;
}> {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
  const agents: Record<string, { calls: number; duration_seconds: number; billable_minutes: number }> = {};
  let entries: string[] = [];
  try {
    entries = await readdir(CALLS);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  let count = 0;
  for (const filename of entries) {
    if (!/^[a-f0-9]{64}\.json$/.test(filename)) continue;
    const parsed = JSON.parse(await readFile(path.join(CALLS, filename), "utf8")) as CallRecord;
    if (!validateRecord(parsed) || parsed.started_at.slice(0, 7) !== month) continue;
    const aggregate = agents[parsed.agent_id] ??= { calls: 0, duration_seconds: 0, billable_minutes: 0 };
    aggregate.calls += 1;
    aggregate.duration_seconds += parsed.duration_seconds;
    aggregate.billable_minutes += parsed.billable_minutes;
    count += 1;
  }
  return { month, records: count, agents };
}
