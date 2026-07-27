export interface PreviewNavLink {
  href: string;
  label: string;
}

const BASE = '/preview/verification-readiness';

export const previewNavigationLinks: PreviewNavLink[] = [
  { href: `${BASE}/vm0007`, label: 'VM0007 Assessment' },
  { href: `${BASE}/sample-assessment`, label: 'Sample Assessment' },
  { href: `${BASE}/how-it-works`, label: 'How It Works' },
  { href: `${BASE}/about`, label: 'About' },
];

export const previewCtaLink: PreviewNavLink = {
  href: `${BASE}/request-assessment`,
  label: 'Request Assessment',
};
