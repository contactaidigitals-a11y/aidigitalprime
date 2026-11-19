import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "../../_auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const ROOT=process.env.AIDP_USAGE_DATA_DIR||"/data/aidp-usage";
const OAUTH=path.join(ROOT,"lark-oauth");
const TOKENS=path.join(ROOT,"lark-tokens.enc");
const back=(status:string)=>Response.redirect("https://aidigitalprime.co.uk/admin/outreach?lark="+encodeURIComponent(status),303);
export async function GET(req:Request){
 if(!await isAdmin(req))return new Response("Log in to AI Digital Prime Admin before authorising Lark.",{status:401,headers:{"Cache-Control":"no-store"}});
 const url=new URL(req.url),state=url.searchParams.get("state")||"",code=url.searchParams.get("code")||"";
 if(!/^[a-f0-9]{48}$/.test(state)||!code||code.length>2048)return back("invalid");
 const file=path.join(OAUTH,state+".json");
 let valid=false;
 try{const saved=JSON.parse(await readFile(file,"utf8")) as {expires:number};valid=saved.expires>Date.now();}
 catch{return back("expired");}
 await rm(file,{force:true});
 if(!valid)return back("expired");
 const id=process.env.LARK_APP_ID,secret=process.env.LARK_APP_SECRET;
 if(!id||!secret)return back("notconfigured");
 try{
  const response=await fetch("https://open.larksuite.com/open-apis/authen/v2/oauth/token",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({grant_type:"authorization_code",client_id:id,client_secret:secret,code,redirect_uri:"https://aidigitalprime.co.uk/api/admin/lark/callback"}),
   signal:AbortSignal.timeout(12000)
  });
  const raw=await response.json() as Record<string,unknown>;
  const data=(raw.data && typeof raw.data==="object" ? raw.data : raw) as Record<string,unknown>;
  if(!response.ok || (typeof raw.code==="number"&&raw.code!==0) ||
    typeof data.access_token!=="string"||typeof data.refresh_token!=="string" ||
    !data.refresh_token)return back("authorizationfailed");
  const payload=JSON.stringify({
   access_token:data.access_token,refresh_token:data.refresh_token,
   expires_at:Date.now()+(Number(data.expires_in)||7200)*1000,
   refresh_expires_at:Date.now()+(Number(data.refresh_token_expires_in)||2592000)*1000
  });
  const key=createHash("sha256").update(id+":"+secret).digest();
  const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,iv);
  const encrypted=Buffer.concat([cipher.update(payload,"utf8"),cipher.final()]);
  const record=JSON.stringify({iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),data:encrypted.toString("base64")});
  await mkdir(ROOT,{recursive:true,mode:0o700});
  const tmp=TOKENS+"."+randomBytes(8).toString("hex");
  await writeFile(tmp,record,{mode:0o600});
  await rename(tmp,TOKENS);
  return back("connected");
 }catch{return back("authorizationfailed");}
}
