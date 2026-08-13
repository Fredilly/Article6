import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import { getSalesOrganizationDetail, listSalesOrganizations } from "../../../lib/sales-store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Internal session required." });
  if (req.method !== "GET") return res.status(405).setHeader("Allow", "GET").json({ error: "Method not allowed." });

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) return res.status(200).json({ results: [] });

  const organizations = (await listSalesOrganizations(q)).slice(0, 8);
  const details = await Promise.all(organizations.map((organization) => getSalesOrganizationDetail(organization.id)));
  const needle = q.toLowerCase();
  const results: Array<Record<string, unknown>> = [];

  for (const detail of details) {
    if (!detail) continue;
    const { organization, projects, contacts } = detail;
    const base = {
      organizationId: organization.id,
      organizationName: organization.name,
      status: organization.status,
      doNotContact: organization.doNotContact,
    };

    for (const project of projects) {
      const haystack = [project.name, project.vcsId, project.methodology, project.methodologyVersion].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(needle)) continue;
      results.push({
        ...base,
        kind: "project",
        title: project.vcsId ? `VCS ${project.vcsId} · ${project.name}` : project.name,
        subtitle: [organization.name, project.methodology && `${project.methodology}${project.methodologyVersion ? ` ${project.methodologyVersion}` : ""}`].filter(Boolean).join(" · "),
      });
    }

    const orgHaystack = [organization.name, organization.domain].filter(Boolean).join(" ").toLowerCase();
    if (orgHaystack.includes(needle)) {
      results.push({ ...base, kind: "organization", title: organization.name, subtitle: organization.domain || "No domain" });
    }

    for (const contact of contacts) {
      const haystack = [contact.name, contact.email].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(needle)) continue;
      results.push({ ...base, kind: "contact", title: contact.name, subtitle: [organization.name, contact.email].filter(Boolean).join(" · ") });
    }
  }

  const priority = { project: 0, organization: 1, contact: 2 } as const;
  results.sort((a, b) => priority[a.kind as keyof typeof priority] - priority[b.kind as keyof typeof priority]);
  return res.status(200).json({ results: results.slice(0, 12) });
}
