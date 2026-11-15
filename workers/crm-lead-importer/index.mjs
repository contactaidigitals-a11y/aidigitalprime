import pg from "pg";
import { randomUUID } from "node:crypto";
import { enrich } from "./enrich.mjs";
import { rejectLocalBusiness, sharedWebsiteCount, hostOf } from "./local-business.mjs";

// Daily, no-contact prospect research worker for AI Digital Prime Public CRM.
// No automated phone calls or marketing messages, no agent assignment.
const TARGET=Math.min(100,Math.max(1,Number(process.env.LEADS_PER_DAY)||100));
const DRY_RUN=process.env.DRY_RUN==="1";
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
 for(const endpoint of ["https://overpass.private.coffee/api/interpreter","https://overpass-api.de/api/interpreter"]){
  try{
   const response=await fetch(endpoint,{method:"POST",body,headers:{"Accept":"application/json","User-Agent":"AIDigitalPrimeProspecting/1.0 (https://aidigitalprime.co.uk)"},signal:AbortSignal.timeout(75000)});
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
async function insertLead(client,row,day){
 const sql=[
  "INSERT INTO partner_portal.leads (id,company,phone,website,industry,address,business_hours,notes,activity_description,products_services,contact_email,company_number,research_source,status,created)",
  "SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'new',now()",
  "WHERE NOT EXISTS (SELECT 1 FROM partner_portal.leads x WHERE",
  "($3::text IS NOT NULL AND x.phone=$3) OR",
  "($4::text IS NOT NULL AND regexp_replace(lower(coalesce(x.website,'')), '^(https?://)?(www[.])?', '')=$4) OR",
  "(lower(trim(x.company))=lower(trim($2)) AND lower(trim(coalesce(x.address,'')))=lower(trim($6))))",
  "ON CONFLICT DO NOTHING RETURNING id"
 ].join(" ");
 const source="daily-leads:"+day+" | "+row.source;
 const values=[
  randomUUID(),row.name,row.phone,row.website,row.type,row.address,row.hours,row.notes,
  row.description,row.description,row.email,row.companyNumber||'',source
 ];
 const result=await client.query(sql,values);
 return result.rowCount===1;
}
function londonDay(){
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(new Date());
 const obj=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return obj.year+"-"+obj.month+"-"+obj.day;
}

const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000,query_timeout:20000});
const today=londonDay(),seed=Math.floor(new Date(today+"T00:00:00Z").getTime()/86400000);
let created=0,attempted=0,seen=0,verified=0,errors=[],locked=false;
const deadline=Date.now()+70*60_000;
try{
 await client.connect();
 const lock=await client.query("SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",["aidp:overnight-crm:"+today]);
 locked=Boolean(lock.rows[0]?.acquired);
 if(!locked){console.log("Another overnight import is already running for "+today);process.exitCode=0;}
 else {
  await client.query("CREATE TABLE IF NOT EXISTS partner_portal.crm_lead_import_runs (run_date date primary key, created_count integer not null default 0, candidate_count integer not null default 0, attempted_count integer not null default 0, status text not null default 'started', detail text not null default '', updated_at timestamptz not null default now())");
  if(!DRY_RUN){
   const count=await client.query("SELECT count(*)::int AS n FROM partner_portal.leads WHERE research_source LIKE $1",["daily-leads:"+today+" | %"]);
   created=count.rows[0]?.n||0;
  }
  for(let group=0;group<10&&created<TARGET&&Date.now()<deadline;group++){
   const first=(seed*7+group*3)%CITIES.length;
   const regions=[CITIES[first],CITIES[(first+Math.floor(CITIES.length/2))%CITIES.length]];
   const raw=await fetchRegion(regions);
   seen+=raw.length;
   const leads=candidates(raw,regions);
   console.log("UK areas: "+regions.map(v=>v[0]).join(", ")+"; researched candidates "+leads.length);
   // Verify six independent business websites concurrently. Keep database
   // writes serial to respect duplicate prevention and the exact daily cap.
   for(let offset=0;offset<leads.length;offset+=6){
    if(created>=TARGET||Date.now()>=deadline||DRY_RUN&&verified>=10)break;
    const slice=leads.slice(offset,offset+6);
    const checked=await Promise.all(slice.map(async row=>{
     try{return await enrich(row);}catch(e){errors.push(String(e).slice(0,180));return null;}
    }));
    for(const details of checked){
     if(created>=TARGET||Date.now()>=deadline||DRY_RUN&&verified>=10)break;
     attempted++;
     if(!details)continue;
     verified++;
     if(DRY_RUN){if(verified<=5)console.log("VERIFIED PREVIEW "+JSON.stringify({...details,tags:undefined}).slice(0,900));continue;}
     try{
      const saved=await insertLead(client,details,today);
      if(saved)created++;
      if(saved&&created%20===0){
       await client.query("INSERT INTO partner_portal.crm_lead_import_runs(run_date,created_count,candidate_count,attempted_count,status,detail) VALUES ($1,$2,$3,$4,'running','') ON CONFLICT(run_date) DO UPDATE SET created_count=$2,candidate_count=crm_lead_import_runs.candidate_count+$3,attempted_count=crm_lead_import_runs.attempted_count+$4,status='running',updated_at=now()",[today,created,seen,attempted]);
      }
     }catch(e){errors.push(String(e).slice(0,180));}
    }
   }
   if(DRY_RUN)break;
  }
  if(!DRY_RUN){
   await client.query("INSERT INTO partner_portal.crm_lead_import_runs(run_date,created_count,candidate_count,attempted_count,status,detail) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(run_date) DO UPDATE SET created_count=$2,candidate_count=$3,attempted_count=$4,status=$5,detail=$6,updated_at=now()",[today,created,seen,attempted,created>=TARGET?"complete":"partial",errors.slice(0,6).join(" | ")]);
  }
  console.log(JSON.stringify({ukDate:today,target:TARGET,created,attempted,seen,verified,dryRun:DRY_RUN,errors:errors.slice(0,6)}));
  if(!DRY_RUN&&created<TARGET)process.exitCode=2;
 }
}catch(e){console.error("Overnight importer failed: "+String(e));process.exitCode=1;}
finally{
 if(locked)await client.query("SELECT pg_advisory_unlock(hashtext($1))",["aidp:overnight-crm:"+today]).catch(()=>{});
 await client.end().catch(()=>{});
}
