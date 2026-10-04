import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeScoopLearningReport } from "../lib/scoop-learning-reader";
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
