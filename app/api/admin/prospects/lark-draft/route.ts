import { isAdmin, noStore, safeOrigin } from "../../_auth";
import { readProspects, recordLarkDraft } from "../_store";
import { larkAccessToken } from "../../lark/_tokens";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const inflight=new Set<string>();
const validEmail=(email:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
function header(text:string){
 const safe=text.replace(/[\r\n\x00-\x1f\x7f]/g," ").trim().slice(0,220);
 return /[^\x20-\x7e]/.test(safe)?"=?UTF-8?B?"+Buffer.from(safe,"utf8").toString("base64")+"?=":safe;
}
function makeEml(to:string,subject:string,body:string){
 const content=Buffer.from(body.replace(/\r?\n/g,"\r\n"),"utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n")||"";
 const eml=[
  "From: AI Digital Prime Sales <sales@aidigitalprime.co.uk>",
  "To: <"+to+">",
  "Subject: "+header(subject),
  "MIME-Version: 1.0",
  "Content-Type: text/plain; charset=UTF-8",
  "Content-Transfer-Encoding: base64",
  "X-AIDP-Draft: true",
  "",
  content,
  ""
 ].join("\r\n");
 return Buffer.from(eml,"utf8").toString("base64url");
}
export async function POST(req:Request){
 if(!safeOrigin(req))return noStore({error:"Request not allowed"},403);
 if(!await isAdmin(req))return noStore({error:"Not authorised"},401);
 let id="";
 try{const data=await req.json() as {id?:unknown};if(typeof data.id==="string")id=data.id;}
 catch{return noStore({error:"Invalid request"},400);}
 if(!/^[a-zA-Z0-9-]{8,80}$/.test(id))return noStore({error:"Invalid lead ID"},400);
 if(inflight.has(id))return noStore({error:"Draft creation is already in progress for this lead"},409);
 inflight.add(id);
 try{
  const lead=(await readProspects()).find(x=>x.id===id);
  if(!lead)return noStore({error:"Lead not found"},404);
  if(lead.status==="suppressed"||lead.permission==="do-not-contact"||lead.history.some(x=>x.action==="unsubscribed"))
   return noStore({error:"This lead is blocked from outreach"},403);
  if(lead.history.some(x=>x.action==="lark-draft"))
   return noStore({error:"A Lark draft already exists for this lead; check the activity history"},409);
  if(!validEmail(lead.email)||!lead.subject?.trim()||!lead.emailBody?.trim())
   return noStore({error:"Save a valid email address, subject and body in the CRM first"},400);
  const token=await larkAccessToken();
  const mailbox=process.env.LARK_MAILBOX||"sales@aidigitalprime.co.uk";
  if(mailbox.toLowerCase()!=="sales@aidigitalprime.co.uk")
   return noStore({error:"Unexpected Lark mailbox configuration"},503);
  const url="https://open.larksuite.com/open-apis/mail/v1/user_mailboxes/"+encodeURIComponent(mailbox)+"/drafts";
  const response=await fetch(url,{
   method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json; charset=utf-8"},
   body:JSON.stringify({raw:makeEml(lead.email,lead.subject,lead.emailBody)}),
   signal:AbortSignal.timeout(15000)
  });
  const parsed=await response.json() as {code?:number;msg?:string;data?:{draft_id?:string;draft?:{id?:string}}};
  if(!response.ok||parsed.code!==0)
   return noStore({error:"Lark rejected the draft ("+String(parsed.code??response.status)+"). Check mailbox permissions and OAuth scope."},502);
  const draftId=parsed.data?.draft_id||parsed.data?.draft?.id;
  if(!draftId)return noStore({error:"Lark accepted the draft but did not return an ID. Check Sales Drafts before retrying."},502);
  await recordLarkDraft(id,draftId);
  return noStore({ok:true,draftId,message:"Draft saved in sales@aidigitalprime.co.uk. No email was sent."});
 }catch(e){
  return noStore({error:e instanceof Error?e.message:"Unable to create Lark draft. Check Sales Drafts before retrying."},503);
 }finally{inflight.delete(id);}
}
