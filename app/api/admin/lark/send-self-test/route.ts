import { createHash, timingSafeEqual } from "node:crypto";
import { noStore } from "../../_auth";
import { larkAccessToken } from "../_tokens";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const mailbox="sales@aidigitalprime.co.uk";
export async function POST(req:Request){
 const secret=process.env.OUTREACH_CRON_SECRET||"";
 const auth=req.headers.get("authorization")||"";
 if(secret.length<40||!auth.startsWith("Bearer "))return noStore({error:"Unauthorized"},401);
 const expected=createHash("sha256").update(secret).digest();
 const actual=createHash("sha256").update(auth.slice(7)).digest();
 if(!timingSafeEqual(expected,actual))return noStore({error:"Unauthorized"},401);
 const root="https://open.larksuite.com/open-apis/mail/v1/user_mailboxes/"+encodeURIComponent(mailbox);
 const subject="AI Digital Prime - Lark sending permission test";
 const eml=["From: AI Digital Prime Sales <"+mailbox+">",
 "To: <"+mailbox+">","Subject: "+subject,"MIME-Version: 1.0",
 "Content-Type: text/plain; charset=UTF-8","","This is a one-time internal integration test. No external prospect was contacted.",""].join("\r\n");
 try{
  const token=await larkAccessToken();
  const create=await fetch(root+"/drafts",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({raw:Buffer.from(eml).toString("base64url")}),signal:AbortSignal.timeout(15000)});
  const draft=await create.json() as {code?:number;msg?:string;data?:{draft?:{id?:string};draft_id?:string}};
  if(!create.ok||draft.code!==0)return noStore({ok:false,stage:"create",code:draft.code??create.status,message:String(draft.msg||"Lark draft creation failed").slice(0,200)},502);
  const id=draft.data?.draft?.id||draft.data?.draft_id;
  if(!id)return noStore({ok:false,stage:"create",message:"Draft created but ID absent. Check Lark drafts; test not sent."},502);
  const send=await fetch(root+"/drafts/"+encodeURIComponent(id)+"/send",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:"{}",signal:AbortSignal.timeout(15000)});
  const result=await send.json() as {code?:number;msg?:string;data?:{message_id?:string;automation_send_disable?:{reason?:string}}};
  if(!send.ok||result.code!==0)return noStore({ok:false,stage:"send",code:result.code??send.status,message:String(result.msg||"Lark send rejected").slice(0,200),draftId:id},502);
  if(result.data?.automation_send_disable)return noStore({ok:false,stage:"send",message:"Lark mailbox automation disallows sending: "+String(result.data.automation_send_disable.reason||"disabled"),draftId:id},409);
  if(!result.data?.message_id)return noStore({ok:false,stage:"send",message:"Send returned success but no message ID. Check own inbox/Sent; do not retry blindly.",draftId:id},409);
  return noStore({ok:true,recipient:mailbox,subject,draftId:id,messageId:result.data.message_id});
 }catch(e){return noStore({ok:false,message:e instanceof Error?e.message:"Lark test failed"},503);}
}
