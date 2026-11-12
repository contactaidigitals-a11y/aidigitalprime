"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import "./admin.css";

type Plan = "Starter" | "Growth" | "Pro";
type Status = "pending" | "active" | "paused" | "cancelled";
type Client = { id: string; business: string; contactEmail: string; plan: Plan; agentId: string;
  stripeCustomerId: string; stripeSubscriptionId: string; includedMinutes: number | null;
  status: Status; calls: number; minutes: number; overagePreview: number | null; isExcluded: boolean; updatedAt: string };
type Unassigned = { agentId: string; calls: number; minutes: number; excluded: boolean };
type Overview = { month: string; totalCalls: number; totalMinutes: number; clients: Client[];
  unassigned: Unassigned[]; billingEnabled: boolean };
type Form = Pick<Client, "id" | "business" | "contactEmail" | "plan" | "agentId" | "stripeCustomerId" | "stripeSubscriptionId" | "status"> & { includedMinutes: string };
const blank: Form = { id: "", business: "", contactEmail: "", plan: "Starter", agentId: "",
  stripeCustomerId: "", stripeSubscriptionId: "", includedMinutes: "", status: "pending" };
const monthlyPrice: Record<Plan, number> = { Starter: 79, Growth: 139, Pro: 199 };
async function callApi(url: string, data?: unknown) {
  const response = await fetch(url, {
    method: data === undefined ? "GET" : "POST",
    credentials: "same-origin", cache: "no-store",
    headers: data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "Request failed.");
  return json;
}
export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [emailHint, setEmailHint] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [code, setCode] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [overview, setOverview] = useState<Overview | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadOverview = useCallback(async (selected: string) => {
    const data = await callApi("/api/admin/overview?month=" + encodeURIComponent(selected));
    setOverview(data);
  }, []);
  useEffect(() => {
    let active = true;
    callApi("/api/admin/auth").then(async data => {
      if (!active) return;
      setConfigured(data.configured);
      setAuthenticated(data.authenticated);
      setEmailHint(data.emailHint || "");
      if (data.authenticated) {
        try { await loadOverview(month); } catch (e) { if (active) setError(String(e)); }
      }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
    // Run on initial mount only; month changes are handled with the refresh control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function requestCode() {
    setError(""); setNotice(""); setBusy(true);
    try {
      const result = await callApi("/api/admin/auth", { action: "request" });
      setCodeRequested(true); setNotice(result.message || "Code sent.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to send code."); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await callApi("/api/admin/auth", { action: "verify", code });
      setAuthenticated(true); setCode(""); setNotice("");
      await loadOverview(month);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not verify."); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setError(""); setBusy(true);
    try { await callApi("/api/admin/auth", { action: "logout" }); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to sign out."); }
    finally { setAuthenticated(false); setOverview(null); setBusy(false); }
  }
  async function refresh() {
    setError(""); setBusy(true);
    try { await loadOverview(month); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load."); }
    finally { setBusy(false); }
  }
  async function saveClient(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice(""); setSaving(true);
    try {
      await callApi("/api/admin/clients", { ...form, includedMinutes: form.includedMinutes === "" ? null : Number(form.includedMinutes), action: "save" });
      await loadOverview(month);
      setForm(blank); setNotice("Client mapping saved. Automatic billing remains OFF.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save."); }
    finally { setSaving(false); }
  }
  function editClient(client: Client) {
    setForm({ id: client.id, business: client.business, contactEmail: client.contactEmail,
      plan: client.plan, agentId: client.agentId, stripeCustomerId: client.stripeCustomerId,
      stripeSubscriptionId: client.stripeSubscriptionId, includedMinutes: client.includedMinutes === null ? "" : String(client.includedMinutes), status: client.status });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function deleteClient(id: string) {
    if (!window.confirm("Remove this client mapping? Existing call records will be retained.")) return;
    setError(""); setSaving(true);
    try {
      await callApi("/api/admin/clients", { action: "delete", id });
      await loadOverview(month); setForm(blank); setNotice("Mapping removed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to remove mapping."); }
    finally { setSaving(false); }
  }
  const change = (key: keyof Form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return <main className="aidp-admin">
    <header className="aidp-admin-head">
      <div><span className="aidp-admin-eyebrow">AI DIGITAL PRIME / PRIVATE OPERATIONS</span>
        <h1>Admin dashboard</h1><p>Clients, ElevenLabs usage and Stripe subscription mapping</p></div>
      {authenticated && <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><a className="aidp-btn aidp-btn-subtle" href="/admin/outreach">Lead discovery & outreach</a><a className="aidp-btn aidp-btn-subtle" href="/admin/calling">Manual AI calling</a><button type="button" className="aidp-btn aidp-btn-subtle" onClick={signOut} disabled={busy}>Sign out</button></div>}
    </header>
    {error && <div className="aidp-admin-alert error" role="alert">{error}</div>}
    {notice && <div className="aidp-admin-alert" role="status">{notice}</div>}
    {checking ? <section className="aidp-panel"><p>Checking secure session…</p></section> :
    !authenticated ? <section className="aidp-panel aidp-login">
      <div className="aidp-lock">🔒</div><h2>Secure access</h2>
      <p>This area is private. Sign in using a six-digit code sent to the admin email address.</p>
      {!configured ? <div className="aidp-admin-alert error">Email authentication is not fully configured in Railway.</div> :
      !codeRequested ? <button className="aidp-btn" type="button" disabled={busy} onClick={requestCode}>{busy ? "Sending…" : "Email me a login code"}</button> :
      <form onSubmit={verify} className="aidp-login-form"><label htmlFor="aidp-code">Six-digit verification code</label>
        <input id="aidp-code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
        <button className="aidp-btn" type="submit" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Sign in"}</button>
        <button className="aidp-text-button" type="button" disabled={busy} onClick={requestCode}>Resend code (after 60 seconds)</button>
      </form>}
    </section> : <>
      <div className="aidp-admin-tools">
        <label htmlFor="aidp-month">Reporting month (UTC)</label>
        <input type="month" id="aidp-month" value={month} onChange={e => setMonth(e.target.value)} />
        <button className="aidp-btn aidp-btn-subtle" type="button" disabled={busy} onClick={refresh}>{busy ? "Loading…" : "Refresh data"}</button>
        <span className="aidp-admin-billing">Automatic billing: OFF</span>
      </div>
      {overview && <>
        <div className="aidp-kpis">
          <article className="aidp-kpi"><span>Mapped clients</span><strong>{overview.clients.length}</strong><small>Manually configured</small></article>
          <article className="aidp-kpi"><span>Recorded calls</span><strong>{overview.totalCalls.toLocaleString("en-GB")}</strong><small>All agents (including demos)</small></article>
          <article className="aidp-kpi"><span>Rounded call minutes</span><strong>{overview.totalMinutes.toLocaleString("en-GB")}</strong><small>Monitoring only, not invoiced</small></article>
          <article className="aidp-kpi"><span>Unassigned agents</span><strong>{overview.unassigned.length}</strong><small>Not eligible for billing</small></article>
        </div>
        <div className="aidp-admin-grid">
          <section className="aidp-panel" id="client-editor"><div className="aidp-section-heading">
            <div><h2>{form.id ? "Edit client" : "Add a client"}</h2><p>Record the Stripe and ElevenLabs IDs after you verify them.</p></div></div>
            <form onSubmit={saveClient} className="aidp-client-form">
              <label>Business name<input value={form.business} onChange={e => change("business", e.target.value)} maxLength={120} required /></label>
              <label>Contact email<input type="email" value={form.contactEmail} onChange={e => change("contactEmail", e.target.value)} maxLength={150} /></label>
              <label>Subscription plan<select value={form.plan} onChange={e => change("plan", e.target.value)}>
                <option>Starter</option><option>Growth</option><option>Pro</option>
              </select><small>£{monthlyPrice[form.plan]}/month (base price)</small></label>
              <label>Account status<select value={form.status} onChange={e => change("status", e.target.value)}>
                <option value="pending">Pending verification</option><option value="active">Active</option>
                <option value="paused">Paused</option><option value="cancelled">Cancelled</option>
              </select></label>
              <label>ElevenLabs Agent ID<input placeholder="agent_..." value={form.agentId} onChange={e => change("agentId", e.target.value)} /></label>
              <label>Included minutes / period<input type="number" min="0" step="1" placeholder="Not agreed yet" value={form.includedMinutes} onChange={e => change("includedMinutes", e.target.value)} /></label>
              <label>Stripe customer ID<input placeholder="cus_..." value={form.stripeCustomerId} onChange={e => change("stripeCustomerId", e.target.value)} /></label>
              <label>Stripe subscription ID<input placeholder="sub_..." value={form.stripeSubscriptionId} onChange={e => change("stripeSubscriptionId", e.target.value)} /></label>
              <div className="aidp-form-actions"><button className="aidp-btn" type="submit" disabled={saving}>{saving ? "Saving…" : form.id ? "Save changes" : "Add client"}</button>
                {form.id && <button type="button" className="aidp-btn aidp-btn-subtle" onClick={() => setForm(blank)}>Cancel edit</button>}</div>
            </form>
          </section>
          <section className="aidp-panel">
            <div className="aidp-section-heading"><div><h2>Customers and monthly usage</h2>
              <p>Matched by ElevenLabs agent ID. Minutes are per call, rounded up.</p></div></div>
            {overview.clients.length === 0 ? <div className="aidp-empty">No customer mappings yet. Add a business to start matching calls.</div> :
            <div className="aidp-customer-list">{overview.clients.map(c => <article key={c.id} className="aidp-customer">
              <div className="aidp-customer-top"><div><h3>{c.business}</h3><span>{c.plan} · {c.status} · £{monthlyPrice[c.plan]}/mo</span></div><div className="aidp-customer-buttons">
                <button type="button" onClick={() => editClient(c)}>Edit</button><button type="button" disabled={saving} onClick={() => deleteClient(c.id)}>Remove</button>
              </div></div>
              <div className="aidp-customer-stats"><div><strong>{c.calls}</strong><small>Calls</small></div><div><strong>{c.minutes}</strong><small>Minutes</small></div>
                <div><strong>{c.overagePreview === null ? "—" : c.overagePreview}</strong><small>Excess preview*</small></div></div>
              <div className="aidp-meta"><span>ElevenLabs: {c.agentId || "Not assigned"}</span><span>Stripe customer: {c.stripeCustomerId || "Not linked"}</span><span>Stripe subscription: {c.stripeSubscriptionId || "Not linked"}</span>
              {c.isExcluded && <span className="aidp-warning">This is a demo/sales agent; do not bill.</span>}</div>
            </article>)}</div>}
            <p className="aidp-footnote">*Not a charge. These figures use UTC calendar months, not Stripe subscription periods, and are for monitoring only.</p>
          </section>
        </div>
        <section className="aidp-panel">
          <div className="aidp-section-heading"><div><h2>Unassigned agent activity</h2><p>Demo, sales and unmapped agents are excluded from all customer billing.</p></div></div>
          {overview.unassigned.length === 0 ? <div className="aidp-empty">No unassigned activity recorded for this month.</div> :
          <div className="aidp-table-wrap"><table><thead><tr><th>Agent ID</th><th>Calls</th><th>Minutes</th><th>Classification</th></tr></thead><tbody>
            {overview.unassigned.map(a => <tr key={a.agentId}><td>{a.agentId}</td><td>{a.calls}</td><td>{a.minutes}</td><td>{a.excluded ? "Demo / excluded" : "Unassigned"}</td></tr>)}
          </tbody></table></div>}
        </section>
      </>}
    </>}
    <footer className="aidp-admin-footer">Private admin · Call records contain IDs and duration only · <a href="/">Return to website</a></footer>
  </main>;
}
