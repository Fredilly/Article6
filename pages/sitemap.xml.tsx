import { GetServerSideProps } from "next";
import { states } from "@/data/states";

function generateSiteMap(baseUrl: string) {
  const urls = [
    `${baseUrl}/projects/nigeria`,
    ...states.flatMap((s) => [
      `${baseUrl}/projects/nigeria/states/${s.slug}`,
      `${baseUrl}/projects/nigeria/states/${s.slug}/facts`,
    ]),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join("\n")}\n</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res, req }) => {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "";
  const sitemap = generateSiteMap(`${proto}://${host}`);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function SiteMap() {
  return null;
}
