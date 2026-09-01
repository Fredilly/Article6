import type { NextApiRequest, NextApiResponse } from "next";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";
import { getSalesOrganizationDetail, listSalesOrganizations } from "../../../lib/sales-store";
import { normalizeOrganizationName } from "../../../lib/sales-memory";
import { recordSalesCollateral } from "../../../lib/sales-collateral-store";
import { isSalesCollateralDocumentType } from "../../../lib/sales-collateral-types";
import { isCollateralStoragePath, storeCollateralObject, verifyCollateralObject } from "../../../lib/sales-collateral-storage";

type Selector = { id?: string; name?: string; domain?: string };
type Command = { version: 1; operation: "record_collateral"; organization: Selector; collateral: { contactId?: string; tenderOpportunityId?: string; interactionId?: string; fileName: string; displayName?: string; storagePath?: string; fileBase64?: string; contentType?: string; documentType: string; description?: string; sentAt?: string } };
function token(req: NextApiRequest) { const h=req.headers.authorization||""; return h.startsWith("Bearer ")?h.slice(7).trim():null; }
async function resolveOrganization(selector: Selector) {
  if(selector.id){const d=await getSalesOrganizationDetail(selector.id); if(d)return d.organization;}
  const q=selector.domain||selector.name||""; if(!q)throw new Error("Organization selector is required.");
  const candidates=await listSalesOrganizations(q);
  if(selector.domain){const domain=selector.domain.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,"").split("/")[0]; const x=candidates.filter(c=>c.domain?.toLowerCase()===domain); if(x.length===1)return x[0];}
  if(selector.name){const n=normalizeOrganizationName(selector.name); const x=candidates.filter(c=>normalizeOrganizationName(c.name)===n); if(x.length===1)return x[0];}
  if(candidates.length===1)return candidates[0]; throw new Error(candidates.length?"Organization selector is ambiguous.":"Organization not found.");
}
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed."});
  try{const bearer=token(req); if(!bearer)return res.status(401).json({error:"Bearer token required."}); await verifyGitHubActionsOidc(bearer);
    const command=req.body as Command; if(!command||command.version!==1||command.operation!=="record_collateral")return res.status(400).json({error:"Invalid record_collateral command."});
    const org=await resolveOrganization(command.organization); const c=command.collateral;
    if(!c.fileName?.trim())throw new Error("fileName is required.");
    if(!isSalesCollateralDocumentType(c.documentType))throw new Error("Invalid documentType.");
    if(c.sentAt&&Number.isNaN(Date.parse(c.sentAt)))throw new Error("Invalid sentAt timestamp.");

    let storagePath=c.storagePath?.trim();
    let object:{fileSize:number;fileType:string};
    if(storagePath){
      if(!isCollateralStoragePath(storagePath))throw new Error("Collateral storagePath must reference the private Article6 R2 collateral namespace.");
      const verified=await verifyCollateralObject(storagePath);
      object={fileSize:verified.fileSize,fileType:verified.fileType};
    }else if(c.fileBase64){
      const bytes=Buffer.from(c.fileBase64,"base64");
      if(!bytes.length)throw new Error("fileBase64 did not decode to a file.");
      const stored=await storeCollateralObject({organizationId:org.id,fileName:c.fileName.trim(),contentType:c.contentType||"application/pdf",bytes});
      storagePath=stored.storagePath;
      object={fileSize:stored.fileSize,fileType:stored.contentType};
    }else{
      throw new Error("Either storagePath or fileBase64 is required. Filename-only collateral is not allowed.");
    }

    const result=await recordSalesCollateral({organizationId:org.id,contactId:c.contactId,tenderOpportunityId:c.tenderOpportunityId,interactionId:c.interactionId,fileName:c.fileName.trim(),displayName:c.displayName?.trim()||c.fileName.trim(),storagePath,fileType:object.fileType,fileSize:object.fileSize,documentType:c.documentType,description:c.description?.trim(),sentAt:c.sentAt?new Date(c.sentAt).toISOString():undefined});
    return res.status(200).json({ok:true,operation:command.operation,result:{organizationId:org.id,collateralId:result.collateral?.id,created:result.created,storagePath}});
  }catch(error){const message=error instanceof Error?error.message:"CRM collateral automation failed."; const status=/OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message)?403:400; return res.status(status).json({ok:false,error:message});}
}
