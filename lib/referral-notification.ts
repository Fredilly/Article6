interface ReferralNotice {
  organizationId:string; company:string; contact:string; email:string; phone:string;
  agentName:string; username:string; service:string; interest:string; budget:string; notes:string;
}
function clean(value:string){return value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,150);}
export async function sendPartnerReferralNotification(input:ReferralNotice):Promise<boolean> {
  const key=process.env.RESEND_API_KEY;
  if(!key){console.error("[partner-referral] Missing RESEND_API_KEY");return false;}
  const recipient=process.env.ADMIN_NOTIFICATION_EMAIL || "contact@article6.org";
  const url="https://www.article6.org/internal/sales/organizations/"+encodeURIComponent(input.organizationId);
  const message=[
    "New website referral", "",
    "Partner: "+input.agentName+" (@"+input.username+")",
    "Business: "+input.company, "Contact: "+input.contact,
    "Email: "+(input.email||"Not supplied"),"WhatsApp/phone: "+(input.phone||"Not supplied"),
    "Service: "+input.service,"Interest: "+input.interest,
    "Budget discussed: "+(input.budget||"Not supplied"),
    "Notes: "+(input.notes||"Not supplied"),"",
    "Open in Article6 CRM: "+url
  ].join("\n");
  try {
    const res=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{authorization:"Bearer "+key,"content-type":"application/json"},
      body:JSON.stringify({
        from:"Article6 <contact@article6.org>",to:[recipient],
        subject:"New web referral: "+clean(input.company)+" via "+clean(input.agentName),
        text:message,
        tags:[{name:"source",value:"websites-partner-referral"}]
      }),
      signal:AbortSignal.timeout(8000)
    });
    if(!res.ok){console.error("[partner-referral] Email rejected",res.status,await res.text());return false;}
    return true;
  }catch(e){console.error("[partner-referral] Email error",e);return false;}
}
