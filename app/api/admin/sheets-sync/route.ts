import { createSign } from "node:crypto";
import { isAdmin, noStore, safeOrigin } from "../_auth";
import { mergeSheetProspects } from "../prospects/_store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const SPREADSHEET_ID="181xN0FmpoAW9-LsLcH-_YHKLTpDZ4zX9HARa8k76bUI";
const SHEET_RANGE="'Foaie1'!A1:M1000";
type GoogleKey={client_email:string;private_key:string;token_uri?:string};
function credentials():GoogleKey|null{
 try{
  const raw=process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
  if(!raw)return null;
  const v=JSON.parse(raw) as GoogleKey;
  if(!v?.client_email?.endsWith(".gserviceaccount.com")||!v.private_key?.includes("PRIVATE KEY"))return null;
  return v;
 }catch{return null;}
}
function encode(data:unknown){return Buffer.from(JSON.stringify(data)).toString("base64url");}
async function accessToken(key:GoogleKey):Promise<string>{
 const now=Math.floor(Date.now()/1000);
 const aud="https://oauth2.googleapis.com/token";
 const header=encode({alg:"RS256",typ:"JWT"});
 const payload=encode({iss:key.client_email,scope:"https://www.googleapis.com/auth/spreadsheets.readonly",aud,iat:now,exp:now+3600});
 const signingInput=header+"."+payload;
 const sign=createSign("RSA-SHA256");sign.update(signingInput);sign.end();
 const jwt=signingInput+"."+sign.sign(key.private_key).toString("base64url");
 const body=new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt});
 const response=await fetch(aud,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body,signal:AbortSignal.timeout(14000),cache:"no-store"});
 if(!response.ok)throw Error("Google authentication failed.");
 const data=await response.json() as {access_token?:string};
 if(!data.access_token)throw Error("Google did not return a token.");
 return data.access_token;
}
export async function GET(req:Request){
 if(!await isAdmin(req))return noStore({error:"Not authorised."},401);
 const key=credentials();
 return noStore({configured:Boolean(key),sheetId:SPREADSHEET_ID,serviceAccountEmail:key?.client_email||"",manualSyncOnly:true});
}
export async function POST(req:Request){
 if(!safeOrigin(req))return noStore({error:"Request not allowed."},403);
 if(!await isAdmin(req))return noStore({error:"Not authorised."},401);
 const key=credentials();
 if(!key)return noStore({error:"Google Sheets service account is not configured in Railway."},503);
 try{
  const token=await accessToken(key);
  const address="https://sheets.googleapis.com/v4/spreadsheets/"+SPREADSHEET_ID+"/values/"+encodeURIComponent(SHEET_RANGE);
  const response=await fetch(address,{headers:{Authorization:"Bearer "+token},cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!response.ok)return noStore({error:"Unable to read Foaie1 from Google Sheets ("+response.status+"). Share the Sheet with the configured service account."},502);
  const data=await response.json() as {values?:unknown[][]};
  const values=data.values||[];
  const headers=(values[0]||[]).map(v=>String(v||"").trim().toLowerCase());
  if(headers[0]!=="business name"||headers[3]!=="phone"||headers[7]!=="source")
   return noStore({error:"Sheet headers have changed; sync cancelled to protect mappings."},409);
  const rows=values.slice(1).map(row=>{
   const x=(i:number)=>typeof row[i]==="string"?String(row[i]).trim():"";
   return {
    business:x(0),industry:x(1),location:x(2),phone:x(3),website:x(4),hours:x(5),
    observation:x(6),source:x(7)||"Google Sheets – Foaie1",
    verifiedAt:x(8),service:x(9),contactPermission:x(10),
    leadStatus:x(11),notes:x(12),
    sourceUrl:x(7).startsWith("https://")?x(7):""
   };
  }).filter(v=>v.business);
  const result=await mergeSheetProspects(rows);
  return noStore({ok:true,...result,rowsRead:rows.length,message:"Imported new research leads; no calls were made."});
 }catch(e){
  console.error("Google Sheets lead sync failed",e instanceof Error?e.message:"unknown");
  return noStore({error:"Google Sheet synchronization failed; check service account permissions."},502);
 }
}
