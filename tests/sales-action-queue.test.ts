import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../pages/internal/sales/queue.tsx", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");

test("action queue has separate Carbon and Tender views", () => {
  assert.match(page, /kind === "CARBON"/);
  assert.match(page, /kind === "TENDER"/);
  assert.match(store, /listSalesActionQueue/);
  assert.match(store, /'CARBON'::text/);
  assert.match(store, /'TENDER'::text/);
});

test("action queue covers overdue, new-without-outreach, and engaged-without-action records", () => {
  assert.match(page, /OVERDUE/);
  assert.match(page, /item\.status === "NEW" && !item\.hasOutreach/);
  assert.match(page, /item\.status === "ENGAGED" && !item\.nextAction/);
  assert.match(store, /ORDER BY \(next_action_date IS NULL\) ASC, next_action_date ASC/);
});
