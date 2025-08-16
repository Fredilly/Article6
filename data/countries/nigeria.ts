import { SLUGS, toTitle } from "../country";

export interface Fact {
  id?: string;
  text: string;
  sourceUrl?: string;
}

export interface Division {
  slug: string;
  title: string;
  facts?: Fact[];
}

const factsMap: Record<string, Fact[]> = {
  oyo: [
    { text: "Capital: Ibadan." },
    { text: "Created: 1976." },
    { text: "UI (1948) is Nigeria’s oldest." },
  ],
  lagos: [
    { text: "Capital: Ikeja." },
    { text: "Created: 1967." },
    { text: "Former federal capital until 1991." },
  ],
  niger: [
    { text: "Capital: Minna." },
    { text: "Created: 1976." },
    { text: "Hosts Kainji & Shiroro hydropower dams." },
  ],
};

export const nigeria = {
  divisions: SLUGS.map((slug) => ({
    slug,
    title: `${toTitle(slug)} State`,
    ...(factsMap[slug] ? { facts: factsMap[slug] } : {}),
  })) as Division[],
};

if (process.env.NODE_ENV !== "production") {
  const missing = SLUGS.filter(
    (slug) => !nigeria.divisions.find((d) => d.slug === slug)
  );
  if (missing.length) {
    console.warn("Missing divisions for:", missing);
  }
}

