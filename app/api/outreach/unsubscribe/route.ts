import { unsubscribe } from "../../admin/prospects/_store";
export const runtime="nodejs";
export async function POST(req:Request){
 let data:{token?:string};
 try{
  if(Number(req.headers.get("content-length")||0)>1000)return Response.json({error:"Too large."},{status:413});
  data=await req.json();
 }catch{return Response.json({error:"Invalid request."},{status:400});}
 if(typeof data.token!=="string")return Response.json({error:"Invalid token."},{status:400});
 try{
  const ok=await unsubscribe(data.token);
  return Response.json({ok},{status:ok?200:404,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Unable to unsubscribe."},{status:503});}
}
