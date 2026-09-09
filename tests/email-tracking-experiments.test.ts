import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const trackingPage = fs.readFileSync(new URL("../pages/internal/sales/email-tracking.tsx", import.meta.url), "utf8");

test("email tracking uses the selected CRM experiment instead of treating every lead as a tender", () => {
  assert.match(trackingPage, /experiment === "TENDER_READINESS"/);
  assert.match(trackingPage, /experiment === "WEB_SERVICES"\) return "Web Services"/);
  assert.match(trackingPage, /WEB_SERVICES_MANUAL_GMAIL/);
  assert.match(trackingPage, /trackingCategoryLabel\(selected\?\.organization\.experiment\)/);
});

test("Web Services can use open tracking without adding a visible link", () => {
  assert.match(trackingPage, /return \{ trackClicks: false, destination: "", linkText: "" \}/);
  assert.match(trackingPage, /Track link clicks/);
  assert.match(trackingPage, /Open tracking only\. No visible Article6 link will be inserted\./);
  assert.match(trackingPage, /approvedDestination: trackClicks \? destination \|\| undefined : undefined/);
});
