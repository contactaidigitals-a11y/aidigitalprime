"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import "./careers.css";

const inputStyle = { width: "100%", padding: "15px 16px", border: "1px solid rgba(217,242,229,.25)", borderRadius: 9, background: "#102832", color: "#f4f8f4" };
const labelStyle = { display: "block", fontWeight: 650, marginBottom: 8, color: "#dcebe4" } as const;
const panelStyle = { border: "1px solid rgba(217,242,229,.16)", borderRadius: 16, padding: "clamp(24px,4vw,46px)", background: "linear-gradient(150deg,#142a33,#0b1d27)", boxShadow: "0 24px 70px rgba(0,0,0,.22)" };

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
   setStatus("sent"); setMessage(data.acknowledgementSent ? "Application received. We have emailed your confirmation. Our team will be in touch shortly." : "Application received. Our team will be in touch shortly. We were unable to confirm delivery of the acknowledgement email.");
   form.reset(); setCvName("");
  } catch(error) {
   setStatus("error"); setMessage(error instanceof Error?error.message:"We could not send your application.");
  }
 }
 function cvChanged(event:ChangeEvent<HTMLInputElement>) { setCvName(event.target.files?.[0]?.name||""); }
 return <main className="careers-page" style={{ minHeight:"100vh",background:"radial-gradient(ellipse at 85% 3%,#1c4c44 0%,#0b1c26 37%,#07131c 74%)",padding:"42px 20px 82px",color:"#f4f8f4",fontFamily:"DM Sans,system-ui,sans-serif" }}>
  <div style={{ maxWidth:850,margin:"0 auto" }}>
   <a href="https://aidigitalprime.co.uk/prime/index.html" className="careers-brand"><span className="careers-brand-mark">✳</span> AI DIGITAL<span>PRIME</span><small>← Back to home</small></a>
   <p className="careers-kicker">JOIN OUR NETWORK &nbsp; / &nbsp; CAREERS</p>
   <h1 style={{ fontFamily:"Space Grotesk,system-ui,sans-serif",fontSize:"clamp(38px,6vw,65px)",letterSpacing:"-.06em",lineHeight:1.05,margin:"10px 0 22px" }}>Make every connection <span style={{color:"#a9efd6"}}>count.</span></h1><h2 style={{fontFamily:"Space Grotesk,system-ui,sans-serif",fontSize:"clamp(19px,2.4vw,26px)",fontWeight:500,margin:"0 0 12px",color:"#e4f3eb"}}>B2B Sales Representative – Cold Calling</h2>
   <p style={{ color:"#a8bfc0",fontSize:17,marginBottom:30,maxWidth:730 }}>Join AI Digital Prime as an independent B2B Sales Representative. You will contact UK businesses through outbound cold calling, introduce our AI receptionists, websites and chatbots, identify businesses that could benefit, and explain how our services help them handle enquiries and grow. You will manage your own outreach, follow up with interested decision-makers and refer qualified opportunities to our team. This is a flexible self-employed, commission-only opportunity with no fixed salary; you may find your own leads and receive optional lead suggestions. All outreach must follow UK marketing and data-protection rules.</p>
   <div style={{border:"1px solid rgba(169,239,214,.35)",background:"rgba(32,83,69,.23)",borderRadius:12,padding:"22px 24px",marginBottom:28}}><strong>What happens next?</strong><p style={{margin:"8px 0",color:"#c2d9d0"}}>Once you apply, our team will review your details and may invite you to a short, approximately five-minute telephone conversation with our AI agent. It will explain our company, the B2B services you would introduce during cold calls, how the commission-only partnership works, and ask a few questions about your experience. Our team makes all final decisions.</p><p style={{margin:"8px 0 0",color:"#c2d9d0"}}>Questions for our team? Email <a style={{textDecoration:"underline",color:"#a9efd6"}} href="mailto:contact.aidigitals@gmail.com">contact.aidigitals@gmail.com</a>.</p></div>
   <section style={panelStyle}>
    <h2 style={{marginTop:0,fontSize:27,fontFamily:"Space Grotesk,system-ui,sans-serif",letterSpacing:"-.035em"}}>Your application<span style={{color:"#a9efd6"}}>.</span></h2>
    <p style={{color:"#a8bbbc",fontSize:14}}>Fields marked * are required. No CV? You can still apply.</p>
    <form onSubmit={submit} encType="multipart/form-data" className="careers-form" style={{display:"grid",gap:18}}>
     <div className="careers-field-grid">
      <div><label style={labelStyle} htmlFor="firstName">First name *</label><input style={inputStyle} id="firstName" name="firstName" required maxLength={70} autoComplete="given-name"/></div>
      <div><label style={labelStyle} htmlFor="lastName">Last name *</label><input style={inputStyle} id="lastName" name="lastName" required maxLength={70} autoComplete="family-name"/></div>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
      <div><label style={labelStyle} htmlFor="email">Email address *</label><input style={inputStyle} id="email" name="email" type="email" required maxLength={150} autoComplete="email"/></div>
      <div><label style={labelStyle} htmlFor="phone">Phone number *</label><input style={inputStyle} id="phone" name="phone" type="tel" required maxLength={30} autoComplete="tel"/></div>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
      <div><label style={labelStyle} htmlFor="city">Town / city where you live *</label><input style={inputStyle} id="city" name="city" required maxLength={100} autoComplete="address-level2"/></div>
      <div><label style={labelStyle} htmlFor="nationality">Nationality *</label><input style={inputStyle} id="nationality" name="nationality" required maxLength={80} autoComplete="off"/><small style={{color:"#a8bbbc"}}>Not used to assess your eligibility.</small></div>
     </div>
     <fieldset style={{border:"1px solid rgba(217,242,229,.2)",borderRadius:9,padding:"18px 20px"}}><legend style={{fontWeight:700}}>How would you rate your English? *</legend><div className="careers-options">{["Native","Fluent / professional","Intermediate / conversational","Basic"].map(option=><label key={option} className="careers-radio-option"><input type="radio" name="englishLevel" value={option} required/><span>{option}</span></label>)}</div></fieldset>
     <fieldset style={{border:"1px solid rgba(217,242,229,.2)",borderRadius:8,padding:16}}>
      <legend style={{fontWeight:700}}>Do you currently have the right to work in the UK? *</legend>
      <label style={{marginRight:24}}><input type="radio" name="rightToWork" value="Yes" required/> Yes</label>
      <label><input type="radio" name="rightToWork" value="No" required/> No</label>
      <p style={{fontSize:13,color:"#a8bbbc",marginBottom:0}}>Please do not upload passports, visas or identity documents at this stage.</p>
     </fieldset>
     <div><label style={labelStyle} htmlFor="experience">Sales experience (optional)</label><textarea style={{...inputStyle,minHeight:94}} id="experience" name="experience" maxLength={1500} placeholder="Tell us briefly about relevant experience."/></div>
     <div><label style={labelStyle} htmlFor="cv">CV / résumé (optional, PDF or DOCX, max 2 MB)</label><input id="cv" name="cv" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={cvChanged}/>{cvName&&<p style={{fontSize:13,color:"#bcd0c8"}}>Selected: {cvName}</p>}</div>
     <div style={{position:"absolute",left:"-10000px"}} aria-hidden="true"><label htmlFor="website">Leave this empty</label><input type="text" name="website" id="website" tabIndex={-1} autoComplete="off"/></div>
     <label style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:14}}><input type="checkbox" name="privacyAcknowledged" value="yes" required style={{marginTop:5}}/><span>I have read the <Link href="/privacy" style={{color:"#a9efd6",textDecoration:"underline"}}>Privacy Policy</Link> and understand that my information will be used to review my application. *</span></label>
     <button disabled={status==="sending"} type="submit" style={{padding:"14px 22px",border:0,borderRadius:9,background:"#a9efd6",color:"#0b2824",fontWeight:750,cursor:"pointer"}}>{status==="sending"?"Submitting…":"Submit application"}</button>
     {message&&<p role="status" style={{padding:12,borderRadius:8,background:status==="sent"?"#e8f8ef":"#fff1f1",color:status==="sent"?"#155c3b":"#8a2222",margin:0}}>{message}</p>}
    </form>
   </section>
   <p style={{fontSize:13,color:"#a8bbbc",marginTop:24}}>CALINESCU TECHNOLOGIES LTD · Company no. 17536696. <Link href="/privacy" style={{textDecoration:"underline"}}>Privacy Policy</Link></p>
  </div>
 </main>;
}
