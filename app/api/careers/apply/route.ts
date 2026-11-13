import { siteConfig } from "../../../config";

const attempts=new Map<string,{count:number,reset:number}>();
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const clean=(value:FormDataEntryValue|null,max=250)=>typeof value==="string"?value.trim().slice(0,max):"";
export async function POST(request:Request) {
 const origin=request.headers.get("origin"), host=request.headers.get("host");
 if(origin&&host){try{if(new URL(origin).host!==host)return Response.json({message:"Request not allowed."},{status:403});}catch{return Response.json({message:"Request not allowed."},{status:403});}}
 const ip=request.headers.get("cf-connecting-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";
 const now=Date.now(),old=attempts.get(ip);
 if(old&&old.reset>now&&old.count>=4)return Response.json({message:"Too many applications. Please try again later."},{status:429});
 attempts.set(ip,old&&old.reset>now?{count:old.count+1,reset:old.reset}:{count:1,reset:now+600000});
 if(attempts.size>1000)for(const [key,value]of attempts)if(value.reset<=now)attempts.delete(key);
 const maxRequest=3*1024*1024;
 const declaredLength=Number(request.headers.get("content-length")||0);
 if(declaredLength>maxRequest)return Response.json({message:"Application is too large. Maximum CV size is 2 MB."},{status:413});
 let data:FormData;
 try{data=await request.formData();}catch{return Response.json({message:"Invalid application."},{status:400});}
 if(clean(data.get("website")))return Response.json({ok:true});
 const firstName=clean(data.get("firstName"),70),lastName=clean(data.get("lastName"),70),email=clean(data.get("email"),150),phone=clean(data.get("phone"),30),city=clean(data.get("city"),100),nationality=clean(data.get("nationality"),80),englishLevel=clean(data.get("englishLevel"),40),experience=clean(data.get("experience"),1500),rightToWork=clean(data.get("rightToWork"),3);
 if(!firstName||!lastName||!email||!phone||!city||!nationality||!["Native","Fluent / professional","Intermediate / conversational","Basic"].includes(englishLevel)||!["Yes","No"].includes(rightToWork)||clean(data.get("privacyAcknowledged"))!=="yes")return Response.json({message:"Please complete all required fields."},{status:400});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^[+0-9() .-]{7,30}$/.test(phone))return Response.json({message:"Enter a valid email address and phone number."},{status:400});
 const cv=data.get("cv");const attachments:Array<{filename:string,content:string}>=[];
 if(cv instanceof File&&cv.size>0){
  if(cv.size>2*1024*1024)return Response.json({message:"CV must be 2 MB or smaller."},{status:413});
  const ext=cv.name.toLowerCase().split(".").pop();
  if(!["pdf","docx"].includes(ext||""))return Response.json({message:"CV must be a PDF or DOCX."},{status:400});
  const bytes=new Uint8Array(await cv.arrayBuffer());
  const isPdf=bytes.length>4&&bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70&&bytes[4]===45;
  const isDocx=bytes.length>3&&bytes[0]===80&&bytes[1]===75&&bytes[2]===3&&bytes[3]===4;
  if((ext==="pdf"&&!isPdf)||(ext==="docx"&&!isDocx))return Response.json({message:"Invalid CV file."},{status:400});
  attachments.push({filename:ext==="pdf"?"candidate-cv.pdf":"candidate-cv.docx",content:Buffer.from(bytes).toString("base64")});
 }
 const apiKey=process.env.RESEND_API_KEY,from=process.env.LEAD_FROM_EMAIL,to=process.env.CAREERS_TO_EMAIL||process.env.LEAD_TO_EMAIL||siteConfig.contactEmail;
 if(!apiKey||!from)return Response.json({message:"Applications are temporarily unavailable; your information has not been sent."},{status:503});
 const rows=[["First name",firstName],["Last name",lastName],["Email",email],["Phone",phone],["Town / city",city],["Nationality",nationality],["English proficiency",englishLevel],["Right to work in UK",rightToWork],["Sales experience",experience||"Not provided"],["Submitted (UTC)",new Date().toISOString()]];
 const html='<h1>New sales partner application</h1>'+rows.map(([name,value])=>'<p><strong>'+escape(name)+':</strong> '+escape(value)+'</p>').join("");
 try{
  const result=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(15000),headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[to],reply_to:email,subject:"Sales partner application — "+firstName+" "+lastName,html,text:rows.map(x=>x.join(": ")).join("\n"),...(attachments.length?{attachments}:{})})});
  if(result.ok){
   // Send a separate acknowledgement; never expose an applicant's CV in this email.
   const applicantHtml = `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#edf3f0;font-family:Arial,Helvetica,sans-serif;color:#132a31"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#edf3f0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border-radius:16px;overflow:hidden;background:#ffffff"><tr><td style="padding:32px 36px 40px;background:#0a1922;color:#f4faf6"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:32px;line-height:1;color:#a9efd6;width:48px;font-weight:bold">✳</td><td style="font-size:18px;font-weight:800;letter-spacing:-.5px">AI DIGITAL <span style="color:#a9efd6">PRIME</span></td></tr></table><p style="margin:34px 0 7px;font-size:11px;letter-spacing:2.4px;color:#a9efd6;font-weight:700">CAREERS / APPLICATION</p><h1 style="margin:0;font-size:34px;line-height:1.15;letter-spacing:-1px;color:#ffffff">Application<br><span style="color:#a9efd6">received.</span></h1><p style="margin:14px 0 0;color:#b8d2c7;font-size:15px">Thank you for your interest in joining our network.</p></td></tr><tr><td style="padding:34px 36px 28px"><p style="margin:0 0 18px;font-size:17px">Hi ${escape(firstName)},</p><p style="margin:0 0 18px;line-height:1.7;font-size:15px">Thank you for applying to become an <strong>Independent Sales Partner</strong> with AI Digital Prime.</p><p style="margin:0 0 18px;line-height:1.7;font-size:15px">We have received your application. Someone from our team will be in touch shortly about the next steps, which may include a short AI-assisted introductory interview.</p><div style="padding:18px 20px;border-left:4px solid #78d3b7;background:#eff8f4;border-radius:0 9px 9px 0;margin:26px 0"><strong style="font-size:14px;color:#123b31">What happens next?</strong><p style="margin:7px 0 0;font-size:14px;line-height:1.6;color:#34574e">We will review your application and contact you using the details you provided. Final decisions are made by our team.</p></div><p style="font-size:15px;line-height:1.7;margin:0 0 26px">Questions? Email us at <a style="color:#166c57;text-decoration:underline" href="mailto:${escape(siteConfig.contactEmail)}">${escape(siteConfig.contactEmail)}</a>.</p><p style="font-size:15px;line-height:1.6;margin:0">Kind regards,<br><strong>AI Digital Prime Recruitment</strong></p></td></tr><tr><td style="padding:20px 36px;background:#f5f8f6;border-top:1px solid #e0eae5;font-size:12px;color:#647b70;line-height:1.6">AI Digital Prime · CALINESCU TECHNOLOGIES LTD · Company no. 17536696<br><a style="color:#396b5d" href="https://aidigitalprime.co.uk/prime/index.html">Visit our website</a> · <a style="color:#396b5d" href="https://aidigitalprime.co.uk/privacy">Privacy Policy</a></td></tr></table></td></tr></table></body></html>`;
   try {
    const ack=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(12000),headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[email],reply_to:siteConfig.contactEmail,subject:"We received your application | AI Digital Prime",html:applicantHtml,text:["Hi "+firstName+",","Thank you for applying to become an Independent Sales Partner with AI Digital Prime (CALINESCU TECHNOLOGIES LTD).","We have received your application. Someone from our team will be in touch shortly about the next steps, which may include an AI-assisted introductory interview. Final decisions are made by our team.","Questions? Email "+siteConfig.contactEmail,"AI Digital Prime Recruitment"].join("\n\n")})});
    return Response.json({ok:true,acknowledgementSent:ack.ok});
   } catch {return Response.json({ok:true,acknowledgementSent:false});}
  }
 }catch{}
 return Response.json({message:"We could not deliver your application. Please try again later."},{status:502});
}
