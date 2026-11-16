import { lookup } from "node:dns/promises";
import { enrich } from "./enrich.mjs";
const samples=[
{name:"Cheek Wellbeing Ltd",website:"cheekwellbeing.com",phone:"+441923269535",type:"Beauty salon",tags:{},source:"https://www.openstreetmap.org/node/2568267916"},
{name:"RAD Clinics Milton Keynes",website:"radclinics.co.uk",phone:"+441908596996",type:"Clinic",tags:{},source:"https://www.openstreetmap.org/node/12682454510"},
{name:"Rhondda Bed and Breakfast",website:"rhonddahouse.com",phone:"+442084275009",type:"Accommodation",tags:{},source:"https://www.openstreetmap.org/node/5081908782"}
];
for(const row of samples){
 const started=Date.now(),host=row.website;
 let addresses=await lookup(host,{all:true}).catch(e=>({error:e.code||e.message}));
 console.log("DIAG DNS",host,Array.isArray(addresses)?addresses.map(x=>x.family):addresses);
 try{
  const r=await fetch("https://"+host,{signal:AbortSignal.timeout(9000),redirect:"manual"});
  console.log("DIAG native-fetch",host,{status:r.status,contentType:r.headers.get("content-type"),ms:Date.now()-started});
  await r.body?.cancel().catch(()=>{});
 }catch(e){console.log("DIAG native-fetch ERROR",host,String(e),String(e.cause||"").slice(0,250))}
 try{
  const found=await enrich(row);
  console.log("DIAG enrich",host,{verified:!!found,ms:Date.now()-started,confidence:found?.confidence});
 }catch(e){console.error("DIAG enrich ERROR",host,String(e),e?.stack?.slice(0,450))}
}
console.log("DIAG FINISHED (no CRM writes)");
