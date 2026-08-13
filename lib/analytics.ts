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

const PUBLIC_FUNNEL_ROUTES = new Set(['/', '/sample-assessment', '/how-it-works']);

export function isPublicFunnelRoute(pathname: string): boolean {
  return PUBLIC_FUNNEL_ROUTES.has(pathname);
}

export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  if (typeof window === 'undefined' || !isPublicFunnelRoute(window.location.pathname)) return;

  try {
    track(event, properties);
  } catch {
    // Analytics must never interrupt the user journey.
  }
}
