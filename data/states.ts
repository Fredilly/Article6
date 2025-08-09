export interface StateInfo {
  slug: string;
  title: string;
  epithet: string;
  status: string;
}

export const states: StateInfo[] = [
  { slug: 'niger', title: 'Niger State', epithet: 'The Power State', status: 'In Discussion' },
  { slug: 'kwara', title: 'Kwara State', epithet: 'The State of Harmony', status: 'Pending Agreement' },
  { slug: 'plateau', title: 'Plateau State', epithet: 'Home of Peace and Tourism', status: 'Early Engagement' },
];

export function getStateBySlug(slug: string): StateInfo | undefined {
  return states.find((s) => s.slug === slug);
}
