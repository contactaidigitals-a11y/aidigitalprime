"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

const inputStyle = { width: "100%", padding: "12px 14px", border: "1px solid #ccd6e6", borderRadius: 8, background: "#fff", color: "#101828" };
const labelStyle = { display: "block", fontWeight: 650, marginBottom: 6 } as const;
const panelStyle = { border: "1px solid #dbe2ec", borderRadius: 16, padding: "clamp(20px,4vw,40px)", background: "#fff", boxShadow: "0 16px 48px rgba(11,20,38,.06)" };

export default function SalesAgentApplication() {
 const [status,setStatus]=useState<"idle"|"sending"|"sent"|"error">("idle");
 const [message,setMessage]=useState("");
 const [cvName,setCvName]=useState("");
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const form=event.currentTarget;
  const payload=new FormData(form);
  setStatus("sending"); setMessage("");
  try {
   const response=await fetch("/api/careers/apply",{method:"POST",body:payload});
   const data=await response.json();
   if (!response.ok || !data.ok) throw new Error(data.message||"We could not send your application.");
   setStatus("sent"); setMessage("Your application was submitted successfully. We will contact you if your profile is a match.");
   form.reset(); setCvName("");
  } catch(error) {
   setStatus("error"); setMessage(error instanceof Error?error.message:"We could not send your application.");
  }
 }
 function cvChanged(event:ChangeEvent<HTMLInputElement>) { setCvName(event.target.files?.[0]?.name||""); }
 return <main style={{ minHeight:"100vh",background:"linear-gradient(135deg,#f7faff,#edf2f8)",padding:"64px 20px" }}>
  <div style={{ maxWidth:780,margin:"0 auto" }}>
   <Link href="/" style={{ color:"#2353b5",fontWeight:700 }}>← AI Digital Prime</Link>
   <p style={{ color:"#2353b5",fontWeight:800,letterSpacing:".12em",textTransform:"uppercase",fontSize:12,marginTop:38 }}>Work with us</p>
   <h1 style={{ fontSize:"clamp(32px,5vw,52px)",letterSpacing:"-.045em",lineHeight:1.1,margin:"10px 0 12px" }}>Independent Sales Partner Application</h1>
   <p style={{ color:"#46546a",fontSize:17,marginBottom:30 }}>Apply to collaborate with CALINESCU TECHNOLOGIES LTD, trading as AI Digital Prime. This is a self-employed, commission-only opportunity, not a salaried position. You can source your own clients and may receive optional lead suggestions.</p>
   <section style={panelStyle}>
    <h2 style={{marginTop:0,fontSize:24}}>Your application</h2>
    <p style={{color:"#68758a",fontSize:14}}>Fields marked * are required. No CV? You can still apply.</p>
    <form onSubmit={submit} encType="multipart/form-data" style={{display:"grid",gap:18}}>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
      <div><label style={labelStyle} htmlFor="firstName">First name *</label><input style={inputStyle} id="firstName" name="firstName" required maxLength={70} autoComplete="given-name"/></div>
      <div><label style={labelStyle} htmlFor="lastName">Last name *</label><input style={inputStyle} id="lastName" name="lastName" required maxLength={70} autoComplete="family-name"/></div>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
      <div><label style={labelStyle} htmlFor="email">Email address *</label><input style={inputStyle} id="email" name="email" type="email" required maxLength={150} autoComplete="email"/></div>
      <div><label style={labelStyle} htmlFor="phone">Phone number *</label><input style={inputStyle} id="phone" name="phone" type="tel" required maxLength={30} autoComplete="tel"/></div>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
      <div><label style={labelStyle} htmlFor="city">Town / city where you live *</label><input style={inputStyle} id="city" name="city" required maxLength={100} autoComplete="address-level2"/></div>
      <div><label style={labelStyle} htmlFor="nationality">Nationality (optional)</label><input style={inputStyle} id="nationality" name="nationality" maxLength={80} autoComplete="off"/><small style={{color:"#68758a"}}>Not used to assess your eligibility.</small></div>
     </div>
     <div><label style={labelStyle} htmlFor="languages">Languages spoken and proficiency *</label><input style={inputStyle} id="languages" name="languages" required maxLength={250} placeholder="e.g. English (fluent), Romanian (native)"/></div>
     <fieldset style={{border:"1px solid #dbe2ec",borderRadius:8,padding:16}}>
      <legend style={{fontWeight:700}}>Do you currently have the right to work in the UK? *</legend>
      <label style={{marginRight:24}}><input type="radio" name="rightToWork" value="Yes" required/> Yes</label>
      <label><input type="radio" name="rightToWork" value="No" required/> No</label>
      <p style={{fontSize:13,color:"#68758a",marginBottom:0}}>Please do not upload passports, visas or identity documents at this stage.</p>
     </fieldset>
     <div><label style={labelStyle} htmlFor="experience">Sales experience (optional)</label><textarea style={{...inputStyle,minHeight:94}} id="experience" name="experience" maxLength={1500} placeholder="Tell us briefly about relevant experience."/></div>
     <div><label style={labelStyle} htmlFor="cv">CV / résumé (optional, PDF or DOCX, max 2 MB)</label><input id="cv" name="cv" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={cvChanged}/>{cvName&&<p style={{fontSize:13,color:"#46546a"}}>Selected: {cvName}</p>}</div>
     <div style={{position:"absolute",left:"-10000px"}} aria-hidden="true"><label htmlFor="website">Leave this empty</label><input type="text" name="website" id="website" tabIndex={-1} autoComplete="off"/></div>
     <label style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:14}}><input type="checkbox" name="privacyAcknowledged" value="yes" required style={{marginTop:5}}/><span>I have read the <Link href="/privacy" style={{color:"#2353b5",textDecoration:"underline"}}>Privacy Policy</Link> and understand that my information will be used to review my application. *</span></label>
     <button disabled={status==="sending"} type="submit" style={{padding:"14px 22px",border:0,borderRadius:9,background:"#2353b5",color:"#fff",fontWeight:750,cursor:"pointer"}}>{status==="sending"?"Submitting…":"Submit application"}</button>
     {message&&<p role="status" style={{padding:12,borderRadius:8,background:status==="sent"?"#e8f8ef":"#fff1f1",color:status==="sent"?"#155c3b":"#8a2222",margin:0}}>{message}</p>}
    </form>
   </section>
   <p style={{fontSize:13,color:"#68758a",marginTop:24}}>CALINESCU TECHNOLOGIES LTD · Company no. 17536696. <Link href="/privacy" style={{textDecoration:"underline"}}>Privacy Policy</Link></p>
  </div>
 </main>;
}
