import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin, noStore } from "../../_auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const ROOT = process.env.AIDP_USAGE_DATA_DIR || "/data/aidp-usage";
export async function GET(req:Request){
 if(!await isAdmin(req))return noStore({error:"Not authorised"},401);
 const id=process.env.LARK_APP_ID,secret=process.env.LARK_APP_SECRET;
 if(!id||!secret)return noStore({error:"LARK_APP_ID / LARK_APP_SECRET not configured"},503);
 const state=randomBytes(24).toString("hex");
 const redirectUri="https://aidigitalprime.co.uk/api/admin/lark/callback";
 await mkdir(path.join(ROOT,"lark-oauth"),{recursive:true,mode:0o700});
 await writeFile(path.join(ROOT,"lark-oauth",state+".json"),JSON.stringify({expires:Date.now()+600000}),{flag:"wx",mode:0o600});
 const url=new URL("https://accounts.larksuite.com/open-apis/authen/v1/authorize");
 url.searchParams.set("client_id",id);
 url.searchParams.set("response_type","code");
 url.searchParams.set("redirect_uri",redirectUri);
 url.searchParams.set("scope","mail:user_mailbox.message:modify mail:user_mailbox.message:send mail:user_mailbox:readonly offline_access");
 url.searchParams.set("state",state);
 return noStore({url:url.toString(),redirectUri});
}
