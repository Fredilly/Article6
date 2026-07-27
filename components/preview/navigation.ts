export interface PreviewNavLink {
  href: string;
  label: string;
}

const BASE = '/preview/verification-readiness';

export const previewNavigationLinks: PreviewNavLink[] = [
  { href: `${BASE}/sample-assessment`, label: 'Sample Report' },
  { href: `${BASE}/how-it-works`, label: 'How It Works' },
];

export const previewCtaLink: PreviewNavLink = {
  href: `${BASE}#upload-pdd`,
  label: 'Upload PDD',
};
