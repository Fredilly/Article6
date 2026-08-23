export interface PreviewNavLink {
  href: string;
  label: string;
}

const PREVIEW_BASE = '/preview/verification-readiness';
const PRODUCTION_BASE = '';

export function getPreviewNavigationLinks(isPreview: boolean): PreviewNavLink[] {
  const base = isPreview ? PREVIEW_BASE : PRODUCTION_BASE;
  return [
    { href: `${base}/sample-assessment`, label: 'Sample Report' },
    { href: `${base}/how-it-works`, label: 'How It Works' },
  ];
}

export function getPreviewCtaLink(isPreview: boolean): PreviewNavLink {
  return {
    href: `${isPreview ? PREVIEW_BASE : '/'}#upload-pdd`,
    label: 'Upload your PDD',
  };
}
