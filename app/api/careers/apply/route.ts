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
 const firstName=clean(data.get("firstName"),70),lastName=clean(data.get("lastName"),70),email=clean(data.get("email"),150),phone=clean(data.get("phone"),30),city=clean(data.get("city"),100),nationality=clean(data.get("nationality"),80),languages=clean(data.get("languages"),250),experience=clean(data.get("experience"),1500),rightToWork=clean(data.get("rightToWork"),3);
 if(!firstName||!lastName||!email||!phone||!city||!languages||!["Yes","No"].includes(rightToWork)||clean(data.get("privacyAcknowledged"))!=="yes")return Response.json({message:"Please complete all required fields."},{status:400});
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
 const rows=[["First name",firstName],["Last name",lastName],["Email",email],["Phone",phone],["Town / city",city],["Nationality (optional)",nationality||"Not provided"],["Languages",languages],["Right to work in UK",rightToWork],["Sales experience",experience||"Not provided"],["Submitted (UTC)",new Date().toISOString()]];
 const html='<h1>New sales partner application</h1>'+rows.map(([name,value])=>'<p><strong>'+escape(name)+':</strong> '+escape(value)+'</p>').join("");
 try{
  const result=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(15000),headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[to],reply_to:email,subject:"Sales partner application — "+firstName+" "+lastName,html,text:rows.map(x=>x.join(": ")).join("\n"),...(attachments.length?{attachments}:{})})});
  if(result.ok){
   // Send a separate acknowledgement; never expose an applicant's CV in this email.
   const applicantHtml='<div style="font-family:Arial,sans-serif;max-width:620px;color:#17233a"><h2>Application received</h2><p>Hi '+escape(firstName)+',</p><p>Thank you for applying to become an Independent Sales Partner with AI Digital Prime (CALINESCU TECHNOLOGIES LTD).</p><p>We have received your application. Someone from our team will be in touch shortly about the next steps, which may include an AI-assisted introductory interview.</p><p>If you have any questions in the meantime, you can reach us at <a href="mailto:'+escape(siteConfig.contactEmail)+'">'+escape(siteConfig.contactEmail)+'</a>.</p><p>Kind regards,<br>AI Digital Prime Recruitment</p></div>';
   try {
    const ack=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(12000),headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[email],reply_to:siteConfig.contactEmail,subject:"We received your application | AI Digital Prime",html:applicantHtml,text:"Hi "+firstName+",\n\nThank you for applying to become an Independent Sales Partner with AI Digital Prime (CALINESCU TECHNOLOGIES LTD).\n\nWe have received your application. Someone from our team will be in touch shortly about the next steps, which may include an AI-assisted introductory interview.\n\nQuestions? Email "+siteConfig.contactEmail+"\n\nAI Digital Prime Recruitment"})});
    return Response.json({ok:true,acknowledgementSent:ack.ok});
   } catch {return Response.json({ok:true,acknowledgementSent:false});}
  }
 }catch{}
 return Response.json({message:"We could not deliver your application. Please try again later."},{status:502});
}
