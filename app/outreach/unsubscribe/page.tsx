"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
function UnsubscribePanel(){
 const params=useSearchParams(), token=params.get("token")||"";
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function unsubscribe(){
  setBusy(true);
  try{
   const res=await fetch("/api/outreach/unsubscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
   setMessage(res.ok?"You have been unsubscribed. You will not receive further marketing messages from us.":"This unsubscribe link is invalid or expired.");
  }catch{setMessage("Unable to process right now. Please email contact.aidigitals@gmail.com.");}
  finally{setBusy(false);}
 }
 return <main style={{maxWidth:600,margin:"100px auto",padding:28,fontFamily:"Arial,sans-serif",lineHeight:1.6}}>
  <p style={{letterSpacing:2,color:"#2c5a9e",fontSize:12,fontWeight:700}}>AI DIGITAL PRIME</p>
  <h1>Unsubscribe from email</h1>
  <p>Stop receiving marketing emails from AI Digital Prime / CALINESCU TECHNOLOGIES LTD.</p>
  {message?<p role="status">{message}</p>:<button onClick={unsubscribe} disabled={!/^[a-f0-9]{48}$/.test(token)||busy}
   style={{padding:"12px 20px",background:"#183d79",color:"white",border:0,borderRadius:8,cursor:"pointer"}}>
   {busy?"Processing…":"Confirm unsubscribe"}</button>}
  <p style={{marginTop:32,fontSize:13,color:"#64748b"}}>You can also email contact.aidigitals@gmail.com to opt out.</p>
 </main>;
}
export default function UnsubscribePage(){return <Suspense fallback={<p>Loading…</p>}><UnsubscribePanel/></Suspense>;}
