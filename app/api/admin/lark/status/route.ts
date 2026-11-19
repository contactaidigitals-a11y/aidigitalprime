import { readFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin, noStore } from "../../_auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 if(!await isAdmin(req))return noStore({error:"Not authorised"},401);
 const configured=Boolean(process.env.LARK_APP_ID&&process.env.LARK_APP_SECRET);
 const file=path.join(process.env.AIDP_USAGE_DATA_DIR||"/data/aidp-usage","lark-tokens.enc");
 let connected=false;
 try{
  const record=JSON.parse(await readFile(file,"utf8")) as Record<string,unknown>;
  connected=typeof record.iv==="string"&&typeof record.tag==="string"&&typeof record.data==="string";
 }catch{connected=false;}
 return noStore({configured,connected});
}
