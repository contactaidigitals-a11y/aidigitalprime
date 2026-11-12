import { isAdmin, noStore, safeOrigin } from "../../_auth";
import { readProspects, recordSend } from "../_store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 if(!safeOrigin(req))return noStore({error:"Request not allowed."},403);
 if(!await isAdmin(req))return noStore({error:"Not authorised."},401);
 let data:{id?:string;confirm?:boolean};
 try{data=await req.json();}catch{return noStore({error:"Invalid request."},400);}
 if(data.confirm!==true)return noStore({error:"Explicit confirmation required."},400);
 const lead=(await readProspects()).find(x=>x.id===data.id);
 if(!lead)return noStore({error:"Prospect not found."},404);
 // Resend's AUP forbids cold outreach: only documented opt-ins may be sent through the API.
 if(lead.permission!=="consented"||!lead.consentEvidence||lead.status==="suppressed"||
    lead.history.some(x=>x.action==="unsubscribed"))return noStore({error:"Automated sending is restricted to documented opt-in contacts only."},403);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))return noStore({error:"Valid recipient email required."},400);
 if(!lead.subject||!lead.emailBody)return noStore({error:"Create a draft first."},400);
 if(!process.env.RESEND_API_KEY||!process.env.LEAD_FROM_EMAIL)return noStore({error:"Email provider is not configured."},503);
 const base="https://aidigitalprime.co.uk";
 const unsubscribe=base+"/outreach/unsubscribe?token="+lead.unsubscribeToken;
 const body=lead.emailBody+"\n\nUnsubscribe: "+unsubscribe;
 try{
   const response=await fetch("https://api.resend.com/emails",{
     method:"POST",signal:AbortSignal.timeout(12000),
     headers:{
       Authorization:"Bearer "+process.env.RESEND_API_KEY,
       "Content-Type":"application/json",
       "Idempotency-Key":"aidp-prospect-"+lead.id+"-"+(lead.lastContactAt||"first")
     },
     body:JSON.stringify({from:process.env.LEAD_FROM_EMAIL,to:[lead.email],
       reply_to:process.env.LEAD_TO_EMAIL||"contact.aidigitals@gmail.com",
       subject:lead.subject.slice(0,220),text:body,
       headers:{"List-Unsubscribe":"<"+unsubscribe+">"} })
   });
   if(!response.ok)return noStore({error:"Email provider did not accept this message ("+response.status+")."},502);
   await recordSend(lead.id);
   return noStore({ok:true,message:"Email accepted by provider. Delivery/reply tracking requires separate provider webhooks."});
 }catch{return noStore({error:"Email send failed; review provider logs before retrying."},502);}
}
