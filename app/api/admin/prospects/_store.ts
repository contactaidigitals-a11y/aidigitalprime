import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.env.AIDP_USAGE_DATA_DIR || "/data/aidp-usage";
const FILE = path.join(ROOT, "prospects.json");
const MAX = 10000;
export type ProspectStatus = "new" | "researching" | "ready" | "contacted" | "replied" | "interested" | "meeting" | "not-interested" | "suppressed";
export type Prospect = {
  id: string;
  business: string;
  companyNumber: string;
  incorporationDate: string;
  industry: string;
  location: string;
  website: string;
  phone: string;
  hours?: string;
  email: string;
  businessType: "ltd" | "llp" | "sole-trader" | "unknown";
  permission: "unverified" | "corporate-reviewed" | "consented" | "do-not-contact";
  consentEvidence: string;
  source: string;
  sourceUrl: string;
  verifiedAt: string;
  observation: string;
  service: string;
  notes: string;
  status: ProspectStatus;
  subject: string;
  emailBody: string;
  unsubscribeToken: string;
  lastContactAt: string;
  createdAt: string;
  updatedAt: string;
  history: { at: string; action: string; note: string }[];
};
const clean = (v: unknown, n=300) => typeof v === "string" ? v.trim().slice(0,n) : "";
const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g,"");
const emailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(f: () => Promise<T>): Promise<T> {
  const next = queue.then(f, f); queue = next.then(()=>{},()=>{}); return next;
}
export async function readProspects(): Promise<Prospect[]> {
  try {
    const o: unknown = JSON.parse(await readFile(FILE,"utf8"));
    return Array.isArray(o) ? o.filter(x=>x&&typeof x.id==="string") as Prospect[] : [];
  } catch(err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}
async function commit(rows: Prospect[]) {
  await mkdir(ROOT,{recursive:true,mode:0o700});
  const tmp=FILE+"."+randomBytes(8).toString("hex");
  await writeFile(tmp,JSON.stringify(rows),{mode:0o600});
  await rename(tmp,FILE);
}
export function makeDraft(lead: Pick<Prospect,"business"|"incorporationDate"|"observation"|"service">) {
  const business = lead.business.replace(/[\r\n]/g," ").slice(0,120);
  const subject = "A quick idea for " + business;
  const launch = /^\d{4}-\d{2}-\d{2}$/.test(lead.incorporationDate) ? "Congratulations on your recent company launch. " : "";
  const observed = lead.observation.trim() ? "I noticed " + lead.observation.replace(/[\r\n]+/g," ").slice(0,180).replace(/[.!?]+$/,"") + ". " : "";
  const service = lead.service === "Website" ? "a professional website that makes it easy for customers to discover and contact you"
    : lead.service === "Chatbot" ? "a website assistant to help answer common customer questions"
    : lead.service === "New Business Launch" ? "a straightforward digital launch package for a newly formed business"
    : "an AI phone receptionist to answer customer calls, including outside normal opening hours";
  const body = "Hello " + business + " team,\n\n" +
    launch + observed +
    "I'm contacting you from AI Digital Prime, operated by CALINESCU TECHNOLOGIES LTD. We help UK businesses with " + service + ".\n\n" +
    "Would it be useful if I sent you a short example of how this could work for your business?\n\n" +
    "Best regards,\nAI Digital Prime\nhttps://aidigitalprime.co.uk\n\n" +
    "If you prefer not to receive any further emails, just reply 'unsubscribe'.";
  return { subject, body };
}
function seed(raw: Record<string,unknown>, now: string): Prospect {
  const business=clean(raw.business || raw.company_name || raw.name,150);
  const companyNumber=clean(raw.companyNumber || raw.company_number,20).toUpperCase();
  if (!business || business.length<2) throw new Error("Business name is required.");
  const date=clean(raw.incorporationDate || raw.date_of_creation,12);
  const type=["ltd","llp","sole-trader"].includes(String(raw.businessType))?String(raw.businessType):companyNumber?"ltd":"unknown";
  const prospect: Prospect={
    id:randomUUID(),business,companyNumber,incorporationDate:date,
    industry:clean(raw.industry,100),location:clean(raw.location,160),website:clean(raw.website,220),
    phone:clean(raw.phone,40),hours:clean(raw.hours || raw.business_hours,250),email:clean(raw.email,180).toLowerCase(),
    businessType:type as Prospect["businessType"],
    permission:"unverified",consentEvidence:"",source:clean(raw.source,100)||"Manual import",
    sourceUrl:clean(raw.sourceUrl,350),verifiedAt:clean(raw.verifiedAt,35),
    observation:clean(raw.observation,400),service:clean(raw.service,80)||"New Business Launch",
    notes:clean(raw.notes,1000),status:"new",subject:"",emailBody:"",
    unsubscribeToken:randomBytes(24).toString("hex"),lastContactAt:"",
    createdAt:now,updatedAt:now,history:[{at:now,action:"created",note:"Imported into lead pipeline"}]
  };
  const draft=makeDraft(prospect);
  prospect.subject=draft.subject; prospect.emailBody=draft.body;
  return prospect;
}
export async function importProspects(input: unknown[]): Promise<{created:number;duplicates:number;total:number}> {
  if(input.length>200)throw Error("Import is limited to 200 businesses per request.");
  return serial(async()=>{
    const leads=await readProspects(),now=new Date().toISOString();
    let created=0,duplicates=0;
    for(const entry of input){
      if(!entry||typeof entry!=="object"||Array.isArray(entry))continue;
      let prospect:Prospect;
      try{prospect=seed(entry as Record<string,unknown>,now);}catch{continue;}
      const exists=leads.some(x=>
        (prospect.companyNumber&&x.companyNumber===prospect.companyNumber) ||
        (prospect.email&&x.email===prospect.email) ||
        (norm(x.business)===norm(prospect.business)&&norm(x.location)===norm(prospect.location)));
      if(exists){duplicates++;continue;}
      if(leads.length>=MAX)throw Error("Lead database limit reached.");
      leads.push(prospect);created++;
    }
    if(created)await commit(leads);
    return {created,duplicates,total:leads.length};
  });
}
export async function updateProspect(raw:Record<string,unknown>):Promise<Prospect[]>{
  return serial(async()=>{
    const leads=await readProspects(),id=clean(raw.id,50);
    const index=leads.findIndex(x=>x.id===id);
    if(index<0)throw Error("Prospect not found.");
    const previous=leads[index];
    if(raw.action==="suppress"){
      previous.status="suppressed";previous.permission="do-not-contact";
      previous.history.push({at:new Date().toISOString(),action:"suppressed",note:"Suppressed in all future outreach"});
    }else if(raw.action==="manual-sent"){
      if(!previous.email || !emailValid(previous.email) || !["corporate-reviewed","consented"].includes(previous.permission) || previous.status==="suppressed")throw Error("Enter a valid permitted email first.");
      previous.status="contacted";previous.lastContactAt=new Date().toISOString();
      previous.history.push({at:previous.lastContactAt,action:"manual-sent",note:"Marked as sent by operator; not independently verified"});
    }else if(raw.action==="save"){
      const wasSuppressed=previous.status==="suppressed" || previous.permission==="do-not-contact" || previous.history.some(h=>h.action==="unsubscribed");
      for(const field of ["business","companyNumber","incorporationDate","industry","location","website","phone","hours","email","source","sourceUrl","verifiedAt","observation","service","notes","subject","emailBody","consentEvidence"] as const){
        if(Object.prototype.hasOwnProperty.call(raw,field)) (previous[field] as string)=clean(raw[field],field==="emailBody"?6000:field==="notes"?1000:field==="subject"?220:field==="observation"?400:350);
      }
      previous.email=previous.email.toLowerCase();
      if(!previous.business)throw Error("Business name is required.");
      if(previous.email&&!emailValid(previous.email))throw Error("Invalid email address.");
      const type=raw.businessType;
      if(typeof type==="string"&&["ltd","llp","sole-trader","unknown"].includes(type))previous.businessType=type as Prospect["businessType"];
      const perm=raw.permission;
      if(typeof perm==="string"&&["unverified","corporate-reviewed","consented","do-not-contact"].includes(perm))previous.permission=perm as Prospect["permission"];
      const status=raw.status;
      if(typeof status==="string"&&["new","researching","ready","contacted","replied","interested","meeting","not-interested","suppressed"].includes(status))previous.status=status as ProspectStatus;
      if(previous.permission==="consented"&&!previous.consentEvidence)throw Error("Record proof of opt-in before selecting consented.");
      if(previous.permission==="corporate-reviewed"&&!["ltd","llp"].includes(previous.businessType))throw Error("Only verified corporate entities can be marked corporate-reviewed.");
      if(wasSuppressed || previous.permission==="do-not-contact" || previous.status==="suppressed"){
        previous.status="suppressed";previous.permission="do-not-contact";
      }
      if(previous.email && leads.some(x=>x.id!==id&&x.email===previous.email))throw Error("This email belongs to another prospect.");
      previous.history.push({at:new Date().toISOString(),action:"updated",note:"Details reviewed or status updated"});
    }else if(raw.action==="redraft"){
      const draft=makeDraft(previous);previous.subject=draft.subject;previous.emailBody=draft.body;
      previous.history.push({at:new Date().toISOString(),action:"draft",note:"Personalised draft regenerated"});
    }else throw Error("Unknown action.");
    previous.updatedAt=new Date().toISOString();
    previous.history=previous.history.slice(-40);
    leads[index]=previous;await commit(leads);
    return leads;
  });
}
export async function recordSend(id:string):Promise<void>{
  await serial(async()=>{
    const leads=await readProspects(),item=leads.find(x=>x.id===id);
    if(!item)throw Error("Prospect not found.");
    const at=new Date().toISOString();
    item.status="contacted";item.lastContactAt=at;item.updatedAt=at;
    item.history.push({at,action:"email-sent",note:"Resend accepted an opted-in email"});
    item.history=item.history.slice(-40);
    await commit(leads);
  });
}
export async function unsubscribe(token:string):Promise<boolean>{
  if(!/^[a-f0-9]{48}$/.test(token))return false;
  return serial(async()=>{
    const leads=await readProspects(),item=leads.find(x=>x.unsubscribeToken===token);
    if(!item)return false;
    item.status="suppressed";item.permission="do-not-contact";
    const at=new Date().toISOString();
    item.updatedAt=at;item.history.push({at,action:"unsubscribed",note:"Recipient unsubscribed"});
    await commit(leads);return true;
  });
}


/**
 * Import verified research rows from the pre-existing Google Sheet into the
 * local CRM consumed by the operator calling screen.
 *
 * Never grant calling permission based on a spreadsheet cell. Never undo
 * opt-outs or replace operator-edited phone details.
 */
export async function mergeSheetProspects(input: Record<string,unknown>[]):Promise<{created:number;updated:number;skipped:number;total:number}> {
 if(input.length>1000)throw Error("Sheet sync limit exceeded.");
 return serial(async()=>{
  const leads=await readProspects(),now=new Date().toISOString();
  let created=0,updated=0,skipped=0;
  for(const raw of input) {
   const source=clean(raw.source,300);
   const permission=clean(raw.contactPermission,100);
   const status=clean(raw.leadStatus,100);
   if(/simulation|synthetic|fictional/i.test(source+" "+permission+" "+status)){skipped++;continue;}
   let next:Prospect;
   try{next=seed(raw,now);}catch{skipped++;continue;}
   const match=leads.find(x=>
    (next.companyNumber && x.companyNumber===next.companyNumber) ||
    (norm(x.business)===norm(next.business) && norm(x.location)===norm(next.location))
   );
   if(!match) {
    if(leads.length>=MAX)break;
    next.status="researching";
    next.history.push({at:now,action:"sheet-sync",note:"Imported from the existing research Sheet; no call approval is implied"});
    leads.push(next);created++;continue;
   }
   let changed=false;
   for(const key of ["phone","hours","website","industry","location","observation","source","sourceUrl","incorporationDate","companyNumber"] as const){
    const incoming=next[key],existing=match[key];
    if(!existing && incoming){match[key]=incoming;changed=true;}
   }
   if(changed){
    match.updatedAt=now;
    match.history.push({at:now,action:"sheet-sync",note:"Filled missing details from research Sheet"});
    match.history=match.history.slice(-40);
    updated++;
   }else skipped++;
  }
  if(created||updated)await commit(leads);
  return {created,updated,skipped,total:leads.length};
 });
}
