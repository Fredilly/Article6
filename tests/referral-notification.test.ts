import test from "node:test";
import assert from "node:assert/strict";
import {buildPartnerReferralEmail} from "../lib/referral-notification.ts";

const referral={
 organizationId:"83220e22-a952-42c7-a3e1-303f97e58097",
 company:"Testing <Business>",contact:"CEO",email:"buyer@example.com",phone:"+97112345678",
 agentName:"Claudia Rodgi",username:"claudia",service:"WEBSITE_DESIGN",
 interest:"QUOTE_REQUESTED",budget:"2000",notes:"Needs a homepage & booking form."
};
test("referral email has readable sections and a direct CRM link",()=>{
 const email=buildPartnerReferralEmail(referral);
 assert.match(email.subject,/via Claudia Rodgi/);
 assert.match(email.html,/Requested a quote/);
 assert.match(email.html,/Open full sales record/);
 assert.match(email.html,/href="https:\/\/www\.article6\.org\/internal\/sales\/organizations\/83220e22-a952-42c7-a3e1-303f97e58097"/);
 assert.match(email.html,/currency not verified/);
 assert.match(email.text,/buyer@example.com/);
});
test("partner-supplied HTML is escaped in notification",()=>{
 const email=buildPartnerReferralEmail({...referral,company:'<script>alert("x")</script>',notes:'<img src=x onerror=alert(1)>'});
 assert.doesNotMatch(email.html,/<script>|<img src=x/);
 assert.match(email.html,/&lt;script&gt;/);
 assert.match(email.html,/&lt;img/);
});
