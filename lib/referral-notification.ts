interface ReferralNotice {
  organizationId:string; company:string; contact:string; email:string; phone:string;
  agentName:string; username:string; service:string; interest:string; budget:string; notes:string;
}
const serviceNames:Record<string,string>={
  WEBSITE_DESIGN:"New website", WEBSITE_REDESIGN:"Website redesign",
  WEBSITE_DEVELOPMENT:"Website development",SEO_GEO:"SEO / AI visibility",OTHER:"Other service"
};
const interestNames:Record<string,string>={
  UNCONFIRMED:"Interest not confirmed",INTERESTED:"Interested in discussing",
  QUOTE_REQUESTED:"Requested a quote",MEETING_AGREED:"Meeting agreed"
};
function clean(value:string){return value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,150);}
function escapeHtml(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
export function buildPartnerReferralEmail(input:ReferralNotice) {
  const company=clean(input.company),agent=clean(input.agentName);
  const url="https://www.article6.org/internal/sales/organizations/"+encodeURIComponent(input.organizationId);
  const service=serviceNames[input.service]||clean(input.service);
  const interest=interestNames[input.interest]||clean(input.interest);
  const rows:[string,string][]=[
    ["Contact",input.contact],["Email",input.email||"Not provided"],
    ["WhatsApp / phone",input.phone||"Not provided"],
    ["Requested service",service],["Prospect interest",interest],
    ["Budget discussed",input.budget?input.budget+" (currency not verified)":"Not discussed"]
  ];
  const text=[
    "NEW WEBSITE REFERRAL","",
    "Business: "+company,
    "Referred by: "+agent+" (@"+input.username+")",
    ...rows.map(([k,v])=>k+": "+v),
    "Notes: "+(input.notes||"Not supplied"),"",
    "OPEN SALES RECORD: "+url
  ].join("\n");
  const table=rows.map(([label,value])=>`<tr><td style="padding:11px 14px;border-bottom:1px solid #e6e8ed;color:#677080;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:11px 14px;border-bottom:1px solid #e6e8ed;color:#111827;font-size:14px;font-weight:600;word-break:break-word;">${escapeHtml(value)}</td></tr>`).join("");
  const notes=input.notes?`<div style="margin:20px 0 0;padding:15px;background:#f5f6f9;border-radius:10px;"><p style="margin:0 0 8px;color:#677080;font-size:12px;font-weight:bold;">REFERRAL NOTES</p><p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#262d38;">${escapeHtml(input.notes)}</p></div>`:"";
  const html=`<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#f3f4f7;color:#111827;font-family:Arial,Helvetica,sans-serif;"><div style="display:none;font-size:1px;color:#f3f4f7;">${escapeHtml(company)} · ${escapeHtml(service)} · ${escapeHtml(interest)}</div><div style="max-width:620px;margin:0 auto;padding:26px 14px;"><div style="padding:24px;background:#ffffff;border:1px solid #e4e7ed;border-radius:14px;"><p style="font-size:12px;font-weight:bold;letter-spacing:1px;color:#3951d3;margin:0 0 14px;">ARTICLE6 STUDIO / NEW REFERRAL</p><h1 style="font-size:28px;line-height:1.2;letter-spacing:-1px;margin:0 0 8px;color:#121622;">${escapeHtml(company)}</h1><p style="font-size:14px;line-height:1.5;color:#677080;margin:0 0 24px;">Referred by <strong style="color:#111827;">${escapeHtml(agent)}</strong> (@${escapeHtml(input.username)})</p><table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:collapse;">${table}</table>${notes}<a href="${escapeHtml(url)}" style="display:block;margin-top:24px;padding:15px;background:#121622;color:#ffffff;text-decoration:none;font-size:15px;text-align:center;font-weight:bold;border-radius:9px;">Open full sales record →</a><p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#818997;">This link opens your private Article6 CRM. Prospect interest is reported by the referral agent and has not been independently verified.</p></div></div></body></html>`;
  return {subject:"New web referral: "+company+" via "+agent,text,html,url};
}
export async function sendPartnerReferralNotification(input:ReferralNotice):Promise<boolean> {
  const key=process.env.RESEND_API_KEY;
  if(!key){console.error("[partner-referral] Missing RESEND_API_KEY");return false;}
  const recipient=process.env.ADMIN_NOTIFICATION_EMAIL||"contact@article6.org";
  const {subject,text,html}=buildPartnerReferralEmail(input);
  try{
    const res=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{authorization:"Bearer "+key,"content-type":"application/json"},
      body:JSON.stringify({
        from:"Article6 <contact@article6.org>",to:[recipient],
        subject,text,html,tags:[{name:"source",value:"websites-partner-referral"}]
      }),signal:AbortSignal.timeout(8000)
    });
    if(!res.ok){console.error("[partner-referral] Email rejected",res.status,await res.text());return false;}
    return true;
  }catch(e){console.error("[partner-referral] Email error",e);return false;}
}
