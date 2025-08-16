export type NigeriaDivision = {
  slug: string;
  title: string;
  inPipeline: boolean;
  facts?: { id?: string; text: string }[];
};

export const nigeria: { divisions: NigeriaDivision[] } = {
  divisions: [
    {
      slug: "kwara",
      title: "Kwara",
      inPipeline: true,
      facts: [{ text: "Pilot renewable and agro projects." }],
    },
    {
      slug: "oyo",
      title: "Oyo",
      inPipeline: false,
    },
    // add more states as needed
  ],
};
