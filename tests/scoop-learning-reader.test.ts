import assert from "node:assert/strict";
import test from "node:test";
import { aggregateScoopLearningReport, sanitizeScoopLearningReport } from "../lib/scoop-learning-reader.ts";
import type { ScoopLearningReport } from "../lib/scoop-learning";

test("sanitized Scoop learning report removes sensitive and raw fields", () => {
  const input: ScoopLearningReport = {
    session_id: "secret-session",
    totals: { feedback_count: 3, wrong_count: 2, correct_count: 1 },
    learning: { scoop_count: 2, results_count: 2, no_results_count: 0 },
    corrections: [{ raw: "secret" }],
    failure_categories: [{ category: "Apparel", subcategory: "T-shirt", failures: 2 }],
    repeated_bad_candidates: [{ evidence_key: "secret-evidence", candidate_key: "abc", wrong_count: 2, correct_count: 0 }],
    provider_query_patterns: [{ provider: "ebay", query_text: "sensitive raw query", corrections: 2 }],
    learning_queue: [{
      event_id: "event-1",
      session_id: "secret-session",
      evidence_key: "secret-evidence",
      result_id: "result-1",
      feedback_type: "wrong_item",
      result_class: "SIMILAR",
      brand: "Brand",
      model: "Model",
      provider: "ebay",
      vision_model: "gemini",
    }],
  };

  const output = sanitizeScoopLearningReport(input);
  assert.equal(output.session_id, null);
  assert.deepEqual(output.corrections, []);
  assert.equal(output.repeated_bad_candidates[0].evidence_key, undefined);
  assert.equal(output.provider_query_patterns[0].query_text, undefined);
  assert.equal(output.learning_queue[0].session_id, undefined);
  assert.equal(output.learning_queue[0].evidence_key, undefined);
  assert.equal(output.learning_queue[0].event_id, "event-1");
});


test("aggregate Scoop learning report exposes no individual queue or candidate records", () => {
  const input: ScoopLearningReport = {
    session_id: "secret-session",
    totals: { feedback_count: 3, wrong_count: 2, correct_count: 1 },
    learning: { scoop_count: 4, results_count: 3, no_results_count: 1 },
    corrections: [{ raw: "secret" }],
    failure_categories: [{ category: "Apparel", subcategory: "T-shirt", failures: 2 }],
    repeated_bad_candidates: [
      { evidence_key: "secret-evidence", candidate_key: "abc", wrong_count: 2, correct_count: 0 },
    ],
    provider_query_patterns: [
      { provider: "ebay", query_text: "secret raw query", corrections: 2 },
    ],
    learning_queue: [{
      event_id: "event-1",
      session_id: "secret-session",
      evidence_key: "secret-evidence",
      result_id: "result-1",
      feedback_type: "wrong_item",
      brand: "Secret Brand",
      model: "Secret Model",
      provider: "ebay",
    }],
  };

  const output = aggregateScoopLearningReport(input);
  assert.equal(output.unresolved_learning_items, 1);
  assert.equal(output.repeated_bad_candidate_count, 1);
  assert.deepEqual(output.provider_corrections, [{ provider: "ebay", corrections: 2 }]);
  assert.equal("learning_queue" in output, false);
  assert.equal("repeated_bad_candidates" in output, false);
  assert.equal("corrections" in output, false);
  assert.equal(JSON.stringify(output).includes("event-1"), false);
  assert.equal(JSON.stringify(output).includes("Secret Brand"), false);
  assert.equal(JSON.stringify(output).includes("abc"), false);
  assert.equal(JSON.stringify(output).includes("secret raw query"), false);
});
