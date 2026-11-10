import type {NextApiRequest,NextApiResponse} from "next";
import {timingSafeEqual} from "node:crypto";
import {createSalesOrganization,addSalesContact,addSalesInteraction,updateSalesOrganizationState} from "../../../lib/sales-store";
import {upsertSalesWebServiceProfile} from "../../../lib/sales-web-services";
import {sendContactEnquiryNotification} from "../../../lib/contact-email";

const field=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
function authorized(req:NextApiRequest) {
 const expected=process.env.WEB_REFERRAL_INGEST_TOKEN;
 const actual=req.headers.authorization?.replace(/^Bearer\s+/i,"")||"";
 return !!expected&&!!actual&&Buffer.byteLength(expected)===Buffer.byteLength(actual)&&timingSafeEqual(Buffer.from(expected),Buffer.from(actual));
}
export default async function handler(req:NextApiRequest,res:NextApiResponse) {
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed."});
 if(!authorized(req))return res.status(401).json({error:"Unauthorized."});
 const body=req.body||{};
 // Honeypot checked at both edges; do not acknowledge bot traffic as a real CRM submission.
 if(field(body.companyWebsite,100))return res.status(400).json({error:"Invalid submission."});
 const name=field(body.name,120),email=field(body.email,254).toLowerCase();
 const company=field(body.company,180),message=field(body.message,4000);
 const website=field(body.website,400),service=field(body.service,32);
 const timeline=field(body.timeline,90),budget=field(body.budget,90);
 if(!name||!company||!message||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  return res.status(400).json({error:"Please complete the required fields."});
 if(!["NEW_WEBSITE","REDESIGN","DEVELOPMENT","SEO_GEO","OTHER"].includes(service))
  return res.status(400).json({error:"Choose the type of project."});
 if(website&&!/^https:\/\/[^\s/]+/i.test(website))return res.status(400).json({error:"Invalid website URL."});
 const domain=website?new URL(website).hostname.toLowerCase().replace(/^www\./,""):"";
 const summary=[
  "Inbound website enquiry (websites.article6.org)",
  "Request: "+service,
  "Website: "+(website||"Not supplied"),
  "Timeline: "+(timeline||"Not discussed"),
  "Budget: "+(budget||"Not discussed")+" (currency not assumed)",
  "Project details: "+message
 ].join("\n");
 try{
  const {organization,created}=await createSalesOrganization({name:company,domain,experiment:"WEB_SERVICES",notes:summary});
  // Never reclassify an unrelated CRM account to Web Services.
  if(organization.experiment!=="WEB_SERVICES")return res.status(409).json({error:"Please contact us directly about your existing account."});
  let contact;
  try{
   contact=await addSalesContact({organizationId:organization.id,name,email,notes:"Inbound from websites.article6.org"});
  }catch(error){
   if(error instanceof Error&&/already exists/.test(error.message))
    return res.status(409).json({error:"We already have this contact. Please email contact@article6.org if you need to add details."});
   throw error;
  }
  if(created) await updateSalesOrganizationState({
   organizationId:organization.id,status:"ENGAGED",experiment:"WEB_SERVICES",notes:summary
  });
  await upsertSalesWebServiceProfile(organization.id,{
   ...(website?{websiteUrl:website}:{}),
   primaryService:service==="SEO_GEO"?"GEO_VISIBILITY":service==="OTHER"?"UNKNOWN":"WEBSITE_REDESIGN",
   problemConfirmed:"YES"
  });
  await addSalesInteraction({
   organizationId:organization.id,contactId:contact.id,channel:"WEBSITE",direction:"INBOUND",
   interactionType:"CONTACT_FORM",occurredAt:new Date().toISOString(),
   subject:"Website project enquiry",summary
  });
  const notified=await sendContactEnquiryNotification({
   name,email,organisation:company,
   work:"Website project: "+service,
   message:summary+"\n\nCRM: https://www.article6.org/internal/sales/organizations/"+organization.id
  });
  if(!notified)console.error("[websites-contact] CRM saved but notification failed",{organizationId:organization.id});
  return res.status(201).json({ok:true});
 }catch(error){
  console.error("[websites-contact] CRM intake failed",error);
  return res.status(503).json({error:"We couldn't save your enquiry. Please email contact@article6.org."});
 }
}
