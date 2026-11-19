import { isAdmin, noStore } from "../../_auth";
import { readProspects } from "../../prospects/_store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const londonDate=(date:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
export async function GET(req:Request){
 if(!await isAdmin(req))return noStore({error:"Not authorised"},401);
 const day=londonDate(new Date()),prospects=await readProspects();
 const drafts=prospects.filter(p=>p.history.some(h=>h.action==="lark-draft"&&londonDate(new Date(h.at))===day)).length;
 const sent=prospects.filter(p=>p.history.some(h=>h.action==="lark-sent"&&londonDate(new Date(h.at))===day)).length;
 const eligible=prospects.filter(p=>p.permission!=="do-not-contact"&&/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(p.email)&&
  !["suppressed","contacted","not-interested","replied","interested","meeting"].includes(p.status)&&
  !p.history.some(h=>["unsubscribed","lark-draft","lark-sent","manual-sent","email-sent"].includes(h.action))).length;
 return noStore({day,goal:100,drafts,sent,eligible,window:"09:00–11:00 Europe/London",
  sendingEnabled:process.env.LARK_SEND_ENABLED==="true",schedulerConfigured:Boolean(process.env.OUTREACH_CRON_SECRET)});
}
