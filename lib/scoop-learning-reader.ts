import type { ScoopLearningReport } from "./scoop-learning";

export function sanitizeScoopLearningReport(report: ScoopLearningReport): ScoopLearningReport {
  return {
    session_id: null,
    totals: report.totals,
    learning: report.learning,
    corrections: [],
    failure_categories: report.failure_categories.map(({ category, subcategory, failures }) => ({
      category,
      subcategory,
      failures,
    })),
    repeated_bad_candidates: report.repeated_bad_candidates.map(({ candidate_key, wrong_count, correct_count }) => ({
      candidate_key,
      wrong_count,
      correct_count,
    })),
    provider_query_patterns: report.provider_query_patterns.map(({ provider, corrections }) => ({
      provider,
      corrections,
    })),
    learning_queue: report.learning_queue.map((item) => ({
      event_id: item.event_id,
      result_id: item.result_id,
      feedback_type: item.feedback_type,
      result_class: item.result_class,
      created_at: item.created_at,
      brand: item.brand,
      model: item.model,
      category: item.category,
      subcategory: item.subcategory,
      provider: item.provider,
      vision_model: item.vision_model,
      visible_text_json: item.visible_text_json,
      logos_markings_json: item.logos_markings_json,
      distinctive_features_json: item.distinctive_features_json,
      latency_ms: item.latency_ms,
      verification_cost_usd: item.verification_cost_usd,
    })),
  };
}


export type ScoopLearningAggregateReport = {
  totals: ScoopLearningReport["totals"];
  learning: ScoopLearningReport["learning"];
  failure_categories: ScoopLearningReport["failure_categories"];
  provider_corrections: Array<{ provider?: string; corrections?: number }>;
  repeated_bad_candidate_count: number;
  unresolved_learning_items: number;
};

export function aggregateScoopLearningReport(report: ScoopLearningReport): ScoopLearningAggregateReport {
  return {
    totals: report.totals,
    learning: report.learning,
    failure_categories: report.failure_categories.map(({ category, subcategory, failures }) => ({
      category,
      subcategory,
      failures,
    })),
    provider_corrections: report.provider_query_patterns.map(({ provider, corrections }) => ({
      provider,
      corrections,
    })),
    repeated_bad_candidate_count: report.repeated_bad_candidates.length,
    unresolved_learning_items: report.learning_queue.length,
  };
}
