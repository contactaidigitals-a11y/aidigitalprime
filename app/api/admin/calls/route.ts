import { randomUUID } from "node:crypto";
import { isAdmin, noStore, safeOrigin } from "../_auth";
import { readProspects } from "../prospects/_store";
import { readOperatorCalls, saveOperatorCall, updateOperatorCall } from "./_store";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const AGENT_ID="agent_2301m72h4vrye59b1m0x7y5az9d2";
const PHONE_ID="phnum_7101m731vc8jfvgv1wfhymnbktff";
const consentPattern=/^.{15,1500}$/s;
let launchInProgress=false;

const exact=(v:unknown,n=600)=>typeof v==="string"?v.trim().slice(0,n):"";
const phoneValid=(x:string)=>/^\+44[1-9]\d{8,9}$/.test(x);
const blocked=(value:unknown)=>/simulation|synthetic|fictional|test only|neverificat|research only|do not call|suppressed|opt.?out/i.test(String(value||""));

export async function GET(request:Request){
 if(!await isAdmin(request))return noStore({error:"Not authorised."},401);
 try{
  const calls=await readOperatorCalls();
  return noStore({
   calls:calls.slice().reverse().slice(0,200),
   providerReady:Boolean(process.env.ELEVENLABS_API_KEY),
   agentId:AGENT_ID,
   manualLaunchOnly:true,
   realtimeMonitoringRequiresEnterprise:true
  });
 }catch{return noStore({error:"Unable to load calls."},503)}
}

export async function POST(request:Request){
 if(!safeOrigin(request))return noStore({error:"Request not allowed."},403);
 if(!await isAdmin(request))return noStore({error:"Not authorised."},401);
 if(Number(request.headers.get("content-length")||0)>5000)return noStore({error:"Request too large."},413);
 let body:Record<string,unknown>;
 try{const parsed:unknown=await request.json();if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error();body=parsed as Record<string,unknown>}
 catch{return noStore({error:"Invalid request."},400)}
 const action=body.action;
 if(action==="update"){
  const id=exact(body.id,64);
  const status=body.status;
  if(!["initiated","completed","failed"].includes(String(status)))return noStore({error:"Invalid status."},400);
  try{
   const call=await updateOperatorCall(id,status as "initiated"|"completed"|"failed",exact(body.outcome,150),exact(body.operatorNotes,2000));
   return noStore({ok:true,call});
  }catch{return noStore({error:"Unable to update call."},400);}
 }
 if(action!=="launch")return noStore({error:"Unknown action."},400);
 if(body.confirm!==true)return noStore({error:"Operator approval required for this individual call."},400);
 const id=exact(body.prospectId,64);
 const evidence=exact(body.consentEvidence,1500);
 const consentDate=exact(body.consentDate,35);
 const screening=body.screeningVerified===true;
 if(!screening||!consentPattern.test(evidence)||!consentDate||!Number.isFinite(Date.parse(consentDate))){
  return noStore({error:"Record specific permission for an AI marketing call, its date/source and your screening confirmation."},400);
 }
 const target=(await readProspects()).find(x=>x.id===id);
 if(!target)return noStore({error:"Business not found in pipeline."},404);
 if(target.status==="suppressed"||target.permission==="do-not-contact"||target.history?.some(x=>x.action==="unsubscribed")||blocked(target.notes)){
  return noStore({error:"This prospect is suppressed, synthetic or marked not contactable."},403);
 }
 if(target.source.toLowerCase().includes("synthetic")||target.permission==="unverified"&&target.source.toLowerCase().includes("test")){
  return noStore({error:"A simulation/test record may not be dialled."},403);
 }
 // Live voice-agent marketing must be specifically approved by recipient.
 if(!/specific.*(ai|automated)|(?:ai|automated).*(marketing|sales).*consent|agreed to an ai (sales|marketing) call/i.test(evidence)){
  return noStore({error:"Proof must expressly document consent to an AI marketing call. General B2B permission is insufficient."},400);
 }
 const phone=exact(target.phone,40).replace(/[\s().-]/g,"");
 if(!phoneValid(phone))return noStore({error:"Use a validated UK number in E.164 format (e.g. +4420...)."},400);
 const key=process.env.ELEVENLABS_API_KEY;
 if(!key)return noStore({error:"ElevenLabs API key missing from Railway."},503);
 if(launchInProgress)return noStore({error:"Another call is being initiated. Try again after it completes."},429);
 launchInProgress=true;
 try{
  const existing=await readOperatorCalls();
  if(existing.some(x=>x.prospectId===id&&Date.now()-Date.parse(x.createdAt)<60_000)){
   return noStore({error:"This business was already called in the last minute. Retry is blocked."},429);
  }
  const variables={
   business_name:target.business.slice(0,150),
   business_industry:(target.industry||"Unknown").slice(0,100),
   business_location:(target.location||"UK").slice(0,150),
   business_website:(target.website||"Unknown").slice(0,220),
   business_hours:"Not verified",
   business_observation:(target.observation||"No verified observations").slice(0,320),
   business_source:(target.sourceUrl||target.source||"Public source").slice(0,330),
   contact_permission:"Specific AI marketing call consent verified by human operator"
  };
  const result=await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call",{
   method:"POST",signal:AbortSignal.timeout(20_000),
   headers:{"xi-api-key":key,"Content-Type":"application/json"},
   body:JSON.stringify({
    agent_id:AGENT_ID,agent_phone_number_id:PHONE_ID,to_number:phone,
    call_recording_enabled:false,
    conversation_initiation_client_data:{dynamic_variables:variables}
   })
  });
  if(!result.ok)return noStore({error:"ElevenLabs rejected call launch ("+result.status+"). No confirmed call was initiated."},502);
  const data=await result.json() as {success?:boolean;conversation_id?:string;callSid?:string};
  if(!data.success)return noStore({error:"Provider did not confirm call initiation."},502);
  const call={
   id:randomUUID(),prospectId:id,business:target.business,phone,
   elevenConversationId:data.conversation_id||"",twilioCallSid:data.callSid||"",
   createdAt:new Date().toISOString(),consentEvidence:evidence,consentCheckedAt:consentDate,
   status:"initiated" as const,outcome:"",operatorNotes:""
  };
  try{await saveOperatorCall(call)}
  catch(e){
   console.error("CALL STARTED BUT NOT PERSISTED",data.conversation_id||"unknown",e instanceof Error?e.message:"error");
   return noStore({error:"The call may have started, but saving the call log failed. Check ElevenLabs immediately; do not retry."},503);
  }
  return noStore({ok:true,call,message:"One operator-approved call initiated. No subsequent calls will start automatically."});
 }catch{
  return noStore({error:"Call initiation timed out or failed. Check the provider call log before trying again."},502);
 }finally{launchInProgress=false;}
}
