export interface Project {
  slug: string;
  title: string;
  epithet?: string;
  summary?: string;
  status?: "pending" | "active" | "discussion" | string;
  tags?: string[];
  updatedAt?: string;
  ctaLabel?: string;
  progress: number; // 0–100 (percentage completion)
}

export const projects: Project[] = [
  {
    slug: "niger",
    title: "Niger State",
    epithet: "The Power State",
    summary: "Intro call with the Perm Sec's office; proposal shared.",
    status: "discussion",
    progress: 68,
  },
  {
    slug: "kwara",
    title: "Kwara State",
    epithet: "The State of Harmony",
    summary: "Introductions via Ministry of Agric; awaiting EXCO briefing.",
    status: "pending",
    progress: 45,
  },
  {
    slug: "plateau",
    title: "Plateau State",
    epithet: "Home of Peace and Tourism",
    summary: "Four-document pack under review by SA on Carbon Credit.",
    status: "pending",
    progress: 30,
  },
];
