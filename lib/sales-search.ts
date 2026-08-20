import type { SalesOrganizationDetail } from "./sales-store";
import type { SalesMemorySearchEntry } from "../components/SalesMemorySearch";

export function buildSalesMemorySearchEntries(details: SalesOrganizationDetail[]): SalesMemorySearchEntry[] {
  const entries: SalesMemorySearchEntry[] = [];

  for (const detail of details) {
    const { organization, projects, contacts } = detail;
    const common = {
      status: organization.status,
      doNotContact: organization.doNotContact,
    };

    entries.push({
      ...common,
      key: `organization-${organization.id}`,
      kind: "organization",
      organizationId: organization.id,
      title: organization.name,
      subtitle: [organization.domain || "No domain", organization.experiment].join(" · "),
      searchText: [organization.name, organization.domain, organization.experiment].filter(Boolean).join(" ").toLowerCase(),
    });

    for (const project of projects) {
      entries.push({
        ...common,
        key: `project-${organization.id}-${project.id}`,
        kind: "project",
        organizationId: organization.id,
        title: project.vcsId ? `VCS ${project.vcsId} · ${project.name}` : project.name,
        subtitle: [organization.name, project.methodology && `${project.methodology}${project.methodologyVersion ? ` ${project.methodologyVersion}` : ""}`].filter(Boolean).join(" · "),
        searchText: [project.vcsId, project.name, project.methodology, project.methodologyVersion, organization.name, organization.experiment].filter(Boolean).join(" ").toLowerCase(),
      });
    }

    for (const contact of contacts) {
      entries.push({
        ...common,
        key: `contact-${organization.id}-${contact.id}`,
        kind: "contact",
        organizationId: organization.id,
        title: contact.name,
        subtitle: [organization.name, contact.email].filter(Boolean).join(" · "),
        searchText: [contact.name, contact.email, organization.name, organization.experiment].filter(Boolean).join(" ").toLowerCase(),
      });
    }
  }

  return entries;
}
