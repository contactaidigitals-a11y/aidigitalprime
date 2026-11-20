import { createHash, timingSafeEqual } from "node:crypto";
import { importProspects, readProspects, markExistingImportedProspectsOwnerReviewed } from "../_store";
import { noStore } from "../../_auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function authorized(req:Request){
 const secret=process.env.AIDP_CRM_BRIDGE_SECRET||"";
 const bearer=req.headers.get("authorization")||"";
 if(secret.length<40||!bearer.startsWith("Bearer "))return false;
 const actual=createHash("sha256").update(bearer.slice(7)).digest();
 const expected=createHash("sha256").update(secret).digest();
 return timingSafeEqual(expected,actual);
}
const str=(v:unknown,n:number)=>typeof v==="string"?v.trim().slice(0,n):"";
export async function POST(req:Request){
 if(!authorized(req))return noStore({error:"Not authorized"},401);
 if(Number(req.headers.get("content-length")||0)>160000)return noStore({error:"Batch too large"},413);
 try{
  const body=await req.json() as {leads?:unknown;action?:unknown};
  if(body.action==="mark-owner-reviewed"){
   const result=await markExistingImportedProspectsOwnerReviewed();
   return noStore({ok:true,...result});
  }
  if(!Array.isArray(body.leads)||body.leads.length>100)return noStore({error:"Expected up to 100 leads"},400);
  const rows=body.leads.filter(v=>v&&typeof v==="object"&&!Array.isArray(v)).map(v=>{
   const raw=v as Record<string,unknown>;
   const name=str(raw.company,150);
   const researchSource=str(raw.research_source,250);
   if(!name||!researchSource.startsWith("daily-leads:"))return null;
   const contact=str(raw.contact_email,180).toLowerCase();
   const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)?contact:"";
   const address=str(raw.address,160);
   const industry=str(raw.industry,100);
   return {
    business:name,companyNumber:str(raw.company_number,20),
    industry,location:address,website:str(raw.website,220),
    phone:str(raw.phone,40),hours:str(raw.business_hours,250),email,
    businessType:"unknown",source:"Public CRM — "+researchSource,
    sourceUrl:"",verifiedAt:"",
    observation:"",
    service:"AI Receptionist",
    notes:("Imported from partner CRM. "+str(raw.activity_description,180)+" "+str(raw.notes,380)).slice(0,650)
   };
  }).filter(Boolean);
  const result=await importProspects(rows);
  // All imported leads remain 'unverified'; never infer marketing consent.
  return noStore({ok:true,accepted:rows.length,...result});
 }catch(e){
  const message=e instanceof Error?e.message:"Sync failed";
  if(/limit|large|required|invalid/i.test(message))return noStore({error:message},400);
  return noStore({error:"CRM bridge import failed"},503);
 }
}

export async function GET(req:Request){
 if(!authorized(req))return noStore({error:"Not authorized"},401);
 const leads=await readProspects();
 const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const onDay=(at:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(at))===day;
 const drafts=leads.filter(x=>x.history.some(h=>h.action==="lark-draft"&&onDay(h.at)));
 const sent=leads.filter(x=>x.history.some(h=>h.action==="lark-sent"&&onDay(h.at)));
 return noStore({ok:true,day,total:leads.length,withEmail:leads.filter(x=>Boolean(x.email)).length,
  ownerReviewed:leads.filter(x=>x.permission==="owner-reviewed").length,
  readyToSend:leads.filter(x=>["owner-reviewed","corporate-reviewed","consented"].includes(x.permission)&&Boolean(x.email)&&!x.lastContactAt&&!["suppressed","contacted","replied","interested","meeting","not-interested"].includes(x.status)&&!x.history.some(h=>["unsubscribed","lark-sent","manual-sent","email-sent"].includes(h.action))).length,
  draftsToday:drafts.length,sentToday:sent.length,
  lastDraftAt:drafts.map(x=>x.history.filter(h=>h.action==="lark-draft"&&onDay(h.at)).at(-1)?.at).filter(Boolean).sort().at(-1)||null,
  lastSentAt:sent.map(x=>x.history.filter(h=>h.action==="lark-sent"&&onDay(h.at)).at(-1)?.at).filter(Boolean).sort().at(-1)||null
 });
}
