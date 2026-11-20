import { createHash, timingSafeEqual } from "node:crypto";
import { noStore } from "../../_auth";
import { larkAccessToken } from "../_tokens";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const FROM="sales@aidigitalprime.co.uk";
const TO="andrei@tracelio.co.uk";
function allowed(req:Request){
 const secret=process.env.AIDP_CRM_BRIDGE_SECRET||"";
 const auth=req.headers.get("authorization")||"";
 if(secret.length<40||!auth.startsWith("Bearer "))return false;
 return timingSafeEqual(createHash("sha256").update(secret).digest(),createHash("sha256").update(auth.slice(7)).digest());
}
type Signature={id:string;name?:string;content?:string;signature_type?:string;images?:Array<{cid?:string;download_url?:string;image_name?:string;header?:string}>};
type Usage={email_address:string;send_mail_signature_id:string};
const toBase64=(s:string)=>Buffer.from(s.replace(/\r?\n/g,"\r\n"),"utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n")||"";
async function getSignature(token:string){
 const res=await fetch("https://open.larksuite.com/open-apis/mail/v1/user_mailboxes/"+encodeURIComponent(FROM)+"/settings/signatures",{
  headers:{Authorization:"Bearer "+token},signal:AbortSignal.timeout(15000)
 });
 const payload=await res.json() as {code?:number;msg?:string;data?:{signatures?:Signature[];usages?:Usage[]}};
 if(!res.ok||payload.code!==0)throw Error("Lark signature API "+res.status+" code "+String(payload.code)+" "+String(payload.msg).slice(0,160));
 const list=payload.data?.signatures||[];
 const ids=payload.data?.usages||[];
 const defaultId=ids.find(x=>x.email_address?.toLowerCase()===FROM)?.send_mail_signature_id;
 const selected=list.find(x=>x.id===defaultId)||list.find(x=>(x.content||"").includes("Andrei Calinescu"));
 if(!selected?.content)throw Error("No configured usable Lark signature for sales mailbox");
 return selected;
}
async function assemble(signature:Signature){
 const content=signature.content||"";
 const images=signature.images||[];
 const files:Array<{cid:string;name:string;data:string;mime:string}>=[];
 for(const [i,im] of images.entries()){
  if(!im.cid||!im.download_url)continue;
  const url=new URL(im.download_url);
  if(url.protocol!=="https:")throw Error("Signature image not HTTPS");
  const image=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!image.ok)throw Error("Signature image download failed "+image.status);
  const data=Buffer.from(await image.arrayBuffer());
  if(data.byteLength>2_000_000)throw Error("Signature image exceeds safety limit");
  const mime=image.headers.get("content-type")?.split(";")[0]||"image/jpeg";
  if(!/^image\/(png|jpeg|gif|webp)$/i.test(mime))throw Error("Signature image unsupported MIME");
  files.push({cid:im.cid.replace(/[<>]/g,""),name:(im.image_name||"signature-"+i+".jpg").replace(/[^a-zA-Z0-9._-]/g,"_"),data:data.toString("base64").match(/.{1,76}/g)?.join("\r\n")||"",mime});
 }
 if(images.length&&!files.length)throw Error("Signature includes images but could not embed them");
 const message=[
  "Hi Tracelio team,",
  "I'm Andrei, the founder and CEO of AI Digital Prime.",
  "I founded the company in 2026 to help local and small businesses attract more customers, focus on what they do best, and leave incoming phone calls to our AI receptionist.",
  "For a tracking business like Tracelio, our receptionist can answer common customer questions and collect enquiries, and it can transfer calls to your team. We offer over 20 voice options, with appointments supported where a suitable calendar is connected and configured.",
  "I'd like to offer you a free first month with 50 call minutes to test it, plus 50% off the setup fee.",
  "Simply reply to this email and we can arrange a 15-minute Zoom meeting where I'll personally demonstrate how it works."
 ];
 const htmlBody=message.map((p,i)=>'<p style="margin:0 0 16px;line-height:1.55;font-family:Arial,sans-serif;font-size:15px;color:#263238">'+p.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")+'</p>').join("");
 const html='<html><body style="margin:0;padding:18px;background:#ffffff">'+htmlBody+'<div style="padding-top:12px">'+content+'</div><p style="font:12px Arial,sans-serif;color:#555;margin-top:18px">If you prefer no further marketing emails, reply unsubscribe.</p></body></html>';
 const textBody=message.join("\n\n")+"\n\nKind Regards,\nAndrei Calinescu\nfounder | AI Digital Prime\nhttps://aidigitalprime.co.uk\n\nIf you prefer no further marketing emails, reply unsubscribe.";
 const b="aidp-"+createHash("sha256").update(TO+Date.now()).digest("hex").slice(0,20),alt=b+"-alt";
 const chunks=[
 "From: Andrei Calinescu | AI Digital Prime <"+FROM+">",
 "To: <"+TO+">",
 "Subject: Tracelio - a quick introduction",
 "MIME-Version: 1.0",
 'Content-Type: multipart/related; boundary="'+b+'"',
 "",
 "--"+b,
 'Content-Type: multipart/alternative; boundary="'+alt+'"',
 "",
 "--"+alt,
 "Content-Type: text/plain; charset=UTF-8",
 "Content-Transfer-Encoding: base64",
 "",
 toBase64(textBody),
 "--"+alt,
 "Content-Type: text/html; charset=UTF-8",
 "Content-Transfer-Encoding: base64",
 "",
 toBase64(html),
 "--"+alt+"--"
 ];
 for(const file of files){
  chunks.push("--"+b,"Content-Type: "+file.mime+"; name=\""+file.name+"\"","Content-Transfer-Encoding: base64","Content-ID: <"+file.cid+">","Content-Disposition: inline; filename=\""+file.name+"\"","",file.data);
 }
 chunks.push("--"+b+"--","");
 return {raw:Buffer.from(chunks.join("\r\n"),"utf8").toString("base64url"),embeddedImages:files.length,signatureHtmlLength:content.length};
}
async function larkPost(token:string,path:string,data:Record<string,unknown>){
 const r=await fetch("https://open.larksuite.com/open-apis/mail/v1/user_mailboxes/"+encodeURIComponent(FROM)+path,{
  method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json; charset=utf-8"},
  body:JSON.stringify(data),signal:AbortSignal.timeout(25000)
 });
 const j=await r.json() as {code?:number;msg?:string;data?:Record<string,unknown>};
 if(!r.ok||j.code!==0)throw Error("Lark API error "+r.status+" code "+String(j.code)+" "+String(j.msg).slice(0,150));
 return j.data||{};
}
export async function GET(req:Request){
 if(!allowed(req))return noStore({error:"Not authorised"},401);
 try{
  const sig=await getSignature(await larkAccessToken());
  return noStore({ok:true,signatureFound:true,signatureName:sig.name||"",htmlLength:sig.content?.length||0,images:sig.images?.length||0,hasBannerText:/Every enquiry deserves|Andrei Calinescu/i.test(sig.content||"")});
 }catch(e){return noStore({ok:false,error:String(e instanceof Error?e.message:e)},503)}
}
export async function POST(req:Request){
 if(!allowed(req))return noStore({error:"Not authorised"},401);
 if(req.headers.get("x-aidp-one-test")!=="Tracelio-email-signature-test")return noStore({error:"Explicit single-test header missing"},400);
 try{
  const token=await larkAccessToken();
  const sig=await getSignature(token);
  const mime=await assemble(sig);
  const draft=await larkPost(token,"/drafts",{raw:mime.raw});
  const id=String((draft.draft as {id?:string}|undefined)?.id||draft.draft_id||"");
  if(!id)throw Error("Lark did not return draft ID; not sent");
  const sent=await larkPost(token,"/drafts/"+encodeURIComponent(id)+"/send",{});
  if(typeof sent.message_id!=="string"||!sent.message_id)throw Error("Send not confirmed by Lark");
  return noStore({ok:true,to:TO,subject:"Tracelio - a quick introduction",sent:true,messageId:sent.message_id,embeddedImages:mime.embeddedImages,signatureHtmlLength:mime.signatureHtmlLength});
 }catch(e){return noStore({ok:false,error:String(e instanceof Error?e.message:e)},503)}
}
