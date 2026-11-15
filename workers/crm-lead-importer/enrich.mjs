import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import https from "node:https";
import { rejectLocalBusiness, rejectCorporateWebsite } from "./local-business.mjs";

// One bounded HTTPS GET per public business website. DNS addresses are checked
// and pinned per request to avoid fetching internal addresses from OSM URLs.
function globalIp(ip) {
 const family=isIP(ip);
 if (family===4) {
  const a=ip.split(".").map(Number);
  return !(a[0]===0 || a[0]===10 || a[0]===127 || a[0]>=224 ||
   a[0]===169&&a[1]===254 || a[0]===172&&a[1]>=16&&a[1]<=31 ||
   a[0]===192&&a[1]===168 || a[0]===100&&a[1]>=64&&a[1]<=127 ||
   a[0]===198&&a[1]>=18&&a[1]<=19 || a[0]===192&&a[1]===0&&a[2]===0 ||
   a[0]===192&&a[1]===0&&a[2]===2 || a[0]===198&&a[1]===51&&a[2]===100 ||
   a[0]===203&&a[1]===0&&a[2]===113);
 }
 if(family===6){
  const x=ip.toLowerCase();
  return !(/^(::|::1$|fe[89ab]|fc|fd|ff|2001:db8)/.test(x) ||
   x.startsWith("::ffff:") || x.startsWith("2001:0:"));
 }
 return false;
}
function validSite(target) {
 try{
  const u=new URL(target);
  if(u.protocol!=="https:" || u.username || u.password || u.port && u.port!=="443")return null;
  if(isIP(u.hostname) || !u.hostname.includes(".") || u.hostname.endsWith(".local") || u.hostname.endsWith(".internal"))return null;
  if(u.href.length>500)return null;
  return u;
 }catch{return null;}
}
function request(url,remoteIp,depth=0){
 return new Promise((resolve)=>{
  let finished=false;
  const finish=(data)=>{if(!finished){finished=true;resolve(data);}};
  let total=0,body="",req;
  try{
   req=https.request(url,{
    method:"GET",timeout:6500,maxHeaderSize:8192,
    lookup:(hostname,options,cb)=>cb(null,remoteIp.address,remoteIp.family),
    headers:{"User-Agent":"AI-Digital-Prime-CRM-Research/1.0 (+https://aidigitalprime.co.uk)","Accept":"text/html,application/xhtml+xml"}
   },res=>{
    const status=res.statusCode||0;
    if(status>=300&&status<400&&res.headers.location){
     res.resume();finish({redirect:String(res.headers.location),status});return;
    }
    if(status<200||status>=300 || !/text\/html|application\/xhtml\+xml/i.test(String(res.headers["content-type"]||""))){
     res.resume();finish({status,html:""});return;
    }
    res.on("data",chunk=>{
     total+=chunk.length;
     if(total<=220000)body+=chunk.toString("utf8");
     else {req.destroy();finish({status,html:body});}
    });
    res.on("end",()=>finish({status,html:body}));
   });
   req.on("timeout",()=>{req.destroy();finish(null);});
   req.on("error",()=>finish(null));
   req.end();
  }catch{finish(null);}
 });
}
async function page(url,depth=0){
 if(depth>2)return null;
 const parsed=validSite(url);
 if(!parsed)return null;
 const ips=await lookup(parsed.hostname,{all:true}).catch(()=>[]);
 if(!ips.length||ips.some(x=>!globalIp(x.address)))return null;
 const selected=ips.find(x=>x.family===4)||ips[0];
 const result=await request(parsed,selected,depth);
 if(!result)return null;
 if(result.redirect){
  const next=new URL(result.redirect,parsed);
  if(next.protocol!=="https:")return null;
  return page(next.href,depth+1);
 }
 return result;
}
const strip=(text)=>String(text||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&(?:amp|nbsp|quot|apos|#39);/g," ").replace(/\s+/g," ").trim();
const words=(value)=>String(value||"").toLowerCase().replace(/&amp;/g,"and").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(x=>x.length>=4&&!["limited","studio","centre","company","clinic","salon","beauty","the"].includes(x));
const normalizedDigits=(s)=>String(s||"").replace(/\D/g,"");
const firstPublicEmail=(s)=>String(s||"").split(/[;, ]+/).map(v=>v.trim().toLowerCase()).find(v=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))||"";
function htmlEmail(html){
 const matches=[...html.matchAll(/mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/ig)];
 const emails=matches.map(m=>m[1].toLowerCase()).filter(v=>!/(example|no-reply|noreply|test)@/.test(v));
 return emails.find(e=>/^(info|hello|contact|reception|bookings|enquiries|office|admin|team)@/.test(e))||"";
}
function activityFromOSM(tags,industry){
 const desc=String(tags["description:en"]||tags.description||"").replace(/\s+/g," ").slice(0,220);
 const services=String(tags.service||tags.beauty||tags.speciality||"").replace(/\s+/g," ").slice(0,150);
 return [industry,services,desc].filter(Boolean).join(" — ").slice(0,500);
}
export async function enrich(row){
 const t=row.tags||{};
 if(!row.phone || !row.website)return null; // callable leads, not just directories
 if(rejectLocalBusiness(row))return null;
 const closure=Object.entries(t).some(([k,v])=>/^(disused|abandoned|demolished|was:|closed:|construction:)/.test(k)&&v || String(v).toLowerCase()==="permanently closed");
 if(closure||t.access==="no"||t.opening_hours==="closed"||t["operational_status"]==="closed")return null;
 const target="https://"+row.website;
 const result=await page(target);
 if(!result||result.status<200||result.status>=300||!result.html){if(process.env.DIAGNOSTIC_ENRICH==="1")console.log("WEBSITE_REJECT inaccessible "+target);return null;}
 const chainEvidence=rejectCorporateWebsite(result.html);
 if(chainEvidence){if(process.env.DIAGNOSTIC_ENRICH==="1")console.log("CHAIN_REJECT "+row.name+" "+chainEvidence);return null;}
 const title=(result.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||"";
 const plain=strip(result.html).slice(0,25000).toLowerCase();
 const tokens=words(row.name);
 const titleText=strip(title).toLowerCase();
 const count=tokens.filter(token=>plain.includes(token)).length;
 const phoneDigits=normalizedDigits(row.phone).replace(/^44/,"0");
 const phoneMatch=phoneDigits.length>=10 && normalizedDigits(result.html).includes(phoneDigits);
 const nameMatch=tokens.length>0 && count >= Math.min(2,tokens.length);
 const titleMatch=tokens.some(token=>titleText.includes(token));
 // Reject generic or unrelated websites rather than marking them as active.
 if(!phoneMatch && !(nameMatch&&titleMatch)){if(process.env.DIAGNOSTIC_ENRICH==="1")console.log("WEBSITE_REJECT identity "+row.name+" "+target);return null;}
 const verifiedAt=new Date().toISOString();
 const email=firstPublicEmail(t["contact:email"]||t.email)||htmlEmail(result.html);
 const hours=String(t.opening_hours||"").slice(0,250);
 const desc=activityFromOSM(t,row.type);
 const social=[t["contact:instagram"]||t.instagram,t["contact:facebook"]||t.facebook].filter(Boolean).map(String).slice(0,2);
 const companyNumber=String(t["ref:GB:companies_house"]||t["ref:GB:CompaniesHouse"]||"").trim().toUpperCase();
 const validCompanyNumber=/^(?:[0-9]{8}|[A-Z]{2}[0-9]{6})$/.test(companyNumber)?companyNumber:"";
 const sources=[row.source,target,...social].join(" | ").slice(0,1300);
 const evidence=(phoneMatch?"Website reachable; listed phone also appears online.":"Website reachable; business name matches website title/content.");
 const notes=[
   "RESEARCHED "+verifiedAt.slice(0,16)+" UK. Likely active — "+evidence,
   "LOCAL BUSINESS FILTER: no identifiable large-brand/network tags or obvious chain evidence; ownership and employee count NOT independently verified.",
   "This is not proof the premises is open or the phone line works.",
   "Sales team must screen TPS + CTPS, previous objections and check UK GDPR/PECR before marketing calls.",
   "OSM © OpenStreetMap contributors (ODbL): https://www.openstreetmap.org/copyright",
   t["check_date"]?"OSM last checked: "+String(t["check_date"]).slice(0,25):"",
   row.osmTimestamp?"OSM last edited: "+String(row.osmTimestamp).slice(0,25):"",
   social.length?"Social: "+social.join(" ; "):""
 ].filter(Boolean).join("\n").slice(0,3000);
 return {...row,hours,email,companyNumber:validCompanyNumber,companySize:"Local small business (unverified)",description:desc,source:sources,notes,verifiedAt,confidence:phoneMatch?"website-phone-match":"website-name-match"};
}
