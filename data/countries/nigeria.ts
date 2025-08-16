import { SLUGS, ACTIVE, toTitle } from "@/data/country";

type Fact = { id?: string; text: string };
export interface Division {
  slug: string;
  title: string;
  inPipeline?: boolean;
  facts?: Fact[];
}

const pipelineSlugs = new Set(ACTIVE);
const baseDivisions: Division[] = SLUGS.map((slug) => ({
  slug,
  title: toTitle(slug),
  inPipeline: pipelineSlugs.has(slug),
}));

export const nigeria = {
  divisions: baseDivisions.map((d) => {
    if (d.slug === "oyo") {
      return {
        ...d,
        inPipeline: d.inPipeline ?? false,
        facts: d.facts ?? [
          { id: "capital", text: "Capital: Ibadan." },
          { id: "created", text: "Created: 1976." },
          { id: "note", text: "University of Ibadan (1948) is Nigeria’s oldest." },
        ],
      };
    }
    if (d.slug === "lagos") {
      return {
        ...d,
        facts: d.facts ?? [
          { text: "Capital: Ikeja." },
          { text: "Created: 1967." },
          { text: "Lagos was federal capital until 1991 and remains the commercial hub." },
        ],
      };
    }
    if (d.slug === "niger") {
      return {
        ...d,
        facts: d.facts ?? [
          { text: "Capital: Minna." },
          { text: "Created: 1976." },
          { text: "Hosts Kainji and Shiroro hydropower dams." },
        ],
      };
    }
    return d;
  }),
};
