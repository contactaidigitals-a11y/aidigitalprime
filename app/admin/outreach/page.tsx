"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import "../admin.css";
import "./outreach.css";

type Status="new"|"researching"|"ready"|"contacted"|"replied"|"interested"|"meeting"|"not-interested"|"suppressed";
type Permission="unverified"|"corporate-reviewed"|"consented"|"do-not-contact";
type Prospect={
 id:string;business:string;companyNumber:string;incorporationDate:string;industry:string;location:string;
 website:string;phone:string;email:string;businessType:"ltd"|"llp"|"sole-trader"|"unknown";
 permission:Permission;consentEvidence:string;source:string;sourceUrl:string;verifiedAt:string;
 observation:string;service:string;notes:string;status:Status;subject:string;emailBody:string;
 lastContactAt:string;createdAt:string;history:{at:string;action:string;note:string}[];
};
type Discovered={business:string;companyNumber:string;incorporationDate:string;industry:string;location:string;website:string;phone:string;email:string;businessType:string;source:string;sourceUrl:string;service:string;observation:string;notes:string};
const blank = { business:"",location:"",industry:"",email:"",phone:"",website:"",source:"Manual",service:"New Business Launch" };
const statuses:Status[]=["new","researching","ready","contacted","replied","interested","meeting","not-interested","suppressed"];
const statusLabel=(status:string)=>status.replace(/-/g," ").replace(/^./,x=>x.toUpperCase());
async function api(url:string,payload?:unknown){
 const res=await fetch(url,{method:payload===undefined?"GET":"POST",cache:"no-store",credentials:"same-origin",
  headers:payload===undefined?undefined:{"Content-Type":"application/json"},body:payload===undefined?undefined:JSON.stringify(payload)});
 const data=await res.json();if(!res.ok)throw Error(data.error||"Request failed.");return data;
}
function parseTable(input:string):Record<string,string>[]{
 const source=input.trim();if(!source)return [];
 const delim=source.includes("\t")?"\t":",";
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
 for(let i=0;i<source.length;i++){
  const ch=source[i];
  if(ch==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(ch===delim&&!quoted){row.push(cell);cell="";}
  else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&source[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell="";}
  else cell+=ch;
 }
 row.push(cell);rows.push(row);
 const known=["business","industry","location","phone","website","hours","observation","source","verifiedAt","service","contactPermission","status","notes","email"];
 const head=rows[0].map(h=>h.replace(/[^a-z0-9]/gi,"").toLowerCase());
 const hasHeader=head.some(h=>["business","businessname","company","companyname","industry","website","observations","contactpermission"].includes(h));
 const headerAliases:Record<string,string>={
  business:"business",businessname:"business",company:"business",companyname:"business",firm:"business",
  industry:"industry",sector:"industry",location:"location",city:"location",phone:"phone",telephone:"phone",
  website:"website",url:"website",observation:"observation",observations:"observation",
  source:"source",sourcelink:"sourceUrl",verifieddate:"verifiedAt",dateverified:"verifiedAt",serviceopportunity:"service",
  service:"service",contactpermission:"contactPermission",leadstatus:"status",notes:"notes",email:"email",
  companynumber:"companyNumber",incorporationdate:"incorporationDate"
 };
 const headers=hasHeader?head.map((h,i)=>headerAliases[h]||known[i]||"ignore"):known;
 return rows.slice(hasHeader?1:0).filter(r=>r.some(c=>c.trim())).slice(0,200).map(r=>{
  const o:Record<string,string>={};headers.forEach((k,i)=>{if(k!=="ignore")o[k]=(r[i]||"").trim()});return o;
 }).filter(x=>Boolean(x.business));
}
export default function OutreachPage(){
 const [auth,setAuth]=useState<"checking"|"required"|"ready">("checking");
 const [leads,setLeads]=useState<Prospect[]>([]);
 const [filter,setFilter]=useState<Status|"all">("all");
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState("");
 const [discoveryReady,setDiscoveryReady]=useState(false);
 const [sheetSyncReady,setSheetSyncReady]=useState(false);
 const [sheetShareEmail,setSheetShareEmail]=useState("");
 const [found,setFound]=useState<Discovered[]>([]);
 const [days,setDays]=useState(30);
 const [offset,setOffset]=useState(0);
 const [newForm,setNewForm]=useState(blank);
 const [paste,setPaste]=useState("");
 const [details,setDetails]=useState<Prospect|null>(null);
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [panel,setPanel]=useState<"discovery"|"import"|"manual">("discovery");
 const load=async()=>{const data=await api("/api/admin/prospects");setLeads(data.leads)};
 useEffect(()=>{let alive=true;api("/api/admin/auth").then(async d=>{
  if(!alive)return;
  if(!d.authenticated){setAuth("required");return}
  setAuth("ready");
  await load();
  const [res,sheet]=await Promise.all([api("/api/admin/discovery"),api("/api/admin/sheets-sync")]);
  if(alive){setDiscoveryReady(res.configured);setSheetSyncReady(sheet.configured);setSheetShareEmail(sheet.serviceAccountEmail||"");}
 }).catch(e=>{if(alive){setError(e.message);setAuth("required")}});return()=>{alive=false}},[]);
 const stats=useMemo(()=>({total:leads.length,ready:leads.filter(x=>x.status==="ready").length,
 contacted:leads.filter(x=>x.status==="contacted").length,
 replies:leads.filter(x=>["replied","interested","meeting"].includes(x.status)).length}),[leads]);
 const filtered=useMemo(()=>leads.filter(l=>(filter==="all"||l.status===filter)&&
  (!search||[l.business,l.companyNumber,l.email,l.location,l.industry].some(v=>v.toLowerCase().includes(search.toLowerCase())))),[leads,filter,search]);
 async function submit(action:string,callback:()=>Promise<void>){
  setBusy(action);setError("");setNotice("");
  try{await callback()}catch(e){setError(e instanceof Error?e.message:"Unable to complete action.")}
  finally{setBusy("")}
 }
 async function discover(){
  await submit("discover",async()=>{
   const res=await api("/api/admin/discovery",{days,limit:100,offset});
   setFound(res.leads);setNotice("Found "+res.leads.length+" Companies House registrations. Public contacts still need manual verification.");
  });
 }
 async function syncSheet(){
  await submit("sync-sheet",async()=>{
    const res=await api("/api/admin/sheets-sync",{});
    await load();setNotice("Google Sheets: "+res.created+" new, "+res.updated+" updated, "+res.skipped+" unchanged or excluded. No calls made.");
  });
 }
 async function importFound(){
  await submit("import-found",async()=>{
   const result=await api("/api/admin/prospects",{action:"import",leads:found});
   await load();setNotice("Imported "+result.created+" businesses; "+result.duplicates+" duplicates skipped.");
  });
 }
 async function importPasted(){
  await submit("paste",async()=>{
   const rows=parseTable(paste);
   if(!rows.length)throw Error("No businesses found. Copy the rows from your Google Sheet, including the Business column.");
   const result=await api("/api/admin/prospects",{action:"import",leads:rows});
   setPaste("");await load();setNotice("Imported "+result.created+" businesses, skipped "+result.duplicates+" duplicates.");
  });
 }
 async function addManual(event:FormEvent){
  event.preventDefault();await submit("manual",async()=>{
   const result=await api("/api/admin/prospects",{action:"import",leads:[newForm]});
   await load();setNewForm(blank);setNotice(result.created?"Business added.":"Duplicate business already exists.");
  });
 }
 async function saveDetails(event:FormEvent){
  event.preventDefault();if(!details)return;
  await submit("save",async()=>{
   await api("/api/admin/prospects",{...details,action:"save"});
   await load();setNotice("Prospect updated.");
  });
 }
 async function act(action:string){
  if(!details)return;
  await submit(action,async()=>{
   await api("/api/admin/prospects",{id:details.id,action});
   const list=(await api("/api/admin/prospects")).leads as Prospect[];
   setLeads(list);setDetails(list.find(x=>x.id===details.id)||null);
   setNotice(action==="redraft"?"Draft regenerated.":action==="suppress"?"Contact suppressed.":"Manual send recorded.");
  });
 }
 function mailTo(lead:Prospect){
  const body=lead.emailBody+"\n\nTo opt out of future emails, reply unsubscribe.";
  const url="mailto:"+encodeURIComponent(lead.email)+"?subject="+encodeURIComponent(lead.subject)+"&body="+encodeURIComponent(body);
  window.location.href=url;
 }
 async function aiDraft(){
  if(!details)return;
  await submit("ai-draft",async()=>{
   const res=await api("/api/admin/prospects/ai-draft",{id:details.id});
   setDetails(prev=>prev?{...prev,subject:res.subject,emailBody:res.body}:prev);
   setNotice("AI draft generated using saved details. Review it, then click Save lead & draft.");
  });
 }
 async function optedInSend(){
  if(!details)return;
  if(!window.confirm("Send this email using Resend? Only use this for documented opted-in contacts."))return;
  await submit("send",async()=>{
   const res=await api("/api/admin/prospects/send",{id:details.id,confirm:true});
   await load();setNotice(res.message);
  });
 }
 const change=(k:keyof Prospect,v:string)=>setDetails(d=>d?{...d,[k]:v}:d);
 return <main className="aidp-admin aidp-outreach">
  <header className="aidp-admin-head"><div><div className="aidp-admin-eyebrow">AI DIGITAL PRIME / PROSPECTING CRM</div>
   <h1>Lead discovery & outreach</h1><p>Find UK businesses, personalise emails and manage every follow-up.</p></div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><a className="aidp-btn aidp-btn-subtle" href="/admin/calling">Manual calling</a><a className="aidp-btn aidp-btn-subtle" href="/admin">Back to dashboard</a></div>
  </header>
  {error&&<div className="aidp-admin-alert error" role="alert">{error}</div>}
  {notice&&<div className="aidp-admin-alert" role="status">{notice}</div>}
  {auth==="checking"?<section className="aidp-panel"><p>Checking access…</p></section>:
  auth==="required"?<section className="aidp-panel aidp-login"><h2>Private access required</h2><p>Sign in to the main dashboard with your email verification code.</p><a href="/admin" className="aidp-btn">Go to secure login</a></section>:<>
   <div className="aidp-kpis">
    <div className="aidp-kpi"><span>Businesses in pipeline</span><strong>{stats.total}</strong><small>Deduplicated</small></div>
    <div className="aidp-kpi"><span>Ready for review</span><strong>{stats.ready}</strong><small>Contacts verified by operator</small></div>
    <div className="aidp-kpi"><span>Contacted</span><strong>{stats.contacted}</strong><small>Sent or manually marked</small></div>
    <div className="aidp-kpi"><span>Replies / interested / meetings</span><strong>{stats.replies}</strong><small>Operator-updated</small></div>
   </div>
   <div className="aidp-outreach-grid">
    <section className="aidp-panel">
     <div className="aidp-section-heading"><div><h2>Find or add businesses</h2><p>Import a list, discover new LTDs or add a single company.</p></div></div>
     <div className="aidp-tabs">
      {(["discovery","import","manual"] as const).map(p=><button key={p} className={panel===p?"active":""} type="button" onClick={()=>setPanel(p)}>{p==="discovery"?"Companies House":p==="import"?"Import from Sheets":"Add manually"}</button>)}
     </div>
     {panel==="discovery"&&<div className="aidp-form-stack">
      <p className="aidp-outreach-tip">Search official UK company registrations. Company records do not supply email addresses; verify them from the business website.</p>
      {!discoveryReady&&<p className="aidp-config-warning">Connect an API key in Railway: <code>COMPANIES_HOUSE_API_KEY</code>. <a href="https://developer.company-information.service.gov.uk/" target="_blank" rel="noreferrer">Companies House API setup</a></p>}
      <div className="aidp-inline-inputs"><label>Incorporated within
       <select value={days} onChange={e=>{setDays(Number(e.target.value));setOffset(0)}}><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option></select>
       </label><label>Start index
       <input type="number" min="0" max="4900" value={offset} onChange={e=>setOffset(Number(e.target.value)||0)}/>
       </label></div>
      <div className="aidp-form-actions"><button type="button" className="aidp-btn" onClick={discover} disabled={!!busy||!discoveryReady}>{busy==="discover"?"Searching…":"Find up to 100 LTDs"}</button>
       {!!found.length&&<button type="button" className="aidp-btn aidp-btn-subtle" disabled={!!busy} onClick={importFound}>Add {found.length} results to CRM</button>}</div>
      {!!found.length&&<div className="aidp-discovery-results">{found.slice(0,10).map(f=><div key={f.companyNumber}><strong>{f.business}</strong><small>{f.location||"UK"} · {f.incorporationDate||"Date not provided"}</small></div>)}
       {found.length>10&&<p>…and {found.length-10} other registrations.</p>}</div>}
     </div>}
     {panel==="import"&&<div className="aidp-form-stack">
      <p className="aidp-outreach-tip"><strong>Connect the existing lead Sheet:</strong> Synchronize verified research from tab Foaie1 into the call table. {sheetSyncReady?"The Google connection is configured.":"A Google service account must be configured in Railway and given read access to the spreadsheet."}</p>
      {sheetShareEmail&&<p className="aidp-outreach-tip">Share the Google Sheet (Viewer) with: <strong>{sheetShareEmail}</strong></p>}
      <button className="aidp-btn" type="button" disabled={!!busy||!sheetSyncReady} onClick={syncSheet}>{busy==="sync-sheet"?"Synchronising…":"Sync from Google Sheets"}</button>
      <p className="aidp-outreach-tip">Alternatively, paste rows below if the Google connection is not configured yet.</p>
      <p className="aidp-outreach-tip">Open the existing “Calinescu Technologies – Business Leads” Sheet, copy its rows (columns A:M), and paste below. Comma-separated CSV with headers also works. Email addresses can be added later.</p>
      <textarea rows={8} value={paste} onChange={e=>setPaste(e.target.value)} placeholder={"Business\tIndustry\tLocation\tPhone\tWebsite\tHours\tObservation\tSource\tVerified date\tService opportunity\tContact permission\tLead status\tNotes"}/>
      <button className="aidp-btn" type="button" disabled={!!busy||!paste.trim()} onClick={importPasted}>{busy==="paste"?"Importing…":"Import companies and skip duplicates"}</button>
     </div>}
     {panel==="manual"&&<form className="aidp-form-stack" onSubmit={addManual}>
      {([["business","Business name *"],["industry","Industry"],["location","Location"],["email","Business email"],["phone","Phone"],["website","Website"]] as const).map(([key,label])=><label key={key}>{label}<input required={key==="business"} value={newForm[key]} onChange={e=>setNewForm(f=>({...f,[key]:e.target.value}))}/></label>)}
      <button className="aidp-btn" disabled={!!busy} type="submit">Add business</button>
     </form>}
    </section>
    <section className="aidp-panel">
     <div className="aidp-section-heading"><div><h2>Lead pipeline</h2><p>Click a business to prepare outreach or update its status.</p></div></div>
     <div className="aidp-lead-filters"><input type="search" placeholder="Search business, company number or email" value={search} onChange={e=>setSearch(e.target.value)}/>
      <select value={filter} onChange={e=>setFilter(e.target.value as Status|"all")}><option value="all">All stages</option>{statuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></div>
     <div className="aidp-prospect-list">{filtered.length?filtered.slice(0,300).map(l=><button className={"aidp-prospect "+(selected===l.id?"selected":"")} onClick={()=>{setSelected(l.id);setDetails({...l});}} key={l.id}>
      <span><strong>{l.business}</strong><small>{l.industry||l.location||l.companyNumber||"UK business"}</small></span>
      <span className={"aidp-prospect-stage "+l.status}>{statusLabel(l.status)}</span>
      <small className="aidp-prospect-email">{l.email||"Find email"}</small>
     </button>):<div className="aidp-empty">No prospects match this filter.</div>}</div>
     {filtered.length>300&&<p className="aidp-footnote">Showing the first 300 matches; use search to narrow results.</p>}
    </section>
   </div>
   {details&&<section className="aidp-panel aidp-lead-detail" id="lead-detail">
    <div className="aidp-section-heading"><div><h2>Prospect: {details.business}</h2><p>Update verified facts, draft email and track next steps.</p></div><button type="button" className="aidp-btn aidp-btn-subtle" onClick={()=>{setDetails(null);setSelected("")}}>Close</button></div>
    <form onSubmit={saveDetails}>
     <div className="aidp-lead-fields">
      {([["business","Business"],["companyNumber","Company number"],["incorporationDate","Incorporated (YYYY-MM-DD)"],["industry","Industry"],["location","Location"],["website","Website"],["phone","Phone"],["email","Email"],["source","Lead source"],["sourceUrl","Source URL"],["verifiedAt","Verified date"]] as const).map(([key,label])=><label key={key}>{label}<input value={details[key]} onChange={e=>change(key,e.target.value)}/></label>)}
      <label>Legal entity<select value={details.businessType} onChange={e=>change("businessType",e.target.value)}>
       <option value="unknown">Not confirmed</option><option value="ltd">Limited company (LTD)</option><option value="llp">LLP</option><option value="sole-trader">Sole trader</option></select></label>
      <label>Email eligibility<select value={details.permission} onChange={e=>change("permission",e.target.value)}>
       <option value="unverified">Not verified — do not send</option><option value="corporate-reviewed">Corporate recipient reviewed (manual email only)</option>
       <option value="consented">Explicit opt-in documented</option><option value="do-not-contact">Do not contact</option>
      </select></label>
      <label>Pipeline status<select value={details.status} onChange={e=>change("status",e.target.value)}>
       {statuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></label>
      <label>Proposed service<select value={details.service} onChange={e=>change("service",e.target.value)}>
       {["New Business Launch","AI Receptionist","Website","Chatbot"].map(s=><option key={s}>{s}</option>)}</select></label>
      <label className="wide">Opt-in evidence (required for API sending)<input placeholder="When and how the contact consented to marketing" value={details.consentEvidence} onChange={e=>change("consentEvidence",e.target.value)}/></label>
      <label className="wide">Verified observation / reason to contact<textarea rows={2} value={details.observation} onChange={e=>change("observation",e.target.value)}/></label>
      <label className="wide">Notes<textarea rows={2} value={details.notes} onChange={e=>change("notes",e.target.value)}/></label>
      <label className="wide">Email subject<input value={details.subject} onChange={e=>change("subject",e.target.value)}/></label>
      <label className="wide">Personalised email draft<textarea rows={12} value={details.emailBody} onChange={e=>change("emailBody",e.target.value)}/></label>
     </div>
     <div className="aidp-form-actions">
      <button className="aidp-btn" type="submit" disabled={!!busy}>{busy==="save"?"Saving…":"Save lead & draft"}</button>
      <button className="aidp-btn aidp-btn-subtle" type="button" disabled={!!busy} onClick={()=>act("redraft")}>Regenerate draft from saved facts</button>
      <button className="aidp-btn aidp-btn-subtle" type="button" disabled={!!busy} onClick={aiDraft}>{busy==="ai-draft"?"Writing…":"Generate with AI"}</button>
      {details.email&&details.permission==="corporate-reviewed"&&details.status!=="suppressed"&&<button className="aidp-btn aidp-btn-subtle" type="button" onClick={()=>mailTo(details)}>Open in email app</button>}
      {details.email&&details.permission==="corporate-reviewed"&&<button className="aidp-btn aidp-btn-subtle" type="button" disabled={!!busy} onClick={()=>act("manual-sent")}>Mark manually sent</button>}
      {details.email&&details.permission==="consented"&&<button className="aidp-btn aidp-btn-subtle" type="button" disabled={!!busy} onClick={optedInSend}>Send opted-in email</button>}
      {details.status!=="suppressed"&&<button className="aidp-btn aidp-btn-danger" type="button" disabled={!!busy} onClick={()=>{if(window.confirm("Block all future marketing to this company?"))act("suppress")}}>Do not contact</button>}
     </div>
    </form>
    <p className="aidp-footnote">Changes must be saved before emailing. Resend is only used for contacts with documented consent. For cold corporate B2B outreach, use a manually reviewed, compliant email provider. The dashboard does not access your inbox automatically, so replies must currently be marked manually.</p>
    <h3 className="aidp-history-heading">Activity history</h3>
    <div className="aidp-history">{(details.history||[]).slice().reverse().map((h,i)=><div key={i}><strong>{statusLabel(h.action)}</strong><span>{new Date(h.at).toLocaleString("en-GB")}</span><p>{h.note}</p></div>)}</div>
   </section>}
   <p className="aidp-footnote aidp-legal-note">Only verified public business contacts. Do not send unsolicited email to sole traders or unverified recipients. Honor all opt-outs. No bulk cold emailing is enabled.</p>
  </>}
 </main>;
}
