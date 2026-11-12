import { isAdmin, noStore, safeOrigin } from "../_auth";
import { importProspects, readProspects, updateProspect } from "./_store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 if(!await isAdmin(req))return noStore({error:"Not authorised."},401);
 try{const leads=await readProspects();return noStore({leads:leads.slice().reverse(),total:leads.length});}
 catch{return noStore({error:"Unable to load prospects."},503);}
}
export async function POST(req:Request){
 if(!safeOrigin(req))return noStore({error:"Request not allowed."},403);
 if(!await isAdmin(req))return noStore({error:"Not authorised."},401);
 try{
  if(Number(req.headers.get("content-length")||0)>180000)return noStore({error:"Request too large."},413);
  const body:unknown=await req.json();
  if(!body||typeof body!=="object"||Array.isArray(body))return noStore({error:"Invalid request."},400);
  const data=body as Record<string,unknown>;
  if(data.action==="import"){
    if(!Array.isArray(data.leads))return noStore({error:"Invalid list."},400);
    const result=await importProspects(data.leads);
    return noStore({ok:true,...result});
  }
  await updateProspect(data);
  return noStore({ok:true});
 }catch(e){
  const message=e instanceof Error?e.message:"Unable to update leads.";
  if(/not found|required|Invalid|Only|Record|limit|duplicate|belongs|unknown|reviewed|Enter|check/i.test(message))return noStore({error:message},400);
  return noStore({error:"Unable to save prospect changes."},503);
 }
}
