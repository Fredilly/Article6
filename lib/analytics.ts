import { track } from '@vercel/analytics';

export type AnalyticsEvent =
  | 'homepage_primary_cta'
  | 'sample_assessment_view'
  | 'sample_pdf_download'
  | 'upload_section_view'
  | 'upload_file_selected'
  | 'scope_review_started'
  | 'scope_review_submitted';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  try {
    track(event, properties);
  } catch {
    // Analytics must never interrupt the user journey.
  }
}
