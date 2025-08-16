export interface Division {
  slug: string;
  title: string;
  subtitle?: string;
  stagePill?: string;
  images?: string[];
  contacts?: { name: string; title?: string }[];
  focus?: string[];
  docs?: { label: string; url: string }[];
  doneSoFar?: string[];
  nextSteps?: string[];
  facts?: string[];
}

export const divisions: Record<string, Division> = {
  niger: {
    slug: "niger",
    title: "Niger State",
    subtitle: "The Power State",
    stagePill: "In Discussion",
    images: [
      "https://ik.imagekit.io/tzublgy5d/Article6/Niger%20State/Niger%20meeting%202.jpeg",
      "https://ik.imagekit.io/tzublgy5d/Article6/Niger%20State/Niger%20meeting.jpeg",
    ],
    contacts: [
      {
        name: "Dr. Matthew Ahmed",
        title: "Permanent Secretary, Ministry of Agriculture & Food Security",
      },
    ],
    focus: ["Rice (AWD)", "Forestry MRV"],
    docs: [
      { label: "EOI (Niger)", url: "/docs/niger_eoi.pdf" },
      { label: "Proposal (Niger)", url: "/docs/niger_proposal.pdf" },
      { label: "MOU (Niger)", url: "/docs/niger_mou.pdf" },
      { label: "LOS (Niger)", url: "/docs/niger_los.pdf" },
    ],
    doneSoFar: [
      "Intro call with Dr. Matthew Ahmed (Perm Sec) – proposal discussed",
      "EOI, Proposal, MOU, LOS sent for review",
      "Drinks with Niger State delegation in Abuja for alignment",
    ],
    nextSteps: [
      "Finalize MOU with state leadership",
      "Plan field pilot in rice paddies",
    ],
    facts: [],
  },
  plateau: {
    slug: "plateau",
    title: "Plateau State",
    subtitle: "Home of Peace and Tourism",
    stagePill: "Early Engagement",
    contacts: [
      {
        name: "Mr. Yakubu Nuhu",
        title: "Special Adviser to the Governor on Carbon",
      },
    ],
    focus: ["Rice (AWD)", "Forestry MRV"],
    docs: [
      { label: "EOI (Plateau)", url: "/docs/plateau_eoi.pdf" },
      { label: "Proposal (Plateau)", url: "/docs/plateau_proposal.pdf" },
      { label: "MOU (Plateau)", url: "/docs/plateau_mou.pdf" },
      { label: "LOS (Plateau)", url: "/docs/plateau_los.pdf" },
    ],
    doneSoFar: [
      "4-document pack shared via advisor (EOI, Proposal, MOU, LOS)",
      "SA on Carbon Credit reviewing; next meeting to be scheduled",
    ],
    nextSteps: ["Schedule review meeting", "Plan site visit"],
    facts: [],
  },
  oyo: {
    slug: "oyo",
    title: "Oyo State",
    subtitle: "The Pace Setter State",
    facts: [],
  },
};

export function getDivision(slug: string): Division | undefined {
  return divisions[slug];
}

