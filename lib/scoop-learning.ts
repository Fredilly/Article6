type ScoopAdminAuthResponse = {
  admin?: boolean;
  session_token?: string;
  error?: string;
};

export type ScoopLearningReport = {
  session_id: string | null;
  totals: {
    feedback_count?: number;
    wrong_count?: number;
    correct_count?: number;
  };
  learning: {
    scoop_count?: number;
    results_count?: number;
    no_results_count?: number;
    avg_latency_ms?: number;
    verification_cost_usd?: number;
  };
  corrections: Array<Record<string, unknown>>;
  learning_queue: Array<{
    event_id: string;
    session_id?: string | null;
    state?: string;
    evidence_key?: string;
    category?: string;
    subcategory?: string;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
    material?: string | null;
    visible_text_json?: string;
    logos_markings_json?: string;
    distinctive_features_json?: string;
    shape_silhouette_json?: string;
    style_attributes_json?: string;
    vision_model?: string | null;
    latency_ms?: number;
    verification_cost_usd?: number;
    verified_canonical_key?: string | null;
    created_at?: string;
    result_id: string;
    feedback_type: string;
    candidate_key?: string | null;
    provider?: string | null;
    provenance?: string | null;
    result_class?: string | null;
  }>;
  failure_categories: Array<{
    category?: string;
    subcategory?: string;
    failures?: number;
  }>;
  repeated_bad_candidates: Array<{
    evidence_key?: string;
    candidate_key?: string;
    wrong_count?: number;
    correct_count?: number;
  }>;
  provider_query_patterns: Array<{
    provider?: string;
    query_text?: string;
    corrections?: number;
  }>;
};

export type ScoopLearningReviewAction = "dismiss" | "hard_negative" | "verify_product";

export type ScoopLearningReviewInput = {
  event_id: string;
  result_id: string;
  action: ScoopLearningReviewAction;
  note?: string;
  product?: {
    destination: string;
    id?: string;
    model?: string;
    title?: string;
    brand?: string;
    image_reference?: string;
  };
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function scoopAdminSession(): Promise<string> {
  const credential = process.env.SCOOP_ALPHA_ADMIN_TOKEN || "";
  if (!credential) throw new Error("Scoop alpha admin credential is not configured.");

  const response = await fetch("https://api.vcl.article6.org/admin/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential, label: "Article6 CRM" }),
  });
  const auth = await response.json().catch(() => ({})) as ScoopAdminAuthResponse;
  if (!response.ok || !auth.session_token) {
    throw new Error(clean(auth.error, 200) || "Could not authenticate with the Scoop API.");
  }
  return auth.session_token;
}

export async function getScoopLearningReport(): Promise<ScoopLearningReport> {
  const session = await scoopAdminSession();
  const response = await fetch("https://api.vcl.article6.org/feedback-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Scoop-Admin-Session": session,
    },
    body: JSON.stringify({}),
  });
  const data = await response.json().catch(() => ({})) as Partial<ScoopLearningReport> & { error?: string };
  if (!response.ok) throw new Error(clean(data.error, 200) || "Could not load Scoop learning data.");
  return {
    session_id: data.session_id ?? null,
    totals: data.totals ?? {},
    learning: data.learning ?? {},
    corrections: Array.isArray(data.corrections) ? data.corrections : [],
    learning_queue: Array.isArray(data.learning_queue) ? data.learning_queue : [],
    failure_categories: Array.isArray(data.failure_categories) ? data.failure_categories : [],
    repeated_bad_candidates: Array.isArray(data.repeated_bad_candidates) ? data.repeated_bad_candidates : [],
    provider_query_patterns: Array.isArray(data.provider_query_patterns) ? data.provider_query_patterns : [],
  };
}

export async function reviewScoopLearning(input: ScoopLearningReviewInput): Promise<{ canonical_key?: string | null }> {
  const session = await scoopAdminSession();
  const response = await fetch("https://api.vcl.article6.org/feedback-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Scoop-Admin-Session": session,
    },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({})) as { error?: string; canonical_key?: string | null };
  if (!response.ok) throw new Error(clean(data.error, 200) || "Could not review Scoop learning item.");
  return { canonical_key: data.canonical_key ?? null };
}
