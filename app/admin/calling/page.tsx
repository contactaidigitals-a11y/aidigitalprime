"use client";
import { useEffect, useState, type FormEvent } from "react";
import "../admin.css";
import "./calling.css";

type Prospect={id:string;business:string;phone:string;location:string;industry:string;website:string;hours?:string;source:string;sourceUrl:string;status:string;notes:string;observation:string;permission:string};
type Call={id:string;prospectId:string;business:string;phone:string;elevenConversationId:string;twilioCallSid:string;createdAt:string;status:"initiated"|"completed"|"failed";outcome:string;operatorNotes:string};
const outcomes=["Interested","Callback requested","No answer","Voicemail","Not interested","Do not call","Wrong number","Other"];
async function api(url:string,body?:unknown){
 const res=await fetch(url,{method:body===undefined?"GET":"POST",headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),cache:"no-store",credentials:"same-origin"});
 const data=await res.json();
 if(!res.ok)throw Error(data.error||"Request failed.");
 return data;
}
export default function ManualCalls(){
 const [auth,setAuth]=useState<"checking"|"ready"|"unauthorised">("checking");
 const [prospects,setProspects]=useState<Prospect[]>([]);
 const [calls,setCalls]=useState<Call[]>([]);
 const [selected,setSelected]=useState("");
 const [query,setQuery]=useState("");
 const [evidence,setEvidence]=useState("");
 const [consentDate,setConsentDate]=useState("");
 const [screened,setScreened]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [latest,setLatest]=useState<Call|null>(null);
 const [operatorNotes,setOperatorNotes]=useState("");
 const [outcome,setOutcome]=useState("No answer");
 const [providerReady,setProviderReady]=useState(false);
 const [stopAvailable,setStopAvailable]=useState(false);
 const [transcript,setTranscript]=useState<{speaker:string;text:string}[]>([]);
 const [providerStatus,setProviderStatus]=useState("");
 async function refresh(){
  const [leadRes,callRes]=await Promise.all([api("/api/admin/prospects"),api("/api/admin/calls")]);
  setProspects(leadRes.leads);setCalls(callRes.calls);setProviderReady(callRes.providerReady);setStopAvailable(callRes.stopAvailable);
 }
 useEffect(()=>{let mounted=true;api("/api/admin/auth").then(async x=>{
  if(!mounted)return;
  if(!x.authenticated){setAuth("unauthorised");return;}
  setAuth("ready");await refresh();
 }).catch(e=>{if(mounted){setError(e.message);setAuth("unauthorised");}});
 return()=>{mounted=false};},[]);
 const lead=prospects.find(x=>x.id===selected);
 const eligible=prospects.filter(x=>x.phone.trim().length>0 && x.status!=="suppressed" && x.permission!=="do-not-contact");
 const visible=eligible.filter(x=>!query||[x.business,x.location,x.phone].join(" ").toLowerCase().includes(query.toLowerCase())).slice(0,150);
 async function start(event:FormEvent){
  event.preventDefault();
  if(!lead)return;
  if(!window.confirm("AUTHORISE ONE CALL ONLY to "+lead.business+" at "+lead.phone+"? The call starts immediately. You confirm that you reviewed UK marketing-call rules, TPS/CTPS and do-not-call records, and accept responsibility for this decision."))return;
  setError("");setMessage("");setBusy(true);
  try{
   const res=await api("/api/admin/calls",{
    action:"launch",prospectId:lead.id,confirm:true,screeningVerified:screened,
    consentEvidence:evidence,consentDate
   });
   setLatest(res.call);setMessage(res.message);
   setEvidence("");setConsentDate("");setScreened(false);
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Call failed.");}
  finally{setBusy(false);}
 }
 async function reviewTranscript(){
  if(!latest)return;
  setError("");setBusy(true);
  try{
   const data=await api("/api/admin/calls/details?id="+encodeURIComponent(latest.id));
   setTranscript(data.transcript||[]);setProviderStatus(data.status||"unknown");
   if(!data.transcript?.length)setMessage("Transcript is not available yet; provider updates are not guaranteed in real time.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to retrieve transcript.");}
  finally{setBusy(false);}
 }
 async function hangup(){
  if(!latest)return;
  if(!window.confirm("END this live Twilio call immediately?"))return;
  setError("");setBusy(true);
  try{
   const res=await api("/api/admin/calls",{action:"hangup",id:latest.id,confirm:true});
   setLatest(res.call);setMessage(res.message);await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to end call.");}
  finally{setBusy(false);}
 }
 async function saveResult(event:FormEvent){
  event.preventDefault();if(!latest)return;
  setError("");setBusy(true);
  try{
   const status=outcome==="No answer"?"failed":"completed";
   const res=await api("/api/admin/calls",{
    action:"update",id:latest.id,status,outcome,operatorNotes
   });
   setLatest(res.call);setMessage("Call notes saved. This does not initiate a new call.");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}
  finally{setBusy(false);}
 }
 return <main className="aidp-admin aidp-calling">
 <header className="aidp-admin-head"><div><div className="aidp-admin-eyebrow">AI DIGITAL PRIME / OPERATOR CONTROL</div>
 <h1>One-to-one AI calling</h1><p>Choose the business, review its details and approve each call individually.</p></div>
 <div className="aidp-nav"><a className="aidp-btn aidp-btn-subtle" href="/admin/outreach">Prospect table</a><a className="aidp-btn aidp-btn-subtle" href="/admin">Dashboard</a></div></header>
 {error&&<div role="alert" className="aidp-admin-alert error">{error}</div>}
 {message&&<div role="status" className="aidp-admin-alert">{message}</div>}
 {auth==="checking"?<section className="aidp-panel"><p>Checking secure access…</p></section>:
 auth==="unauthorised"?<section className="aidp-panel aidp-login"><h2>Admin login required</h2><p>Sign in to the main dashboard before opening the operator console.</p><a className="aidp-btn" href="/admin">Secure login</a></section>:<>
 <section className="aidp-panel aidp-call-banner"><div><strong>Manual calls only</strong><p>No batch calling, auto-dialling schedule or autonomous next call. Each call requires a separate confirmation.</p></div>
 <span className="aidp-admin-billing">Live takeover: Enterprise only</span></section>
 <div className="aidp-call-layout">
 <section className="aidp-panel"><h2>1. Select business</h2>
 <input type="search" aria-label="Find prospect" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by company, location or phone"/>
 <p className="aidp-call-subtitle">{eligible.length} prospects with phone numbers (not all approved for calls)</p>
 <div className="aidp-call-prospects">{visible.map(p=><button type="button" key={p.id} className={p.id===selected?"selected":""} onClick={()=>{setSelected(p.id);setError("");setMessage("");setLatest(null)}}>
 <strong>{p.business}</strong><small>{p.phone} · {p.location||"UK"}</small></button>)}
 {!visible.length&&<p className="aidp-empty">No available phone numbers. Add a verified number in the prospect table first.</p>}</div>
 </section>
 <section className="aidp-panel">
 <h2>2. Review the prospect</h2>
 {!lead?<p className="aidp-empty">Select one business from the list.</p>:<>
 <div className="aidp-call-info"><p><strong>Business</strong><span>{lead.business}</span></p>
 <p><strong>Number</strong><span>{lead.phone}</span></p>
 <p><strong>Industry</strong><span>{lead.industry||"Not verified"}</span></p>
 <p><strong>Location</strong><span>{lead.location||"Not verified"}</span></p>
 <p><strong>Website</strong><span>{lead.website||"Not provided"}</span></p>
 <p><strong>Opening hours</strong><span>{lead.hours||"Not verified"}</span></p>
 <p><strong>Business observation</strong><span>{lead.observation||"No verified notes"}</span></p>
 <p><strong>Research source</strong><span>{lead.source||"Unknown"}</span></p>
 <p><strong>CRM status</strong><span>{lead.status}</span></p></div>
 {lead.sourceUrl&&<p><a href={lead.sourceUrl} target="_blank" rel="noreferrer">Check research source</a></p>}
 <p className="aidp-call-warning">The agent receives the business details as dynamic variables. Its underlying voice, prompt and model are not changed.</p>
 </>}
 </section>
 <section className="aidp-panel"><h2>3. Authorise this call</h2>
 {!lead?<p className="aidp-empty">Choose a prospect first.</p>:
 <form className="aidp-call-consent" onSubmit={start}>
 <p>UK rules for conversational AI marketing calls are not conclusively settled. Before each call, check TPS/CTPS and previous objections, assess whether the call is permitted, and record your decision. Operator supervision does not automatically make an AI call legally equivalent to a human live call. A public number alone is not sufficient.</p>
 <label>Operator compliance decision and source/check details
 <textarea rows={4} minLength={15} maxLength={1500} required placeholder="Example: Number checked against TPS/CTPS on [date]; no previous opt-out; source: business website; legal basis assessed by operator. Note any specific consent if available." value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
 <label>Checks completed at (date/time, UK)<input type="datetime-local" required value={consentDate} onChange={e=>setConsentDate(e.target.value)}/></label>
 <label className="aidp-call-check"><input type="checkbox" checked={screened} onChange={e=>setScreened(e.target.checked)}/>
 <span>I have checked TPS/CTPS, previous objections, verified the business number, reviewed the applicable UK legal rules and decided to authorise this one call. I understand monitoring alone does not guarantee the call is classed as live.</span></label>
 {!providerReady&&<p className="aidp-admin-alert error">ElevenLabs credentials are not configured.</p>}
 <button type="submit" disabled={busy||!providerReady||!screened||evidence.trim().length<15||!consentDate} className="aidp-btn aidp-btn-launch">
 {busy?"Processing…":"Authorise and call THIS business"}</button>
 </form>}
 </section>
 </div>
 {latest&&<section className="aidp-panel aidp-call-active"><div className="aidp-section-heading"><div><h2>Latest call: {latest.business}</h2>
 <p>ElevenLabs call initiation was confirmed; verify connection and progress in the provider console.</p></div></div>
 <div className="aidp-call-info"><p><strong>Conversation ID</strong><span>{latest.elevenConversationId||"Not yet supplied"}</span></p>
 <p><strong>Twilio call SID</strong><span>{latest.twilioCallSid||"Not yet supplied"}</span></p><p><strong>Status</strong><span>{latest.status}</span></p></div>
 <p className="aidp-call-warning">Live transcripts, remote hang-up and takeover require ElevenLabs real-time monitoring (Enterprise) or a separately implemented telephony supervisor bridge. Do not treat this page as a live audio monitoring tool.</p>
 <div className="aidp-call-review"><button type="button" className="aidp-btn aidp-btn-subtle" disabled={busy} onClick={reviewTranscript}>Refresh available transcript</button>
 {stopAvailable&&latest.twilioCallSid&&latest.status==="initiated"&&<button type="button" className="aidp-btn aidp-btn-danger" disabled={busy} onClick={hangup}>End this call</button>}{providerStatus&&<span>Provider status: {providerStatus}</span>}</div>
 {transcript.length>0&&<div className="aidp-call-transcript">{transcript.map((t,i)=><div key={i}><strong>{t.speaker}</strong><p>{t.text}</p></div>)}</div>}
 <form className="aidp-call-result" onSubmit={saveResult}><label>Call outcome<select value={outcome} onChange={e=>setOutcome(e.target.value)}>{outcomes.map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Operator notes<textarea rows={3} value={operatorNotes} onChange={e=>setOperatorNotes(e.target.value)} placeholder="Summary, objection, follow-up, do-not-call request…"/></label>
 <button type="submit" className="aidp-btn" disabled={busy}>Save notes</button></form>
 </section>}
 <section className="aidp-panel"><div className="aidp-section-heading"><div><h2>Call history</h2><p>Read-only log. All calls here were individually launched by an operator.</p></div><button className="aidp-btn aidp-btn-subtle" type="button" onClick={()=>refresh().catch(e=>setError(e.message))}>Refresh</button></div>
 {calls.length?<div className="aidp-table-wrap"><table><thead><tr><th>Business</th><th>Time (UTC)</th><th>Number</th><th>Status</th><th>Outcome</th><th>Details</th></tr></thead>
 <tbody>{calls.slice(0,50).map(c=><tr key={c.id}><td>{c.business}</td><td>{new Date(c.createdAt).toLocaleString("en-GB")}</td><td>{c.phone}</td><td>{c.status}</td><td>{c.outcome||"Not entered"}</td>
 <td><button type="button" onClick={()=>{setLatest(c);setOutcome(c.outcome||"No answer");setOperatorNotes(c.operatorNotes||"")}}>Open</button></td></tr>)}</tbody></table></div>:<div className="aidp-empty">No operator-approved calls logged yet.</div>}
 </section>
 <p className="aidp-footnote aidp-call-footer">This console does not place autonomous calls or modify the ElevenLabs sales agent. Consent verification is the operator's responsibility. Calls may involve personal data and must meet the relevant UK legal requirements.</p>
 </>}
 </main>;
}
