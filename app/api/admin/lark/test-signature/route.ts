import { open, mkdir } from "node:fs/promises";
import { createHash,timingSafeEqual } from "node:crypto";
import { noStore } from "../../_auth";
import { larkAccessToken } from "../_tokens";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const FROM="sales@aidigitalprime.co.uk",TO="andrei@tracelio.co.uk";
const banner="/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACAWGBwYFCAcGhwkIiAmMFA0MCwsMGJGSjpQdGZ6eHJmcG6AkLicgIiuim5woNqirr7EztDOfJri8uDI8LjKzsb/2wBDASIkJDAqMF40NF7GhHCExsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsb/wAARCABQAUADASIAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAECBAUD/8QAMBAAAgIBAwIEBAYCAwAAAAAAAAECEQMEEiExURMyQWEiI3GRBRRSSobHRFVMzYoH/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAWEQEBAQAAAAAAAAAAAAAAAAAAEQH/2gAMAwEAAhEDEQA/APDABpkAAAAAAAABqEN761RuWCUVz6q1a6kHyABQBaAEKAAAKBCgAAUAQFKEQFAEBSgZKWgBBRaAEBaFASgWkKAgotADINUQD5gAKAAAAAAAA+uncVP4la7X1OrPqI5YK4007tyuvb6HBV9BVESOnDqo4sKx+Eny5XfN9P4Nw12yEY+HuqKXxO1x2OQBXW9bxSjNJpptztu6/ozqNVHPHnFtlafD47fwcwA7f8g25XjVOVrnpzZFrqb+Ulfqnz0aOQVQSD6gop1dcFUAKEACgQoAAFAEKAEAUAQUUvoBCFLSSturAzQNfB+p/YLa+FLn3VAZFFaAEBQB8AAGgAAAAAAAHf8AgzUdZJt18qVU6d+zPrLHhyeNk1Ll4mJ21PJbnFr4Va9+x5kYub2xi5PslZpYsjbSxybXDqL4IPWek0KnjW1uDTalv4ktrffv7HNLHpZaB6qOPZLnGse5v4ru/scMYSm6jFyfZKzdZpQUKm4RbdU6T9QPRxaXSS02CTTk5bd0t1U93KfPb2KtNpJLdDHFySmlj8TiTUqTv6HlrFOSTUJNPhNLqFCTqot3046gexLQaVZnFRSjCbUk59FsTX7nz1K08cPjZI+NJLHFJzfC28nnTWXJJTmpyc+jafJhxcXUk0/dAd+o0+mx6rBhUqjOW6Ur6Rb4X2OyWHTzjixTjGOxZHHGp3btVzfbnqeNOcsknKcnKT6tmQPV/K6Rwm68NLJTlOV8WuFT+pcun0mLxJeF5INqO/iXKr1foeUCj1Men0Unik2ks3Kju8tLlP6sstLptueobJRimt8uE69n/Z5RQgUhQgUgAoAAFIUAGQrAEyeZfRfwU+mKWKOqhLOm8aSbS9eAOrT6XBHDDHqOM2o8n/Tt9zz8uOWLJLHNVKLpnbPUaTPLxdQs/iPrtapdqMa/UYdSoTgprIvhbl6r0f1IY+E/PL6mTc/PIwUH1AYA+AADQAAAAAAADo0WTHjyylllJLa0nG+vvXods/xHE5uUJTjeWEnxVpKmeZGKk+ZKP1ssoRStZIy9lf8AREjqw58MdVnySc0pNuFX3vmmdL/EcKzRlGU1Hx3OSS6qqPNUcfF5PTnjoVwx06nboEdv57HHDiqUnkxyTikmkkn0fNM1k1+Dw8kcUZLamsVrv5rOHZi/2/sNmKv+T9gR6T/EcLy457mo7otw2eWl3s87NNZPmPJOWRt3uXRenJhxhfE+KfVGowxNK8lP1VdARgH02Yv9hnbG/PxddPTuUZKb247fzP8A2i7MXPzP26gfMpZKCXwysyBQQoFBAEUpABQQAUvoQWAK9skrvj1RABdsO8glBc039SWLArdshBYFBAB8QAGgAAAAAAAAAAAABQQAUAAUEAFKZKBQQAaBkoRQQAaFmSgWwQAWwQWBbLZkAaXPQu1/pf2Mxk4u4uma8bJXnYEal+l/YU+zL4uS73snizXSTAnQEbt2+oA//9k=";
function allowed(req:Request){
 const secret=process.env.AIDP_CRM_BRIDGE_SECRET||"",auth=req.headers.get("authorization")||"";
 return secret.length>=40&&auth.startsWith("Bearer ")&&timingSafeEqual(createHash("sha256").update(secret).digest(),createHash("sha256").update(auth.slice(7)).digest());
}
const fold=(s:string)=>Buffer.from(s.replace(/\r?\n/g,"\r\n"),"utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n")||"";
async function larkPost(token:string,path:string,data:Record<string,unknown>){
 const r=await fetch("https://open.larksuite.com/open-apis/mail/v1/user_mailboxes/"+encodeURIComponent(FROM)+path,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json; charset=utf-8"},body:JSON.stringify(data),signal:AbortSignal.timeout(25000)});
 const j=await r.json() as {code?:number;msg?:string;data?:Record<string,unknown>};
 if(!r.ok||j.code!==0)throw Error("Lark API error "+r.status+" code "+String(j.code)+" "+String(j.msg).slice(0,150));
 return j.data||{};
}
function makeMime(){
 const paragraphs=["Hi Tracelio team,","I'm Andrei, the founder and CEO of AI Digital Prime.","I founded the company in 2026 with a simple mission: to help local and small businesses attract more customers, focus on what they do best, and leave phone calls to our AI receptionist.","For a business like Tracelio, it can answer customer questions, take enquiries and transfer calls to your team. There are over 20 voices to choose from, and it can handle appointments when connected to a suitable calendar.","We're offering the first month free with 50 call minutes to test the service, plus 50% off the setup fee.","Simply reply to this email to arrange a 15-minute Zoom meeting where I'll personally demonstrate how our AI receptionist works."];
 const escape=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
 const html="<html><body style=\"background:#fff;color:#222;font:15px Arial,sans-serif;padding:12px;max-width:650px\">"+paragraphs.map(x=>"<p style=\"margin:0 0 16px;line-height:1.55\">"+escape(x)+"</p>").join("")+"<div style=\"font:15px Arial,sans-serif;line-height:1.6;margin-top:20px\">Kind Regards,<br>Andrei Calinescu<br>founder | AI Digital Prime</div><p><a href=\"https://aidigitalprime.co.uk\"><img src=\"cid:aidp-signature-banner\" alt=\"AI Digital Prime — Every enquiry deserves an answer\" width=\"580\" height=\"145\" style=\"width:100%;max-width:580px;height:auto;border:0;display:block\"></a></p><p style=\"font:12px Arial,sans-serif;color:#666;margin-top:15px\">If you prefer no further marketing emails, reply unsubscribe.</p></body></html>";
 const plain=paragraphs.join("\n\n")+"\n\nKind Regards,\nAndrei Calinescu\nfounder | AI Digital Prime\nhttps://aidigitalprime.co.uk\n\nIf you prefer no further marketing emails, reply unsubscribe.";
 const boundary="aidp-tracelio-test-01",alt="aidp-tracelio-alt-01";
 const raw=["From: Andrei Calinescu | AI Digital Prime <"+FROM+">","To: <"+TO+">","Subject: A quick introduction for Tracelio","MIME-Version: 1.0",'Content-Type: multipart/related; boundary="'+boundary+'"',"","--"+boundary,'Content-Type: multipart/alternative; boundary="'+alt+'"',"","--"+alt,"Content-Type: text/plain; charset=UTF-8","Content-Transfer-Encoding: base64","",fold(plain),"--"+alt,"Content-Type: text/html; charset=UTF-8","Content-Transfer-Encoding: base64","",fold(html),"--"+alt+"--","--"+boundary,'Content-Type: image/jpeg; name="aidp-email-banner.jpg"',"Content-Transfer-Encoding: base64","Content-ID: <aidp-signature-banner>",'Content-Disposition: inline; filename="aidp-email-banner.jpg"',"",banner.match(/.{1,76}/g)?.join("\r\n")||"","--"+boundary+"--",""].join("\r\n");
 return Buffer.from(raw,"utf8").toString("base64url");
}
export async function GET(req:Request){
 if(!allowed(req))return noStore({error:"Not authorized"},401);
 return noStore({ok:true,recipient:TO,bannerBytes:Buffer.from(banner,"base64").byteLength,sendEnabled:process.env.LARK_SEND_ENABLED==="true"});
}
export async function POST(req:Request){
 if(!allowed(req))return noStore({error:"Not authorized"},401);
 if(req.headers.get("x-aidp-one-test")!=="Tracelio-email-signature-test")return noStore({error:"Explicit single-test header missing"},400);
 try{
  const markerDir=process.env.AIDP_USAGE_DATA_DIR||"/data/aidp-usage";
  await mkdir(markerDir,{recursive:true});
  try{ const claim=await open(markerDir+"/tracelio-signature-test-20261120.claim","wx",0o600); await claim.close(); }
  catch(e){ if((e as NodeJS.ErrnoException).code==="EEXIST")return noStore({ok:false,error:"Single test already attempted. Cannot send twice."},409); throw e; }
  const token=await larkAccessToken(),draft=await larkPost(token,"/drafts",{raw:makeMime()});
  const id=String((draft.draft as {id?:string}|undefined)?.id||draft.draft_id||"");
  if(!id)throw Error("Lark did not return draft ID; nothing was sent");
  const sent=await larkPost(token,"/drafts/"+encodeURIComponent(id)+"/send",{});
  if(typeof sent.message_id!=="string"||!sent.message_id)throw Error("Lark did not confirm send");
  return noStore({ok:true,to:TO,sent:true,messageId:sent.message_id,signatureBanner:true});
 }catch(e){return noStore({ok:false,error:String(e instanceof Error?e.message:e)},503)}
}
