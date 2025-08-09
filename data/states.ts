export interface StateInfo {
  slug: string;
  title: string;
  epithet: string;
  status: string;
  timeline: string[];
  docs: { label: string; href: string }[];
}

export const states: StateInfo[] = [
  {
    slug: 'niger',
    title: 'Niger State',
    epithet: 'The Power State',
    status: 'In Discussion',
    timeline: [
      'Intro call with Dr. Ladan (Perm Sec’s office) – proposal discussed',
      'EOI, Proposal, MOU, LOS sent for review',
      'Dinner with Niger State delegation in Abuja for alignment',
    ],
    docs: [
      { label: 'EOI (Niger)', href: '/docs/niger_eoi.pdf' },
      { label: 'Proposal (Niger)', href: '/docs/niger_proposal.pdf' },
      { label: 'MOU (Niger)', href: '/docs/niger_mou.pdf' },
      { label: 'LOS (Niger)', href: '/docs/niger_los.pdf' },
    ],
  },
  {
    slug: 'kwara',
    title: 'Kwara State',
    epithet: 'The State of Harmony',
    status: 'Pending Agreement',
    timeline: [
      'Introductions via Ministry of Agric; multiple follow-ups',
      'EOI, Proposal, MOU, LOS shared',
      'Awaiting formal invitation window to brief EXCO',
    ],
    docs: [
      { label: 'EOI (Kwara)', href: '/docs/kwara_eoi.pdf' },
      { label: 'Proposal (Kwara)', href: '/docs/kwara_proposal.pdf' },
      { label: 'MOU (Kwara)', href: '/docs/kwara_mou.pdf' },
      { label: 'LOS (Kwara)', href: '/docs/kwara_los.pdf' },
    ],
  },
  {
    slug: 'plateau',
    title: 'Plateau State',
    epithet: 'Home of Peace and Tourism',
    status: 'Early Engagement',
    timeline: [
      '4-document pack shared via advisor (EOI, Proposal, MOU, LOS)',
      'SA on Carbon Credit reviewing; next meeting to be scheduled',
    ],
    docs: [
      { label: 'EOI (Plateau)', href: '/docs/plateau_eoi.pdf' },
      { label: 'Proposal (Plateau)', href: '/docs/plateau_proposal.pdf' },
      { label: 'MOU (Plateau)', href: '/docs/plateau_mou.pdf' },
      { label: 'LOS (Plateau)', href: '/docs/plateau_los.pdf' },
    ],
  },
];

export function getStateBySlug(slug: string): StateInfo | undefined {
  return states.find((s) => s.slug === slug);
}
