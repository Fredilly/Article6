import type {NextApiRequest,NextApiResponse} from "next";
import {hasInternalUploadSession} from "../../../lib/internal-auth";
import {listReferralAgents,createReferralAgent,resetReferralPassword,setReferralAgentActive} from "../../../lib/referral-agents";
const str=(v:unknown)=>typeof v==="string"?v.trim():"";
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  res.setHeader("Cache-Control","no-store");
  if(!(await hasInternalUploadSession(req)))return res.status(401).json({error:"Administrator session required."});
  if(req.method==="GET"){
    try{return res.status(200).json({agents:await listReferralAgents()});}
    catch(error){console.error("Referral agents list failed",error);return res.status(503).json({error:"Agent database unavailable. Apply migration 021."});}
  }
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed."});
  try{
    const action=str(req.body?.action),id=str(req.body?.id);
    if(action==="create"){
      const created=await createReferralAgent(str(req.body?.username).toLowerCase(),str(req.body?.displayName));
      return res.status(201).json(created);
    }
    if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Valid agent ID required."});
    if(action==="disable"||action==="enable"){
      await setReferralAgentActive(id,action==="enable");
      return res.status(200).json({ok:true});
    }
    if(action==="reset"){
      const temporaryPassword=await resetReferralPassword(id);
      return res.status(200).json({ok:true,temporaryPassword});
    }
    return res.status(400).json({error:"Unknown agent action."});
  }catch(error){
    const message=error instanceof Error?error.message:"Agent operation failed.";
    return res.status(/duplicate key|unique constraint/i.test(message)?409:400).json({error:/duplicate key|unique constraint/i.test(message)?"Username already exists.":message});
  }
}