export interface StateInfo {
  slug: string;
  title: string;
  epithet: string;
  status: string;
  timeline: string[];
  documents: string[];
}

export const states: StateInfo[] = [
  {
    slug: 'niger',
    title: 'Niger State',
    epithet: 'The Power State',
    status: 'In Discussion',
    timeline: [
      'Introductions completed with Perm Sec and Commissioners',
      'Proposal, EOI, and MOU shared',
      'Dinner with delegation in Abuja to align on scope',
    ],
    documents: ['EOI', 'Proposal', 'MOU'],
  },
  {
    slug: 'kwara',
    title: 'Kwara State',
    epithet: 'The State of Harmony',
    status: 'Pending Agreement',
    timeline: [
      'Introductions made via Ministry of Agric',
      'EOI, Proposal, MOU, and LOS shared',
      'Awaiting formal invitation or signing window',
    ],
    documents: ['EOI', 'Proposal', 'MOU', 'LOS'],
  },
  {
    slug: 'plateau',
    title: 'Plateau State',
    epithet: 'Home of Peace and Tourism',
    status: 'Early Engagement',
    timeline: [
      'Introductions via Ministry',
      '4-doc pack shared (EOI, Proposal, MOU, LOS)',
      'Awaiting review by SA on Carbon Credit and follow-up meeting',
    ],
    documents: ['EOI', 'Proposal', 'MOU', 'LOS'],
  },
];

export function getStateBySlug(slug: string): StateInfo | undefined {
  return states.find((s) => s.slug === slug);
}
