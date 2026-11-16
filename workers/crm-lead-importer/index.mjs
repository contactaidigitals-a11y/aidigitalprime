import pg from "pg";
import { randomUUID } from "node:crypto";
import { enrich } from "./enrich.mjs";
import { rejectLocalBusiness, sharedWebsiteCount, hostOf } from "./local-business.mjs";

// Daily, no-contact prospect research worker for AI Digital Prime Public CRM.
// No automated phone calls or marketing messages, no agent assignment.
const TARGET=Math.min(300,Math.max(1,Number(process.env.LEADS_PER_DAY)||150));
const REVIEW_TARGET=Math.min(5000,Math.max(TARGET,Number(process.env.REVIEW_PER_DAY)||1000));
const MAX_REVIEW_TARGET=Math.max(REVIEW_TARGET,Math.min(5000,REVIEW_TARGET*3));
const CONCURRENCY=12;
const DRY_RUN=process.env.DRY_RUN==="1";
const DIAG_LIMIT=DRY_RUN?Math.max(1,Number(process.env.DIAGNOSTIC_MAX_ATTEMPTS)||Infinity):Infinity;
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL missing");
const CITIES=[
 ["London",51.5074,-0.1278],["Manchester",53.4808,-2.2426],
 ["Birmingham",52.4862,-1.8904],["Leeds",53.8008,-1.5491],
 ["Glasgow",55.8642,-4.2518],["Liverpool",53.4084,-2.9916],
 ["Bristol",51.4545,-2.5879],["Sheffield",53.3811,-1.4701],
 ["Edinburgh",55.9533,-3.1883],["Nottingham",52.9548,-1.1581],
 ["Leicester",52.6369,-1.1398],["Coventry",52.4068,-1.5197],
 ["Newcastle",54.9783,-1.6178],["Cardiff",51.4816,-3.1791],
 ["Belfast",54.5973,-5.9301],["Oxford",51.752,-1.2577],
 ["Cambridge",52.2053,0.1218],["Brighton",50.8225,-0.1372],
 ["Southampton",50.9097,-1.4044],["Portsmouth",50.8198,-1.088],
 ["Plymouth",50.3755,-4.1427],["Exeter",50.7184,-3.5339],
 ["Bath",51.3811,-2.359],["Reading",51.4543,-0.9781],
 ["Milton Keynes",52.0406,-0.7594],["Luton",51.8787,-0.42],
 ["Bradford",53.795,-1.7594],["York",53.9591,-1.0815],
 ["Hull",53.7676,-0.3274],["Sunderland",54.9069,-1.3838],
 ["Derby",52.9225,-1.4746],["Stoke-on-Trent",53.0027,-2.1794],
 ["Wolverhampton",52.5862,-2.1286],["Norwich",52.6309,1.2974],
 ["Ipswich",52.0567,1.1482],["Colchester",51.8959,0.8919],
 ["Chelmsford",51.7356,0.4685],["Southend",51.5459,0.7077],
 ["Bournemouth",50.7192,-1.8808],["Swindon",51.5558,-1.7797],
 ["Northampton",52.2405,-0.9027],["Peterborough",52.5695,-0.2405],
 ["Aberdeen",57.1497,-2.0943],["Dundee",56.462,-2.9707],
 ["Inverness",57.4778,-4.2247],["Stirling",56.1165,-3.9369],
 ["Swansea",51.6214,-3.9436],["Newport",51.5842,-2.9977],
 ["Wrexham",53.0461,-2.9937],["Derry",54.9966,-7.3086],
 ["Maidstone",51.2704,0.5227],["Canterbury",51.2802,1.0789],
 ["Harlow",51.7729,0.1023],["Slough",51.5105,-0.595],
 ["Watford",51.6565,-0.3903],["Croydon",51.3762,-0.0982],
 ["Ilford",51.5588,0.0741],["Romford",51.5761,0.1836],
 ["Guildford",51.2362,-0.5704],["Woking",51.3168,-0.56]
];
function sector(t) {
 if(t.amenity==="dentist")return "Dental practice";
 if(t.amenity==="veterinary")return "Veterinary practice";
 if(t.amenity==="clinic")return "Clinic";
 if(t.amenity==="doctors")return "Medical practice";
 if(t.shop==="hairdresser")return "Hair salon";
 if(t.shop==="beauty"||t.craft==="beautician")return "Beauty salon";
 if(t.shop==="tattoo"||t.craft==="tattoo_artist")return "Tattoo studio";
 if(t.shop==="car_repair"||t.craft==="car_repair")return "Vehicle repair";
 if(t.shop==="optician")return "Optician";
 if(t.shop==="massage")return "Massage business";
 if(t.office==="estate_agent")return "Estate agency";
 if(t.tourism==="hotel"||t.tourism==="guest_house")return "Accommodation";
 return "";
}
function number(value){
 let p=String(value||"").split(/[;,]/)[0].replace(/[^0-9+]/g,"");
 if(p.startsWith("0044"))p="+44"+p.slice(4);
 else if(p.startsWith("44"))p="+"+p;
 else if(p.startsWith("0"))p="+44"+p.slice(1);
 return /^\+44\d{9,10}$/.test(p)?p:null;
}
function site(value){
 try{
  const raw=String(value||"").split(";")[0].trim();
  if(!raw)return null;
  const u=new URL(/^https?:\/\//i.test(raw)?raw:"https://"+raw);
  if(!["http:","https:"].includes(u.protocol))return null;
  return (u.hostname.toLowerCase().replace(/^www\./,"")+u.pathname.replace(/\/$/,"")).slice(0,300);
 }catch{return null;}
}
function nearby(el,region){
 const p=el.center||el;
 if(typeof p.lat!=="number"||typeof p.lon!=="number")return region[0][0];
 return region.reduce((a,b)=>((p.lat-b[1])**2+(p.lon-b[2])**2*0.4)<((p.lat-a[1])**2+(p.lon-a[2])**2*0.4)?b:a)[0];
}
function postal(t,city){
 return [...new Set([
  [t["addr:housenumber"],t["addr:street"]].filter(Boolean).join(" "),
  t["addr:suburb"],t["addr:city"]||t["addr:town"]||city,t["addr:postcode"]
 ].filter(Boolean).map(String))].join(", ").slice(0,350);
}
function ql(region){
 const parts=[];
 for(const [,lat,lon] of region){
  const box=[lat-0.072,lon-0.115,lat+0.072,lon+0.115].map(v=>v.toFixed(4)).join(",");
  parts.push('nwr["shop"~"^(hairdresser|beauty|tattoo|car_repair|optician|massage)$"]["name"]('+box+');');
  parts.push('nwr["amenity"~"^(dentist|veterinary|clinic|doctors)$"]["name"]('+box+');');
  parts.push('nwr["craft"~"^(car_repair|beautician|tattoo_artist)$"]["name"]('+box+');');
  parts.push('nwr["office"="estate_agent"]["name"]('+box+');');
  parts.push('nwr["tourism"~"^(hotel|guest_house)$"]["name"]('+box+');');
 }
 return "[out:json][timeout:40];("+parts.join("")+");out center meta;";
}
async function fetchRegion(region){
 const body=new URLSearchParams({data:ql(region)});
 for(const endpoint of ["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter"]){
  try{
   const response=await fetch(endpoint,{method:"POST",body,headers:{"Accept":"application/json","User-Agent":"AIDigitalPrimeProspecting/1.0 (https://aidigitalprime.co.uk)"},signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw Error("HTTP "+response.status);
   const json=await response.json();
   if(!Array.isArray(json.elements))throw Error("Invalid OSM response");
   return json.elements;
  }catch(e){console.error("Provider unavailable: "+String(e));}
 }
 return [];
}
function candidates(elements,region){
 const groups=new Map();
 for(const el of elements){
  const t=el.tags||{},name=String(t.name||"").trim().slice(0,200),type=sector(t);
  const phone=number(t.phone||t["contact:phone"]);
  const website=site(t.website||t["contact:website"]);
  if(!name||!type||!phone||!website||t.disused==="yes"||t.abandoned==="yes"||t["disused:shop"]||t["disused:amenity"])continue;
  if(!groups.has(type))groups.set(type,[]);
  const row={name,type,phone,website,address:postal(t,nearby(el,region)),source:"https://www.openstreetmap.org/"+el.type+"/"+el.id,tags:t,osmTimestamp:el.timestamp||""};
  if(rejectLocalBusiness(row))continue;
  groups.get(type).push(row);
 }
 const allRows=[...groups.values()].flat();
 const counts=sharedWebsiteCount(allRows);
 // Three or more premises sharing one company website are unlikely to be
 // the independent local businesses requested. Even small chains are excluded.
 for(const [industry,rows] of groups){groups.set(industry,rows.filter(row=>(counts.get(hostOf(row.website))||0)<=2));}
 const keys=[...groups.keys()].sort(),all=[];
 for(const g of groups.values())g.sort((a,b)=>Number(Boolean(b.phone))-Number(Boolean(a.phone)));
 let any=true;
 while(any){any=false;for(const k of keys){const a=groups.get(k).shift();if(a){all.push(a);any=true;}}}
 return all;
}

function canonicalPhone(value){
 let digits=String(value||"").replace(/[^0-9]/g,"");
 if(digits.startsWith("0044"))digits=digits.slice(4);
 else if(digits.startsWith("44"))digits=digits.slice(2);
 else if(digits.startsWith("0"))digits=digits.slice(1);
 return digits;
}
function nameAddressKey(row){
 const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
 return norm(row.name||row.company)+"|"+norm(row.address);
}
function registerKnown(known,row){
 const phone=canonicalPhone(row.phone),host=hostOf(row.website||"");
 if(phone)known.phones.add(phone);
 if(host)known.hosts.add(host);
 if((row.name||row.company)&&row.address)known.names.add(nameAddressKey(row));
}
function isKnown(known,row){
 const phone=canonicalPhone(row.phone),host=hostOf(row.website||"");
 return Boolean((phone&&known.phones.has(phone))||(host&&known.hosts.has(host))||(row.address&&known.names.has(nameAddressKey(row))));
}
function qualityScore(row){
 const sectors={"Dental practice":30,"Vehicle repair":29,"Medical practice":27,"Clinic":26,"Optician":23,"Estate agency":22,"Accommodation":16,"Beauty salon":13,"Hair salon":13,"Tattoo studio":12,"Veterinary practice":11,"Massage business":10};
 const address=String(row.address||"");
 const edited=new Date(row.osmTimestamp||0).getTime();
 const recent=Number.isFinite(edited)&&edited>Date.now()-2*365*86400000;
 return 25+(sectors[row.type]||10)+(row.confidence==="website-phone-match"?25:12)+
 (row.email?14:0)+(row.hours?8:0)+(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(address)?10:0)+
 (row.companyNumber?5:0)+(recent?5:0);
}
async function insertLead(client,row,day){
 const sql=[
 "INSERT INTO partner_portal.leads (id,company,phone,website,industry,address,business_hours,notes,activity_description,products_services,contact_email,company_number,company_size,research_source,status,created)",
 "SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'new',now()",
 "WHERE NOT EXISTS (SELECT 1 FROM partner_portal.leads x WHERE",
 "($3::text IS NOT NULL AND regexp_replace(regexp_replace(coalesce(x.phone,''),'[^0-9]','','g'),'^(0044|44|0)','') = $16) OR",
 "($15::text IS NOT NULL AND regexp_replace(regexp_replace(lower(coalesce(x.website,'')), '^(https?://)?(www[.])?', ''), '/.*$', '') = $15) OR",
 "(lower(trim(x.company))=lower(trim($2)) AND lower(trim(coalesce(x.address,'')))=lower(trim($6))))",
 "ON CONFLICT DO NOTHING RETURNING id"
 ].join(" ");
 const values=[randomUUID(),row.name,row.phone,row.website,row.type,row.address,row.hours||"",row.notes||"",
 row.description||row.type,row.description||row.type,row.email||"",row.companyNumber||"",
 row.companySize||"Local business (size unverified)","daily-leads:"+day+" | "+row.source,
 hostOf(row.website||""),canonicalPhone(row.phone)];
 const result=await client.query(sql,values);
 return result.rowCount===1;
}
function ukClock(date=new Date()){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const o=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return {day:o.year+"-"+o.month+"-"+o.day,hour:Number(o.hour)};
}
function nextDay(day){
 const d=new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);
}
const clock=ukClock(),utcHour=new Date().getUTCHours();
const inWindow=clock.hour>=20||clock.hour<8;
const today=clock.hour>=20?nextDay(clock.day):clock.day;
const finalSlot=utcHour===6;
const seed=Math.floor(new Date(today+"T00:00:00Z").getTime()/86400000);
const deadline=Date.now()+Math.min(30,Math.max(5,Number(process.env.MAX_RUN_MINUTES)||22))*60_000;
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000,query_timeout:20000});
let inserted=0,reviewedCount=0,qualifiedCount=0,seen=0,checkedThisRun=0,errors=[],locked=false;
const errorBrief=e=>String(e?.message||e).slice(0,180);
try{
 if(!inWindow)console.log("Overnight CRM worker idle: outside 20:00-08:00 UK window; no changes.");
 else{
  await client.connect();
  const lock=await client.query("SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",["aidp:overnight-crm:"+today]);
  locked=Boolean(lock.rows[0]?.acquired);
  if(!locked)console.log("Another overnight import is already running for "+today);
  else{
   await client.query("CREATE TABLE IF NOT EXISTS partner_portal.crm_lead_import_runs (run_date date primary key, created_count integer not null default 0, candidate_count integer not null default 0, attempted_count integer not null default 0, status text not null default 'started', detail text not null default '', updated_at timestamptz not null default now())");
   await client.query("ALTER TABLE partner_portal.crm_lead_import_runs ADD COLUMN IF NOT EXISTS next_group integer not null default 0");
   await client.query("CREATE TABLE IF NOT EXISTS partner_portal.crm_lead_import_candidates (run_date date not null, source_id text not null, name text not null, phone text, website_host text, checked_at timestamptz not null default now(), result text not null, score integer not null default 0, profile jsonb, PRIMARY KEY (run_date,source_id))");
   await client.query("CREATE INDEX IF NOT EXISTS crm_lead_candidates_rank ON partner_portal.crm_lead_import_candidates(run_date,result,score DESC)");
   await client.query("INSERT INTO partner_portal.crm_lead_import_runs(run_date) VALUES ($1) ON CONFLICT DO NOTHING",[today]);
   const prior=await client.query("SELECT count(*)::int AS n FROM partner_portal.leads WHERE research_source LIKE $1",["daily-leads:"+today+" | %"]);
   inserted=prior.rows[0].n;
   const known={phones:new Set(),hosts:new Set(),names:new Set()};
   const existing=await client.query("SELECT company,phone,website,address FROM partner_portal.leads");
   for(const row of existing.rows)registerKnown(known,row);
   const stage=await client.query("SELECT source_id,phone,website_host,result FROM partner_portal.crm_lead_import_candidates WHERE run_date=$1",[today]);
   const seenIds=new Set(stage.rows.map(r=>r.source_id));
   const seenPhones=new Set(stage.rows.map(r=>canonicalPhone(r.phone)).filter(Boolean));
   const seenHosts=new Set(stage.rows.map(r=>r.website_host).filter(Boolean));
   reviewedCount=seenIds.size;
   qualifiedCount=stage.rows.filter(r=>r.result==="eligible").length;
   const needMore=()=>reviewedCount<REVIEW_TARGET||qualifiedCount<TARGET;
   const room=()=>DRY_RUN?reviewedCount<Math.min(30,DIAG_LIMIT):reviewedCount<MAX_REVIEW_TARGET&&needMore();
   for(let group=0;group<32&&room()&&Date.now()<deadline;group++){
    const r=await client.query("UPDATE partner_portal.crm_lead_import_runs SET next_group=next_group+1,updated_at=now() WHERE run_date=$1 RETURNING next_group-1 AS n",[today]);
    const cursor=r.rows[0].n;
    const first=(seed*7+cursor*3)%CITIES.length;
    const region=[CITIES[first],CITIES[(first+Math.floor(CITIES.length/2))%CITIES.length]];
    const raw=await fetchRegion(region);seen+=raw.length;
    const leads=candidates(raw,region);
    console.log("RESEARCH_REGION "+JSON.stringify({day:today,areas:region.map(x=>x[0]),cursor,candidates:leads.length}));
    const fresh=[];
    for(const row of leads){
     const phone=canonicalPhone(row.phone),host=hostOf(row.website);
     if(seenIds.has(row.source)||seenPhones.has(phone)||seenHosts.has(host)||isKnown(known,row))continue;
     seenIds.add(row.source);if(phone)seenPhones.add(phone);if(host)seenHosts.add(host);fresh.push(row);
    }
    for(let offset=0;offset<fresh.length&&room()&&Date.now()<deadline;offset+=CONCURRENCY){
     const batch=fresh.slice(offset,offset+Math.min(CONCURRENCY,MAX_REVIEW_TARGET-reviewedCount));
     const checked=await Promise.all(batch.map(async row=>{try{return await enrich(row);}catch(e){if(errors.length<6)errors.push(errorBrief(e));return null;}}));
     for(let i=0;i<batch.length;i++){
      const row=batch[i],details=checked[i];reviewedCount++;checkedThisRun++;if(details)qualifiedCount++;
      if(DRY_RUN){if(details&&checkedThisRun<=5)console.log("VERIFIED PREVIEW "+JSON.stringify({name:details.name,type:details.type,phone:details.phone,website:details.website,score:qualityScore(details)}));continue;}
      const profile=details?Object.fromEntries(Object.entries(details).filter(([key])=>key!=="tags")):null;
      try{await client.query("INSERT INTO partner_portal.crm_lead_import_candidates(run_date,source_id,name,phone,website_host,result,score,profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) ON CONFLICT(run_date,source_id) DO NOTHING",[
       today,row.source,row.name,row.phone,hostOf(row.website),details?"eligible":"rejected",details?qualityScore(details):0,profile?JSON.stringify(profile):null
      ]);}catch(e){if(errors.length<6)errors.push("STAGING: "+errorBrief(e));throw e;}
     }
    }
    if(DRY_RUN)break;
   }
   if(!DRY_RUN){
    const counters=await client.query("SELECT count(*)::int AS reviewed,count(*) FILTER (WHERE result='eligible')::int AS qualified FROM partner_portal.crm_lead_import_candidates WHERE run_date=$1",[today]);
    reviewedCount=counters.rows[0].reviewed;qualifiedCount=counters.rows[0].qualified;
    const publish=(reviewedCount>=REVIEW_TARGET&&qualifiedCount>=TARGET)||finalSlot;
    if(publish&&inserted<TARGET){
     const ranked=await client.query("SELECT profile FROM partner_portal.crm_lead_import_candidates WHERE run_date=$1 AND result='eligible' ORDER BY score DESC,checked_at ASC",[today]);
     for(const item of ranked.rows){
      if(inserted>=TARGET)break;
      const lead=item.profile;
      if(!lead||isKnown(known,lead))continue;
      try{
       const saved=await insertLead(client,lead,today);
       if(saved){inserted++;registerKnown(known,lead);if(inserted===1||inserted%10===0)console.log("CRM_INSERT_PROGRESS "+JSON.stringify({ukDate:today,inserted,target:TARGET,screened:reviewedCount}));}
      }catch(e){if(errors.length<6)errors.push("INSERT: "+errorBrief(e));console.error("CRM_INSERT_ERROR "+errorBrief(e));}
     }
    }
    const complete=inserted>=TARGET&&reviewedCount>=REVIEW_TARGET;
    const status=complete?"complete":(publish?"partial":"researching");
    const summary="Screened "+reviewedCount+"/"+REVIEW_TARGET+"; eligible "+qualifiedCount+"; imported "+inserted+"/"+TARGET;
    await client.query("UPDATE partner_portal.crm_lead_import_runs SET created_count=$2,candidate_count=$3,attempted_count=$4,status=$5,detail=$6,updated_at=now() WHERE run_date=$1",[
     today,inserted,qualifiedCount,reviewedCount,status,summary+(errors.length?" | "+errors.join(" | "):"")
    ]);
    console.log("DAILY_IMPORT_SUMMARY "+JSON.stringify({ukDate:today,screeningTarget:REVIEW_TARGET,reviewed:reviewedCount,eligible:qualifiedCount,importTarget:TARGET,inserted,published:publish,finalSlot,status,checkedThisRun,rawRecordsSeen:seen,errors}));
    if(!complete)console.warn("PARTIAL_IMPORT: "+summary+"; no placeholders or unverified businesses created.");
   }else console.log("DRY_RUN_SUMMARY "+JSON.stringify({ukDate:today,checkedThisRun,reviewedCount,rawRecordsSeen:seen}));
  }
 }
}catch(e){console.error("Overnight importer failed: "+errorBrief(e));process.exitCode=1;}
finally{
 if(locked)await client.query("SELECT pg_advisory_unlock(hashtext($1))",["aidp:overnight-crm:"+today]).catch(()=>{});
 await client.end().catch(()=>{});
}
