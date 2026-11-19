import { createDecipheriv, createCipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT=process.env.AIDP_USAGE_DATA_DIR||"/data/aidp-usage";
const FILE=path.join(ROOT,"lark-tokens.enc");
type Tokens={access_token:string;refresh_token:string;expires_at:number;refresh_expires_at:number};
let refreshQueue:Promise<string>|null=null;
function credentials(){
 const id=process.env.LARK_APP_ID,secret=process.env.LARK_APP_SECRET;
 if(!id||!secret)throw Error("Lark credentials are not configured");
 return {id,secret,key:createHash("sha256").update(id+":"+secret).digest()};
}
function encrypt(record:Tokens,key:Buffer){
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,iv);
 const data=Buffer.concat([cipher.update(JSON.stringify(record),"utf8"),cipher.final()]);
 return JSON.stringify({iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),data:data.toString("base64")});
}
async function readTokens():Promise<Tokens>{
 const {key}=credentials();
 const raw=JSON.parse(await readFile(FILE,"utf8")) as {iv:string;tag:string;data:string};
 const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(raw.iv,"base64"));
 decipher.setAuthTag(Buffer.from(raw.tag,"base64"));
 const data=Buffer.concat([decipher.update(Buffer.from(raw.data,"base64")),decipher.final()]);
 return JSON.parse(data.toString("utf8")) as Tokens;
}
async function saveTokens(tokens:Tokens){
 const {key}=credentials();
 await mkdir(ROOT,{recursive:true,mode:0o700});
 const tmp=FILE+"."+randomBytes(8).toString("hex");
 await writeFile(tmp,encrypt(tokens,key),{mode:0o600});
 await rename(tmp,FILE);
}
async function refresh(){
 const current=await readTokens();
 if(current.expires_at>Date.now()+120_000)return current.access_token;
 if(!current.refresh_token || current.refresh_expires_at<Date.now())throw Error("Lark authorisation expired; connect Lark Mail again");
 const {id,secret}=credentials();
 const response=await fetch("https://open.larksuite.com/open-apis/authen/v2/oauth/token",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({grant_type:"refresh_token",client_id:id,client_secret:secret,refresh_token:current.refresh_token}),
  signal:AbortSignal.timeout(12000)
 });
 const raw=await response.json() as Record<string,unknown>;
 const data=(raw.data&&typeof raw.data==="object"?raw.data:raw) as Record<string,unknown>;
 if(!response.ok||(typeof raw.code==="number"&&raw.code!==0)||
   typeof data.access_token!=="string"||typeof data.refresh_token!=="string")
  throw Error("Lark token refresh failed; reconnect Lark Mail if needed");
 const updated:Tokens={
  access_token:data.access_token,refresh_token:data.refresh_token,
  expires_at:Date.now()+(Number(data.expires_in)||7200)*1000,
  refresh_expires_at:Date.now()+(Number(data.refresh_token_expires_in)||2592000)*1000
 };
 await saveTokens(updated);
 return updated.access_token;
}
export async function larkAccessToken(){
 const current=await readTokens();
 if(current.expires_at>Date.now()+120_000)return current.access_token;
 if(!refreshQueue)refreshQueue=refresh().finally(()=>{refreshQueue=null});
 return refreshQueue;
}
