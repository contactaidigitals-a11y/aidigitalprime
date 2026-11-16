// Conservative prospect rules: focus on independently run neighbourhood businesses.
// Heuristics cannot prove ownership, headcount or that a shop is still trading.
const BRAND_NAME=/(?:\b(?:specsavers|vision express|boots opticians|boots pharmacy|superdrug|mydentist|bupa dental care|bupa health|dental partners|portman dental|ramsay health|nuffield health|spire healthcare|kwik[\s-]?fit|halfords|national tyres|formula one autocentres|in[\s-]?n[\s-]?out autocentres|mr clutch|stoneacre|arnold clark|evans halshaw|bristol street motors|sytner|lookers|tony\s*&\s*guy|toni\s*&\s*guy|supercuts|rush hair|headmasters|regis salons|the massage company|travelodge|premier inn|holiday inn|ibis|best western|marriott|hilton|easyhotel|chancellors|foxtons|haart|connells|william h brown|your move|reeds rains|purplebricks|belvoir|martin\s*&\s*co|dexters|hamptons|winkworth|savills|knight frank)\b)/i;
const CHAIN_HOST=/(?:^|\.)(?:specsavers|visionexpress|boots|superdrug|mydentist|bupadentalcare|portmandentalcare|kwik-fit|halfords|national|f1autocentres|arnoldclark|evanshalshaw|stoneacre|sytner|lookers|toniandguy|supercuts|rush|headmasters|regis|chancellors|foxtons|haart|connells|your-move|reedsrains|purplebricks|belvoir|martinco|dexters|savills|knightfrank|premierinn|travelodge|holidayinn|hilton|marriott|ibis|bestwestern)\.(?:co\.uk|com|uk)$/i;
const DIRECTORY_HOST=/(?:^|\.)(?:fresha|treatwell|booksy|yell|checkatrade|bark|facebook|instagram|linktr\.ee|linktree|google|maps\.google|booking|expedia|tripadvisor)\.(?:co\.uk|com|me|net)$/i;
const normalize=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
export function hostOf(website) {
 try {
  const u=new URL(/^https?:\/\//i.test(website) ? website : "https://"+website);
  return u.hostname.toLowerCase().replace(/^www\./,"");
 }catch{return "";}
}
export function rejectLocalBusiness(row){
 const tags=row.tags||{}, name=String(row.name||""), host=hostOf(row.website||"");
 if(!name.trim() || !host)return "missing identity or website";
 if(BRAND_NAME.test(name)||CHAIN_HOST.test(host))return "known national or large business brand";
 if(DIRECTORY_HOST.test(host))return "directory or booking aggregator, not business website";
 if(/(?:^|\.)(?:nhs|gov)\.uk$/.test(host)||host.endsWith(".nhs.uk")||host.endsWith(".gov.uk"))return "public-sector organisation, not independent local business";
 if(/(?:^|\.)(?:thetanningshop)\.co\.uk$/.test(host))return "multi-branch chain";
 if(/\bmassage\s+parlour\b/i.test(name))return "non-target specialist business";
 if(tags["brand:wikidata"]||tags["operator:wikidata"]||tags.network||tags["network:wikidata"]||tags.franchise)return "branded chain or franchise network";
 if(tags.brand&&normalize(tags.brand)!==normalize(name))return "different brand operating this location";
 if(tags["operator:type"]&&/^(public|government|national|multinational)$/i.test(String(tags["operator:type"])))return "public or large organisation";
 if(tags["operator"]&&BRAND_NAME.test(String(tags["operator"])))return "known corporate operator";
 if(tags["shop"]==="department_store"||tags["shop"]==="mall")return "large retail operator";
 return "";
}
export function rejectCorporateWebsite(html){
 // Only unequivocal corporate/chain markers: don't reject a local firm simply
 // for a generic "locations" link or mentions of customers across the UK.
 const body=String(html||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ");
 const text=body.replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").toLowerCase().slice(0,100000);
 if(/\b(?:find your nearest (?:branch|salon|clinic|store|garage)|our nationwide (?:network|locations|branches)|franchise (?:opportunities|locations|network)|over (?:\d{2,}|\d+,?\d{3}) (?:branches|stores|clinics|locations|salons))\b/.test(text))return "corporate multi-location or franchise evidence on site";
 if(/\b(?:more than|over|across)\s+(?:50|100|200|500|1000)\s+(?:branches|locations|stores|clinics|salons)\b/.test(text))return "large number of locations";
 return "";
}
export function sharedWebsiteCount(rows){
 const counts=new Map();
 for(const row of rows){
  const hostname=hostOf(row.website||"");
  if(hostname)counts.set(hostname,(counts.get(hostname)||0)+1);
 }
 return counts;
}
