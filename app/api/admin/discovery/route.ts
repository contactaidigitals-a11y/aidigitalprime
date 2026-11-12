import { isAdmin, noStore, safeOrigin } from "../_auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function dateDaysAgo(days:number){return new Date(Date.now()-days*86_400_000).toISOString().slice(0,10);}
export async function GET(req:Request){
 if(!await isAdmin(req))return noStore({error:"Not authorised."},401);
 return noStore({configured:Boolean(process.env.COMPANIES_HOUSE_API_KEY)});
}
export async function POST(req:Request){
 if(!safeOrigin(req))return noStore({error:"Request not allowed."},403);
 if(!await isAdmin(req))return noStore({error:"Not authorised."},401);
 const key=process.env.COMPANIES_HOUSE_API_KEY;
 if(!key)return noStore({error:"Companies House API key missing. Add COMPANIES_HOUSE_API_KEY to Railway."},503);
 let input:Record<string,unknown>;
 try{
  const parsed:unknown=await req.json();
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error();
  input=parsed as Record<string,unknown>;
 }catch{return noStore({error:"Invalid search."},400);}
 const days=Number(input.days)||30;
 const limit=Number(input.limit)||100;
 const offset=Number(input.offset)||0;
 if(!Number.isInteger(days)||days<1||days>30||!Number.isInteger(limit)||limit<1||limit>100||
   !Number.isInteger(offset)||offset<0||offset>4900)return noStore({error:"Invalid search filters."},400);
 const url=new URL("https://api.company-information.service.gov.uk/advanced-search/companies");
 url.searchParams.set("company_status","active");
 url.searchParams.set("company_type","ltd");
 url.searchParams.set("incorporated_from",dateDaysAgo(days));
 url.searchParams.set("incorporated_to",dateDaysAgo(0));
 url.searchParams.set("size",String(limit));
 url.searchParams.set("start_index",String(offset));
 try{
  const res=await fetch(url,{
    headers:{Authorization:"Basic "+Buffer.from(key+":").toString("base64"),Accept:"application/json"},
    signal:AbortSignal.timeout(15000),cache:"no-store"
  });
  if(!res.ok)return noStore({error:res.status===429?"Companies House rate limit reached.":"Companies House search unavailable ("+res.status+")."},502);
  const body=await res.json() as {items?:Array<Record<string,unknown>>;total_results?:number;hits?:number};
  const items=(body.items||[]).slice(0,100).map(item=>{
    const address=(item.registered_office_address||{}) as Record<string,unknown>;
    const companyNumber=String(item.company_number||"");
    const date=String(item.date_of_creation||"");
    const loc=[address.locality,address.region,address.postal_code].filter(v=>typeof v==="string").join(", ");
    return {
      business:String(item.company_name||"").slice(0,150),
      companyNumber,incorporationDate:date,
      industry:"",location:loc,website:"",phone:"",email:"",
      businessType:"ltd",permission:"unverified",
      source:"Companies House",sourceUrl:"https://find-and-update.company-information.service.gov.uk/company/"+encodeURIComponent(companyNumber),
      service:"New Business Launch",observation:"",
      notes:"Verify active trading, public business contact details and marketing eligibility before outreach."
    };
  }).filter(x=>x.business&&x.companyNumber);
  return noStore({leads:items,returned:items.length,offset,days,total:body.total_results??body.hits??null});
 }catch{return noStore({error:"Companies House service temporarily unreachable."},502);}
}
