export const SLUGS = [
  "abia",
  "adamawa",
  "akwa-ibom",
  "anambra",
  "bauchi",
  "bayelsa",
  "benue",
  "borno",
  "cross-river",
  "delta",
  "ebonyi",
  "edo",
  "ekiti",
  "enugu",
  "fct",
  "gombe",
  "imo",
  "jigawa",
  "kaduna",
  "kano",
  "katsina",
  "kebbi",
  "kogi",
  "kwara",
  "lagos",
  "nasarawa",
  "niger",
  "ogun",
  "ondo",
  "osun",
  "oyo",
  "plateau",
  "rivers",
  "sokoto",
  "taraba",
  "yobe",
  "zamfara",
] as const;

export const STATES = Object.fromEntries(
  SLUGS.map((s) => [s, { name: s === "fct" ? "FCT" : toTitle(s) }])
) as Record<string, { name: string }>;

export const ACTIVE = [] as string[];
export const PIPELINE = ["niger", "kwara", "plateau"] as string[];

export const META: Record<string, { tag?: string }> = {
  niger: { tag: "Rice & Forestry MRV" },
  kwara: { tag: "Renewable + Agro pilots" },
  plateau: { tag: "Highland Reforestation" },
  // add as needed
};

export function toTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
