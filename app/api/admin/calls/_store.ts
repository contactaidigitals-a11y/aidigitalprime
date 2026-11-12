import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT=process.env.AIDP_USAGE_DATA_DIR||"/data/aidp-usage";
const FILE=path.join(ROOT,"operator-calls.json");
type CallState="initiated"|"completed"|"failed";
export type OperatorCall={
 id:string;prospectId:string;business:string;phone:string;
 elevenConversationId:string;twilioCallSid:string;
 createdAt:string;consentEvidence:string;consentCheckedAt:string;
 status:CallState;outcome:string;operatorNotes:string;
};
const sane=(x:unknown,n=300)=>typeof x==="string"?x.trim().slice(0,n):"";
let queue:Promise<unknown>=Promise.resolve();
function serial<T>(run:()=>Promise<T>){
 const next=queue.then(run,run);queue=next.then(()=>{},()=>{});
 return next;
}
export async function readOperatorCalls():Promise<OperatorCall[]>{
 try {const data:unknown=JSON.parse(await readFile(FILE,"utf8"));return Array.isArray(data)?data.filter(x=>x&&typeof x.id==="string") as OperatorCall[]:[];}
 catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return [];throw e;}
}
async function commit(rows:OperatorCall[]){
 await mkdir(ROOT,{recursive:true,mode:0o700});
 const tmp=FILE+"."+randomBytes(8).toString("hex");
 await writeFile(tmp,JSON.stringify(rows),{mode:0o600});
 await rename(tmp,FILE);
}
export async function saveOperatorCall(record:OperatorCall){
 await serial(async()=>{const rows=await readOperatorCalls();rows.push(record);await commit(rows);});
}
export async function updateOperatorCall(id:string,status:CallState,outcome:string,operatorNotes:string){
 return serial(async()=>{const rows=await readOperatorCalls();const call=rows.find(x=>x.id===id);
 if(!call)throw Error("Call not found");
 call.status=status;call.outcome=sane(outcome,150);call.operatorNotes=sane(operatorNotes,2000);
 await commit(rows);return call;
 });
}
