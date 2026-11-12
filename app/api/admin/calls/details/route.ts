import { isAdmin, noStore } from "../../_auth";
import { readOperatorCalls } from "../_store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 if(!await isAdmin(request))return noStore({error:"Not authorised."},401);
 const id=new URL(request.url).searchParams.get("id")||"";
 const call=(await readOperatorCalls()).find(x=>x.id===id);
 if(!call)return noStore({error:"Call not found."},404);
 if(!call.elevenConversationId)return noStore({error:"The provider has not yet returned a conversation ID."},409);
 const key=process.env.ELEVENLABS_API_KEY;
 if(!key)return noStore({error:"ElevenLabs credentials unavailable."},503);
 try{
  const response=await fetch("https://api.elevenlabs.io/v1/convai/conversations/"+encodeURIComponent(call.elevenConversationId),{
   headers:{"xi-api-key":key},cache:"no-store",signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)return noStore({error:"Conversation details are not available yet ("+response.status+")."},502);
  const data=await response.json() as {status?:string;transcript?:Array<{role?:string;message?:string}>;metadata?:{call_duration_secs?:number};analysis?:{call_summary_title?:string}};
  const transcript=(Array.isArray(data.transcript)?data.transcript:[]).filter(t=>typeof t.message==="string").slice(-100).map(t=>({
   speaker:t.role==="agent"?"AI agent":t.role==="user"?"Business":"Other",
   text:String(t.message||"").slice(0,1500)
  }));
  return noStore({
   status:String(data.status||"unknown"),durationSeconds:data.metadata?.call_duration_secs||0,
   transcript,summary:data.analysis?.call_summary_title||"",
   realtimeGuaranteed:false,
   note:"Provider transcript may not appear until the call finishes. This is not a real-time takeover control."
  });
 }catch{return noStore({error:"Unable to retrieve provider conversation details."},502);}
}
